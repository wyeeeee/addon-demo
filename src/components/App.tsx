/*global Dingdocs*/

import { useEffect, useState } from 'react';
import { initView } from 'dingtalk-docs-cool-app';
import { Typography, Button, Select, DatePicker, Card, Space, message, ConfigProvider, Divider } from 'dingtalk-design-desktop';
import zhCN from 'dingtalk-design-desktop/es/locale/zh_CN';
import { getLocale, type Locales } from './locales.ts';
import { configDingdocsPermission } from '../utils/permission.ts';
import './style.css';

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

interface MappingConfig {
  id: string;
  name: string;
  description: string;
}

function App() {
  const [locale, setLocale] = useState<Locales>(getLocale('zh-CN'));
  const [loading, setLoading] = useState<boolean>(false);
  const [permissionReady, setPermissionReady] = useState<boolean>(false);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [mappingConfigs, setMappingConfigs] = useState<MappingConfig[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [selectedMappingId, setSelectedMappingId] = useState<string>('');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    initView({
      onReady: async () => {
        try {
          console.log('[初始化] 开始配置权限...');
          await configDingdocsPermission();
          console.log('[初始化] 权限配置完成');

          const currentLocale = await Dingdocs.base.host.getLocale();
          setLocale(getLocale(currentLocale));

          // 加载数据表
          console.log('[初始化] 开始加载数据表...');
          const sheetList = await Dingdocs.script.run('getAllSheets');
          console.log('[加载数据表] 获取到数据表:', sheetList.length, '个');
          setSheets(sheetList);
          if (sheetList.length > 0) {
            setSelectedSheetId(sheetList[0].id);
          }

          // 加载映射配置
          console.log('[初始化] 开始加载映射配置...');
          const configs = await Dingdocs.script.run('getAllMappingConfigs');
          console.log('[加载映射配置] 获取到配置:', configs.length, '个');
          setMappingConfigs(configs);
          if (configs.length > 0) {
            setSelectedMappingId(configs[0].id);
          }

          setPermissionReady(true);
        } catch (e) {
          console.error('[初始化] 失败:', e);
          message.error('初始化失败，请刷新页面重试');
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
    console.log(msg);
  };

  const handleSync = async () => {
    if (!permissionReady) {
      message.error('权限未就绪，请稍后重试');
      return;
    }

    if (!selectedSheetId) {
      message.warning(locale.pleaseSelectSheet);
      return;
    }

    if (!selectedMappingId) {
      message.warning('请选择字段映射配置');
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
    addLog(`映射配置: ${mappingConfigs.find(m => m.id === selectedMappingId)?.name || selectedMappingId}`);
    addLog(`日期: ${dateText}`);

    try {
      // 获取映射配置
      const configs = await Dingdocs.script.run('getAllMappingConfigs');
      const config = configs.find((c: any) => c.id === selectedMappingId);
      if (!config) {
        throw new Error(`未找到映射配置: ${selectedMappingId}`);
      }

      // 构建 API URL
      const apiUrl = endDate && startDate !== endDate
        ? `${config.apiEndpoint}?start_date=${startDate}&end_date=${endDate}`
        : `${config.apiEndpoint}?date=${startDate}`;

      // 请求后端数据
      addLog('正在请求后端数据...');
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.code !== 0) {
        throw new Error(result.msg || '获取数据失败');
      }

      const backendData = result.data || [];
      addLog(`✅ 获取到后端数据 ${backendData.length} 条`);

      // 调试：打印第一条数据的结构
      if (backendData.length > 0) {
        console.log('[调试] 第一条后端数据:', backendData[0]);
        console.log('[调试] 数据字段:', Object.keys(backendData[0]));
      }

      // 获取表格现有数据
      addLog('正在获取表格现有数据...');
      const existingRecords = await Dingdocs.script.run('getSheetAllRecords', selectedSheetId);
      addLog(`✅ 表格现有记录 ${existingRecords.length} 条`);

      // UI 端比对数据
      addLog('正在比对数据差异...');
      const { recordsToDelete, recordsToInsert } = await Dingdocs.script.run(
        'compareData',
        selectedMappingId,
        backendData,
        existingRecords
      );

      addLog(`✅ 数据比对完成: 需删除 ${recordsToDelete.length} 条，需新增 ${recordsToInsert.length} 条`);

      let totalDeleted = 0;
      let totalInserted = 0;

      // 分批删除
      if (recordsToDelete.length > 0) {
        addLog(`开始删除多余记录...`);
        const BATCH_SIZE = 1000;
        const totalBatches = Math.ceil(recordsToDelete.length / BATCH_SIZE);

        for (let i = 0; i < recordsToDelete.length; i += BATCH_SIZE) {
          const batch = recordsToDelete.slice(i, i + BATCH_SIZE);
          const batchNum = Math.floor(i / BATCH_SIZE) + 1;

          addLog(`正在删除第 ${batchNum}/${totalBatches} 批 (${batch.length} 条)...`);
          const deleteResult = await Dingdocs.script.run('batchDeleteRecords', selectedSheetId, batch);
          totalDeleted += deleteResult.deletedCount;
          addLog(`✅ 第 ${batchNum} 批删除完成，已删除 ${totalDeleted}/${recordsToDelete.length} 条`);
        }
      }

      // 分批插入
      if (recordsToInsert.length > 0) {
        addLog(`开始插入新记录...`);
        const BATCH_SIZE = 1000;
        const totalBatches = Math.ceil(recordsToInsert.length / BATCH_SIZE);

        for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
          const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
          const batchNum = Math.floor(i / BATCH_SIZE) + 1;

          addLog(`正在插入第 ${batchNum}/${totalBatches} 批 (${batch.length} 条)...`);
          const insertResult = await Dingdocs.script.run('batchInsertRecords', selectedSheetId, batch);
          totalInserted += insertResult.insertedCount;
          addLog(`✅ 第 ${batchNum} 批插入完成，已插入 ${totalInserted}/${recordsToInsert.length} 条`);
        }
      }

      const summaryMsg = `增量同步完成: 新增 ${totalInserted} 条，删除 ${totalDeleted} 条`;
      addLog(`✅ ${summaryMsg}`);
      message.success(`${locale.syncSuccess}！${summaryMsg}`);
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
                  🔗 选择字段映射配置
                </Typography.Text>
                <Select
                  size="large"
                  style={{ width: '100%', marginTop: '8px' }}
                  value={selectedMappingId}
                  onChange={(value) => setSelectedMappingId(value as string)}
                  placeholder="请选择字段映射配置"
                >
                  {mappingConfigs.map((config) => (
                    <Select.Option key={config.id} value={config.id}>
                      {config.name}
                      <Typography.Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                        {config.description}
                      </Typography.Text>
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
