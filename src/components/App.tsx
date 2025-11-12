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

          // 权限配置成功后立即加载数据表（不依赖状态）
          console.log('[初始化] 开始加载数据表...');
          const sheetList = await Dingdocs.script.run('getAllSheets');
          console.log('[加载数据表] 获取到数据表:', sheetList.length, '个');
          setSheets(sheetList);
          if (sheetList.length > 0) {
            setSelectedSheetId(sheetList[0].id);
          }

          // 最后标记权限已就绪
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
      // 第一步：获取后端数据
      addLog('正在请求后端数据...');
      const backendData = await Dingdocs.script.run('fetchBackendData', startDate, startDate === endDate ? undefined : endDate);
      addLog(`获取到后端数据: ${backendData.length} 条`);

      // 第二步：获取表格现有数据
      addLog('正在获取表格现有数据...');
      const sheetRecords = await Dingdocs.script.run('getSheetRecords', selectedSheetId);
      addLog(`获取到表格数据: ${sheetRecords.length} 条`);

      // 如果后端和表格都没有数据，直接返回
      if (backendData.length === 0 && sheetRecords.length === 0) {
        addLog('✅ 后端和表格都没有数据，无需同步');
        message.info('没有需要同步的数据');
        return;
      }

      // 第三步：获取字段映射
      const fieldMappingResult = await Dingdocs.script.run('getFieldMapping', selectedSheetId);
      const { fieldMapping } = fieldMappingResult;

      // 第四步：在 UI 层计算需要插入和删除的记录
      addLog('正在计算数据差异...');

      // 构建后端数据的唯一标识集合
      const backendKeySet = new Set<string>();
      const backendDataMap = new Map<string, any>();

      backendData.forEach((item: any) => {
        const dateStr = item.date.split('T')[0];
        const key = `${dateStr}_${item.product_id}`;
        backendKeySet.add(key);
        backendDataMap.set(key, item);
      });

      // 构建表格数据的唯一标识映射
      const existingKeyMap = new Map<string, any>();

      sheetRecords.forEach((record: any) => {
        const dateValue = record.fields['日期'];
        const productId = record.fields['商品ID'];

        if (dateValue && productId) {
          const dateStr = new Date(dateValue).toISOString().split('T')[0];
          const key = `${dateStr}_${productId}`;
          existingKeyMap.set(key, record);
        }
      });

      // 找出需要删除的记录
      const recordsToDelete: string[] = [];
      existingKeyMap.forEach((record, key) => {
        if (!backendKeySet.has(key)) {
          recordsToDelete.push(record.id);
        }
      });

      // 找出需要新增的记录
      const recordsToInsert: any[] = [];
      backendKeySet.forEach((key) => {
        if (!existingKeyMap.has(key)) {
          const backendItem = backendDataMap.get(key);
          if (backendItem) {
            const recordFields: Record<string, any> = {};

            for (const [backendKey, sheetFieldName] of Object.entries(fieldMapping)) {
              if (backendItem[backendKey] !== undefined) {
                let value = backendItem[backendKey];

                // 日期字段特殊处理
                if (backendKey === 'date' && value) {
                  value = new Date(value).getTime();
                }

                recordFields[sheetFieldName as string] = value;
              }
            }

            recordsToInsert.push({ fields: recordFields });
          }
        }
      });

      addLog(`需要删除: ${recordsToDelete.length} 条，需要新增: ${recordsToInsert.length} 条`);

      // 第五步：串行执行删除操作
      let totalDeleted = 0;
      if (recordsToDelete.length > 0) {
        addLog('开始删除多余记录...');
        const BATCH_SIZE = 100;
        const deleteBatches = Math.ceil(recordsToDelete.length / BATCH_SIZE);

        for (let i = 0; i < deleteBatches; i++) {
          const start = i * BATCH_SIZE;
          const batch = recordsToDelete.slice(start, start + BATCH_SIZE);

          addLog(`删除进度: ${i + 1}/${deleteBatches} (${batch.length}条)`);
          const result = await Dingdocs.script.run('batchDeleteRecords', selectedSheetId, batch);
          totalDeleted += result.deletedCount;

          // 每次操作后添加短暂延迟，避免累积超时
          if (i < deleteBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        addLog(`删除完成: ${totalDeleted} 条`);
      }

      // 第六步：串行执行插入操作
      let totalInserted = 0;
      if (recordsToInsert.length > 0) {
        addLog('开始插入新记录...');
        const BATCH_SIZE = 100;
        const insertBatches = Math.ceil(recordsToInsert.length / BATCH_SIZE);

        for (let i = 0; i < insertBatches; i++) {
          const start = i * BATCH_SIZE;
          const batch = recordsToInsert.slice(start, start + BATCH_SIZE);

          addLog(`插入进度: ${i + 1}/${insertBatches} (${batch.length}条)`);
          const result = await Dingdocs.script.run('batchInsertRecords', selectedSheetId, batch);
          totalInserted += result.insertedCount;

          // 每次操作后添加短暂延迟，避免累积超时
          if (i < insertBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        addLog(`插入完成: ${totalInserted} 条`);
      }

      addLog(`✅ 同步完成！新增 ${totalInserted} 条，删除 ${totalDeleted} 条`);
      message.success(`${locale.syncSuccess}！新增 ${totalInserted} 条，删除 ${totalDeleted} 条`);
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
