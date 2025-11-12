/**
 * 字段映射常量
 * 后端字段名 -> AI表格字段名
 */
export const FIELD_MAPPING: Record<string, string> = {
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

/**
 * 批量操作的批次大小常量
 */
export const BATCH_SIZES = {
  INSERT_RECORDS: 100,  // 插入记录批次大小（降低以避免超时）
  DELETE_RECORDS: 100,  // 删除记录批次大小
  GET_RECORDS: 100      // 获取记录批次大小
} as const;

/**
 * 数据同步校验与重试配置
 */
export const SYNC_VERIFICATION = {
  MAX_RETRY_COUNT: 3,      // 最大重试次数
  RETRY_DELAY_MS: 100,    // 重试前等待时间（毫秒）
  VERIFICATION_DELAY_MS: 100  // 校验前等待时间（毫秒），给服务器反应时间
} as const;
