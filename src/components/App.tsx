/*global Dingdocs*/

import { useEffect, useState } from 'react';
import { initView } from 'dingtalk-docs-cool-app';
import { Typography, Button, Select, DatePicker, Card, Space, message, ConfigProvider, Divider } from 'dingtalk-design-desktop';
import zhCN from 'dingtalk-design-desktop/es/locale/zh_CN';
import { getLocale, type Locales } from './locales.ts';
import { configDingdocsPermission } from '../utils/permission.ts';
import './style.css';

// 扩展中文语言包
const zhCNLocale = {
  ...zhCN,
  DatePicker: {
    ...(zhCN.DatePicker || {}),
    lang: {
      ...(zhCN.DatePicker?.lang || {}),
      shortMonths: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      shortWeekDays: ['日', '一', '二', '三', '四', '五', '六'],
    },
  },
};

interface Sheet {
  id: string;
  name: string;
}

function App() {
  const [locale, setLocale] = useState<Locales>(getLocale('zh-CN'));
  const [loading, setLoading] = useState<boolean>(false);
  const [permissionReady, setPermissionReady] = useState<boolean>(false);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    initView({
      onReady: async () => {
        try {
          console.log('[初始化] 开始配置权限...');
          // 配置钉钉权限
          await configDingdocsPermission();
          console.log('[初始化] 权限配置完成');

          const currentLocale = await Dingdocs.base.host.getLocale();
          setLocale(getLocale(currentLocale));

          // 权限配置成功后立即加载数据表
          console.log('[初始化] 开始加载数据表...');
          const sheetList = await Dingdocs.script.run('getAllSheets', { timeout: 30000 });
          console.log('[初始化] 获取到数据表:', sheetList.length, '个');
          setSheets(sheetList);
          if (sheetList.length > 0) {
            setSelectedSheetId(sheetList[0].id);
          }

          // 所有初始化完成后标记权限已就绪
          setPermissionReady(true);
        } catch (e) {
          console.error('[初始化] 失败:', e);
          message.error('初始化失败，请刷新页面重试');
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSheets = async () => {
    try {
      console.log('[加载数据表] 开始获取数据表列表...');
      const sheetList = await Dingdocs.script.run('getAllSheets');
      console.log('[加载数据表] 获取到数据表:', sheetList.length, '个');
      setSheets(sheetList);
      if (sheetList.length > 0 && !selectedSheetId) {
        setSelectedSheetId(sheetList[0].id);
      }
    } catch (error: any) {
      console.error('[加载数据表] 失败:', error);
      message.error(`${locale.operationFailed}: ${error.message}`);
    }
  };

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
    console.log(msg);
  };

  const handleSync = async () => {
    // 确保权限已配置
    if (!permissionReady) {
      message.error('权限未就绪，请稍后重试');
      return;
    }

    if (!selectedSheetId) {
      message.warning(locale.pleaseSelectSheet);
      return;
    }

    if (!dateRange || !dateRange[0]) {
      message.warning(locale.pleaseSelectDate);
      return;
    }

    setLogs([]);
    setLoading(true);

    const startDate = formatDate(dateRange[0]);
    const endDate = dateRange[1] ? formatDate(dateRange[1]) : startDate;
    const dateText = startDate === endDate ? startDate : `${startDate} 至 ${endDate}`;

    addLog('开始同步数据...');
    addLog(`数据表: ${sheets.find(s => s.id === selectedSheetId)?.name || selectedSheetId}`);
    addLog(`日期: ${dateText}`);

    try {
      // 步骤1：获取后端数据
      addLog('步骤1/5: 正在请求后端数据...');
      const backendData = await Dingdocs.script.run(
        'fetchBackendData',
        startDate,
        startDate === endDate ? undefined : endDate
      );
      addLog(`✓ 获取到 ${backendData.length} 条后端数据`);

      // 步骤2：获取表格现有记录
      addLog('步骤2/5: 正在获取表格现有数据...');
      const existingRecords = await Dingdocs.script.run('getExistingRecords', selectedSheetId);
      addLog(`✓ 表格现有 ${existingRecords.length} 条记录`);

      // 步骤3：计算同步差异
      addLog('步骤3/5: 正在计算同步差异...');
      const syncDiff = await Dingdocs.script.run(
        'calculateSyncDiff',
        selectedSheetId,
        backendData,
        existingRecords
      );
      addLog(`✓ 需要删除 ${syncDiff.recordsToDelete.length} 条，新增 ${syncDiff.recordsToInsert.length} 条`);

      // 步骤4：执行删除操作
      if (syncDiff.recordsToDelete.length > 0) {
        addLog('步骤4/5: 正在删除多余记录...');
        await Dingdocs.script.run('syncBatchDelete', selectedSheetId, syncDiff.recordsToDelete);
        addLog(`✓ 删除完成`);
      } else {
        addLog('步骤4/5: 无需删除记录');
      }

      // 步骤5：并发执行插入操作
      if (syncDiff.recordsToInsert.length > 0) {
        addLog(`步骤5/5: 正在插入新记录（共 ${syncDiff.totalBatches} 个批次）...`);

        const batchSize = 500;
        const insertPromises = [];

        for (let i = 0; i < syncDiff.recordsToInsert.length; i += batchSize) {
          const batch = syncDiff.recordsToInsert.slice(i, i + batchSize);
          const batchIndex = Math.floor(i / batchSize);

          // 并发执行所有批次的插入
          insertPromises.push(
            Dingdocs.script.run(
              'syncBatchInsert',
              selectedSheetId,
              batch,
              batchIndex,
              syncDiff.totalBatches
            )
          );
        }

        // 等待所有插入批次完成
        await Promise.all(insertPromises);
        addLog(`✓ 插入完成，共 ${syncDiff.recordsToInsert.length} 条`);
      } else {
        addLog('步骤5/5: 无需插入记录');
      }

      const summary = `同步完成！新增 ${syncDiff.recordsToInsert.length} 条，删除 ${syncDiff.recordsToDelete.length} 条`;
      addLog(`✅ ${summary}`);
      message.success(summary);
    } catch (error: any) {
      const errorMsg = error?.message || JSON.stringify(error) || '未知错误';
      addLog(`❌ 同步失败: ${errorMsg}`);
      message.error(`${locale.syncFailed}: ${errorMsg}`);
      console.error('完整错误信息:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <ConfigProvider locale={zhCNLocale as any}>
      <div className='page'>
        <div className='header'>
          <Typography.Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            📊 {locale.title}
          </Typography.Title>
        </div>
        <div className='content'>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Typography.Text strong style={{ fontSize: '14px', color: '#262626' }}>
                  📋 {locale.selectSheet}
                </Typography.Text>
                <Select
                  size="large"
                  style={{ width: '100%', marginTop: '8px' }}
                  value={selectedSheetId}
                  onChange={(value) => setSelectedSheetId(value as string)}
                  placeholder={locale.pleaseSelectSheet}
                >
                  {sheets.map((sheet) => (
                    <Select.Option key={sheet.id} value={sheet.id}>
                      {sheet.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div>
                <Typography.Text strong style={{ fontSize: '14px', color: '#262626' }}>
                  📅 {locale.selectDate}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                  (选择单日或日期范围)
                </Typography.Text>
                <Space.Compact style={{ width: '100%', marginTop: '8px' }}>
                  <DatePicker
                    size="large"
                    style={{ width: '50%' }}
                    value={dateRange?.[0]}
                    onChange={(date) => {
                      if (date) {
                        setDateRange([date, dateRange?.[1] || date]);
                      } else {
                        setDateRange(null);
                      }
                    }}
                    placeholder={locale.startDate}
                  />
                  <DatePicker
                    size="large"
                    style={{ width: '50%' }}
                    value={dateRange?.[1] || dateRange?.[0]}
                    onChange={(date) => {
                      if (date && dateRange?.[0]) {
                        setDateRange([dateRange[0], date]);
                      }
                    }}
                    placeholder={locale.endDate}
                    disabled={!dateRange?.[0]}
                  />
                </Space.Compact>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <Button
                type="primary"
                size="large"
                block
                loading={loading}
                disabled={!permissionReady || loading}
                onClick={handleSync}
                style={{ height: '44px', fontSize: '16px', fontWeight: 500 }}
              >
                {!permissionReady ? '⏳ 正在初始化...' : loading ? `⏳ ${locale.syncing}` : `🚀 ${locale.syncData}`}
              </Button>

              {logs.length > 0 && (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <Card
                    size="small"
                    title={<span style={{ fontSize: '13px' }}>📝 同步日志</span>}
                    style={{ backgroundColor: '#fafafa' }}
                  >
                    <div style={{
                      maxHeight: '240px',
                      overflow: 'auto',
                      fontSize: '12px',
                      fontFamily: 'Consolas, Monaco, monospace',
                      lineHeight: '1.6'
                    }}>
                      {logs.map((log, index) => (
                        <div
                          key={index}
                          style={{
                            marginBottom: '4px',
                            padding: '2px 0',
                            color: log.includes('失败') || log.includes('错误') ? '#ff4d4f' : '#595959'
                          }}
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}
            </Space>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default App;
