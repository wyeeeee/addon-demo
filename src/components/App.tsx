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

  // 字段映射常量（与service层保持一致）
  const FIELD_MAPPING: Record<string, string> = {
    'date': '日期',
    'product_id': '商品ID',
    'product_info': '商品信息',
    'merchant_code': '商家编码',
    'item_no': '货号',
    'publish_time': '发布时间',
    'category_level5': '五级分类',
    'year_season': '年份季节',
    'cost': '成本',
    'price': '价格',
    'is_ideal': '是否理想裤',
    'operator': '运营人员',
    'link_type': '主副链接类型',
    'pre_season_status': '季前判定',
    'grade': '等级',
    'visitor_count': '商品访客数',
    'payment_buyer_count': '支付买家数',
    'payment_item_count': '支付件数',
    'payment_amount': '支付金额',
    'refund_amount': '成功退款金额',
    'favorite_count': '商品收藏人数',
    'cart_item_count': '商品加购件数',
    'avg_stay_duration': '平均停留时长',
    'bounce_rate': '商品详情页跳出率',
    'search_conversion_rate': '搜索引导支付转化率',
    'search_visitor_count': '搜索引导访客数',
    'search_buyer_count': '搜索引导支付买家数',
    'total_impression_count': '展现数',
    'total_click_count': '点击数',
    'total_order_count': '总订单行',
    'total_order_amount': '总订单金额',
    'total_cart_count_sum': '总购物车数',
    'total_favorite_count_sum': '总收藏数',
    'total_direct_deal_count': '直接订单行',
    'total_direct_deal_amount': '直接订单金额',
    'total_direct_cart_count': '直接购物车数',
    'total_cost': '总费用',
    'supplement_item_count': '补单件数',
    'supplement_amount': '补单营业额',
    'live_deal_item_count': '直播带货支付件数',
    'live_deal_user_count': '直播带货支付买家数',
    'live_deal_amount': '直播带货营业额',
    'real_payment_item_count': '真实支付件数',
    'real_payment_buyer_count': '真实支付买家数',
    'real_conversion': '真实转化',
    'real_cart_rate': '真实加购率',
    'real_search_conversion_rate': '搜索引导支付转化率_真实',
    'search_ratio': '搜索占比',
    'refund_rate': '退款率',
    'real_revenue': '真实营业额',
    'paid_ratio': '付费占比',
    'total_roi': '总ROI',
    'direct_roi': '直接ROI',
    'avg_click_cost': '平均点击成本',
    'total_cart_cost': '总加购成本',
    'total_favorite_cost': '总收藏成本',
    'click_rate': '点击率',
    'total_conversion_rate': '总转化率',
    'direct_conversion_rate': '直接转化率',
    'total_cart_rate': '总加购率',
    'direct_cart_rate': '直接加购率',
    'associated_sales_ratio': '关联销售占比'
  };

  // 生成记录的唯一标识（日期+商品ID）
  const generateRecordKey = (date: string, productId: string): string => {
    return `${date}_${productId}`;
  };

  // 转换后端数据为表格记录格式
  const convertBackendDataToRecord = (backendItem: any): any => {
    const recordFields: Record<string, any> = {};

    for (const [backendKey, sheetFieldName] of Object.entries(FIELD_MAPPING)) {
      if (backendItem[backendKey] !== undefined) {
        let value = backendItem[backendKey];

        // 日期字段特殊处理：转换为时间戳
        if (backendKey === 'date' && value) {
          value = new Date(value).getTime();
        }

        recordFields[sheetFieldName] = value;
      }
    }

    return { fields: recordFields };
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
      // 第一步：请求后端数据
      addLog('正在请求后端数据...');
      const apiUrl = endDate && startDate !== endDate
        ? `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_DAILY_VIEW}?start_date=${startDate}&end_date=${endDate}`
        : `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_DAILY_VIEW}?date=${startDate}`;

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

      // 第二步：获取表格现有数据
      addLog('正在获取表格现有数据...');
      const existingRecords = await Dingdocs.script.run('getSheetAllRecords', selectedSheetId);
      addLog(`✅ 表格现有记录 ${existingRecords.length} 条`);

      // 第三步：在UI层进行数据比对
      addLog('正在比对数据差异...');

      // 构建后端数据的唯一标识集合
      const backendKeySet = new Set<string>();
      const backendDataMap = new Map<string, any>();

      backendData.forEach((item: any) => {
        const dateStr = item.date.split('T')[0];
        const key = generateRecordKey(dateStr, String(item.product_id));
        backendKeySet.add(key);
        backendDataMap.set(key, item);
      });

      // 构建表格数据的唯一标识映射
      const existingKeyMap = new Map<string, any>();

      existingRecords.forEach((record: any) => {
        const dateValue = record.fields['日期'];
        const productId = record.fields['商品ID'];

        if (dateValue && productId) {
          const dateStr = new Date(dateValue).toISOString().split('T')[0];
          const key = generateRecordKey(dateStr, String(productId));
          existingKeyMap.set(key, record);
        }
      });

      // 找出需要删除的记录（表格有但后端没有）
      const recordsToDelete: string[] = [];
      existingKeyMap.forEach((record, key) => {
        if (!backendKeySet.has(key)) {
          recordsToDelete.push(record.id);
        }
      });

      // 找出需要新增的记录（后端有但表格没有）
      const recordsToInsert: any[] = [];
      backendKeySet.forEach((key) => {
        if (!existingKeyMap.has(key)) {
          const backendItem = backendDataMap.get(key);
          if (backendItem) {
            recordsToInsert.push(convertBackendDataToRecord(backendItem));
          }
        }
      });

      addLog(`✅ 数据比对完成: 需删除 ${recordsToDelete.length} 条，需新增 ${recordsToInsert.length} 条`);

      let totalDeleted = 0;
      let totalInserted = 0;

      // 第四步：分批删除记录（每批最多1000条）
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

      // 第五步：分批插入记录（每批最多1000条）
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
