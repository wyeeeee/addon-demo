/*global Dingdocs*/

import { useEffect, useState } from 'react';
import { initView } from 'dingtalk-docs-cool-app';
import { Typography, Button, Select, DatePicker, Card, Space, message, ConfigProvider, Divider } from 'dingtalk-design-desktop';
import zhCN from 'dingtalk-design-desktop/es/locale/zh_CN';
import { getLocale, type Locales } from './locales.ts';
import { configDingdocsPermission } from '../utils/permission.ts';
import { API_CONFIG } from '../config/api.ts';
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
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    initView({
      onReady: async () => {
        try {
          // 配置钉钉权限
          await configDingdocsPermission();

          const currentLocale = await Dingdocs.base.host.getLocale();
          setLocale(getLocale(currentLocale));
        } catch (e) {
          console.warn('初始化失败:', e);
        }

        await loadSheets();
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSheets = async () => {
    try {
      const sheetList = await Dingdocs.script.run('getAllSheets');
      setSheets(sheetList);
      if (sheetList.length > 0 && !selectedSheetId) {
        setSelectedSheetId(sheetList[0].id);
      }
    } catch (error: any) {
      message.error(`${locale.operationFailed}: ${error.message}`);
    }
  };

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
    console.log(msg);
  };

  const handleSync = async () => {
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
      // 构建API URL
      let apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_DAILY_VIEW}`;
      if (startDate === endDate) {
        apiUrl += `?date=${startDate}`;
      } else {
        apiUrl += `?start_date=${startDate}&end_date=${endDate}`;
      }
      addLog(`请求API: ${apiUrl}`);

      // 获取后端数据
      const response = await fetch(apiUrl);
      addLog(`API响应: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const result = await response.json();
      if (result.code !== 0) {
        throw new Error(result.msg || '获取数据失败');
      }

      const backendData = result.data || [];
      addLog(`获取到 ${backendData.length} 条数据`);

      // 检查数据量限制
      if (backendData.length > 50000) {
        throw new Error(`数据量过大(${backendData.length}条)，超过5万行限制，请缩小日期范围`);
      }

      // 删除旧记录
      addLog('开始删除旧记录...');
      let deletedCount = 0;
      let hasMore = true;

      while (hasMore) {
        const recordsResult = await Dingdocs.script.run('getRecords', selectedSheetId, 100);
        if (recordsResult.records.length === 0) {
          break;
        }

        const recordIds = recordsResult.records.map((r: any) => r.id);
        await Dingdocs.script.run('deleteRecords', selectedSheetId, recordIds);
        deletedCount += recordIds.length;
        addLog(`已删除 ${deletedCount} 条`);

        hasMore = recordsResult.hasMore;
      }

      // 插入新记录
      addLog('开始插入新记录...');
      let insertedCount = 0;
      const batchSize = 100;

      for (let i = 0; i < backendData.length; i += batchSize) {
        const batch = backendData.slice(i, i + batchSize);
        await Dingdocs.script.run('insertRecords', selectedSheetId, batch);
        insertedCount += batch.length;
        addLog(`已插入 ${insertedCount}/${backendData.length} 条`);
      }

      addLog(`同步完成！删除${deletedCount}条，插入${insertedCount}条`);
      message.success(`${locale.syncSuccess}！删除${deletedCount}条，插入${insertedCount}条`);
    } catch (error: any) {
      const errorMsg = error?.message || JSON.stringify(error) || '未知错误';
      addLog(`同步失败: ${errorMsg}`);
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
                onClick={handleSync}
                style={{ height: '44px', fontSize: '16px', fontWeight: 500 }}
              >
                {loading ? `⏳ ${locale.syncing}` : `🚀 ${locale.syncData}`}
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
