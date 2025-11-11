/*global Dingdocs*/

import { useEffect, useState } from 'react';
import { initView } from 'dingtalk-docs-cool-app';
import { Typography, Button, Select, DatePicker, Card, Space, message, ConfigProvider } from 'dingtalk-design-desktop';
import zhCN from 'dingtalk-design-desktop/es/locale/zh_CN';
import { getLocale, type Locales } from './locales.ts';
import './style.css';

// 扩展中文语言包,补充月份名称
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
  const [dateMode, setDateMode] = useState<'single' | 'range'>('single');
  const [singleDate, setSingleDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    initView({
      onReady: async () => {
        try {
          const currentLocale = await Dingdocs.base.host.getLocale();
          setLocale(getLocale(currentLocale));
        } catch (e) {
          console.warn('获取语言设置失败，使用默认中文');
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

    if (dateMode === 'single' && !singleDate) {
      message.warning(locale.pleaseSelectDate);
      return;
    }

    if (dateMode === 'range' && (!startDate || !endDate)) {
      message.warning(locale.pleaseSelectDate);
      return;
    }

    setLogs([]);
    setLoading(true);
    addLog('开始同步数据...');
    addLog(`数据表ID: ${selectedSheetId}`);
    addLog(`日期: ${dateMode === 'single' ? singleDate : `${startDate} 至 ${endDate}`}`);

    try {
      // 构建API URL
      let apiUrl = 'https://xipiapi.moonmark.chat/api/product-daily-view';
      if (dateMode === 'range') {
        apiUrl += `?start_date=${startDate}&end_date=${endDate}`;
      } else {
        apiUrl += `?date=${singleDate}`;
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
          <Typography.Text strong>{locale.dataSource}</Typography.Text>
        </div>
        <div className='content'>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Typography.Text strong>{locale.selectSheet}</Typography.Text>
                <Select
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
                <Typography.Text strong>{locale.selectDate}</Typography.Text>
                <Select
                  style={{ width: '100%', marginTop: '8px' }}
                  value={dateMode}
                  onChange={(value) => setDateMode(value as 'single' | 'range')}
                >
                  <Select.Option value="single">{locale.singleDate}</Select.Option>
                  <Select.Option value="range">{locale.dateRange}</Select.Option>
                </Select>
              </div>

              {dateMode === 'single' ? (
                <div>
                  <Typography.Text strong>{locale.singleDate}</Typography.Text>
                  <DatePicker
                    style={{ width: '100%', marginTop: '8px' }}
                    onChange={(date) => {
                      if (date) {
                        setSingleDate(formatDate(date));
                      }
                    }}
                    placeholder={locale.pleaseSelectDate}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Typography.Text strong>{locale.startDate}</Typography.Text>
                    <DatePicker
                      style={{ width: '100%', marginTop: '8px' }}
                      onChange={(date) => {
                        if (date) {
                          setStartDate(formatDate(date));
                        }
                      }}
                      placeholder={locale.pleaseSelectDate}
                    />
                  </div>
                  <div>
                    <Typography.Text strong>{locale.endDate}</Typography.Text>
                    <DatePicker
                      style={{ width: '100%', marginTop: '8px' }}
                      onChange={(date) => {
                        if (date) {
                          setEndDate(formatDate(date));
                        }
                      }}
                      placeholder={locale.pleaseSelectDate}
                    />
                  </div>
                </>
              )}

              <Button
                type="primary"
                block
                loading={loading}
                onClick={handleSync}
              >
                {loading ? locale.syncing : locale.confirm}
              </Button>

              {logs.length > 0 && (
                <Card size="small" title="日志">
                  <div style={{ maxHeight: '200px', overflow: 'auto', fontSize: '12px', fontFamily: 'monospace' }}>
                    {logs.map((log, index) => (
                      <div key={index} style={{ marginBottom: '4px' }}>{log}</div>
                    ))}
                  </div>
                </Card>
              )}
            </Space>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default App;
