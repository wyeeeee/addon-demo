/**
 * 字段映射配置管理模块
 */

/**
 * 字段映射配置接口
 */
export interface FieldMappingConfig {
  id: string;
  name: string;
  description: string;
  apiEndpoint: string;
  uniqueKeys: string[];
  fieldMappings: Record<string, {
    sheetField: string;
    type: 'text' | 'number' | 'date';
    required?: boolean;
  }>;
}

/**
 * 商品日报视图映射配置
 */
const productDailyViewMapping: FieldMappingConfig = {
  id: "product_daily_view",
  name: "商品日报视图",
  description: "商品日报数据表的字段映射配置",
  apiEndpoint: "https://xipi.moonmark.chat/api/product-daily-view",
  uniqueKeys: ["日期", "商品ID"],
  fieldMappings: {
    "日期": { sheetField: "日期", type: "date", required: true },
    "商品ID": { sheetField: "商品id", type: "text", required: true },
    "标题": { sheetField: "标题", type: "text" },
    "商家编码（后台）": { sheetField: "商家编码（后台）", type: "text" },
    "商家编码（梳理-辅助）": { sheetField: "商家编码（梳理-辅助）", type: "text" },
    "内部码": { sheetField: "内部码", type: "text" },
    "货号（后台）": { sheetField: "货号（后台）", type: "text" },
    "发布时间": { sheetField: "发布时间", type: "date" },
    "年份": { sheetField: "年份", type: "text" },
    "季节": { sheetField: "季节", type: "text" },
    "五级分类（梳理）": { sheetField: "五级分类（梳理）", type: "text" },
    "一级类目": { sheetField: "一级类目", type: "text" },
    "二级类目": { sheetField: "二级类目", type: "text" },
    "三级类目": { sheetField: "三级类目", type: "text" },
    "四级类目": { sheetField: "四级类目", type: "text" },
    "五级类目": { sheetField: "五级类目", type: "text" },
    "商品状态周初": { sheetField: "商品状态周初", type: "text" },
    "库存": { sheetField: "库存", type: "number" },
    "成本": { sheetField: "成本", type: "number" },
    "价格": { sheetField: "价格", type: "number" },
    "系列": { sheetField: "系列", type: "text" },
    "负责人": { sheetField: "负责人", type: "text" },
    "运营": { sheetField: "运营", type: "text" },
    "销量结构": { sheetField: "销量结构", type: "text" },
    "产品布局（SABC）": { sheetField: "产品布局（SABC）", type: "text" },
    "主副链接": { sheetField: "主副链接", type: "text" },
    "副链接拆解维度": { sheetField: "副链接拆解维度", type: "text" },
    "月度目标-支付件数": { sheetField: "月度目标-支付件数", type: "number" },
    "月度目标-成交金额": { sheetField: "月度目标-成交金额", type: "number" },
    "月度目标费比": { sheetField: "月度目标费比", type: "number" },
    "调整方向": { sheetField: "调整方向", type: "text" },
    "备注": { sheetField: "备注", type: "text" },
    "平均停留时长": { sheetField: "平均停留时长", type: "number" },
    "商品详情页跳出率": { sheetField: "商品详情页跳出率", type: "number" },
    "商品访客数": { sheetField: "商品访客数", type: "number" },
    "支付买家数": { sheetField: "支付买家数", type: "number" },
    "支付件数": { sheetField: "支付件数", type: "number" },
    "支付金额": { sheetField: "支付金额", type: "number" },
    "成功退款金额": { sheetField: "成功退款金额", type: "number" },
    "商品收藏人数": { sheetField: "商品收藏人数", type: "number" },
    "商品加购人数": { sheetField: "商品加购人数", type: "number" },
    "搜索引导访客数": { sheetField: "搜索引导访客数", type: "number" },
    "搜索引导支付买家数": { sheetField: "搜索引导支付买家数", type: "number" },
    "花费": { sheetField: "花费", type: "number" },
    "展现数": { sheetField: "展现数", type: "number" },
    "点击数": { sheetField: "点击数", type: "number" },
    "直接成交笔数": { sheetField: "直接成交笔数", type: "number" },
    "直接购物车数": { sheetField: "直接购物车数", type: "number" },
    "总成交笔数": { sheetField: "总成交笔数", type: "number" },
    "总成交金额": { sheetField: "总成交金额", type: "number" },
    "总购物车数": { sheetField: "总购物车数", type: "number" },
    "成交人数": { sheetField: "成交人数", type: "number" },
    "成交新客数": { sheetField: "成交新客数", type: "number" },
    "自然流量曝光量": { sheetField: "自然流量曝光量", type: "number" },
    "自然流量转化金额": { sheetField: "自然流量转化金额", type: "number" },
    "引导访问人数": { sheetField: "引导访问人数", type: "number" },
    "引导访问潜客数": { sheetField: "引导访问潜客数", type: "number" },
    "补单件数": { sheetField: "补单件数", type: "number" },
    "补单成交金额": { sheetField: "补单成交金额", type: "number" },
    "达人支付买家数": { sheetField: "达人支付买家数", type: "number" },
    "达人支付件数": { sheetField: "达人支付件数", type: "number" },
    "达人成交金额营业额": { sheetField: "达人成交金额营业额", type: "number" },
    "达人点击人数": { sheetField: "达人点击人数", type: "number" },
    "达人加购人数": { sheetField: "达人加购人数", type: "number" },
    "商品真实访客数": { sheetField: "商品真实访客数", type: "number" },
    "真实营业额": { sheetField: "真实营业额", type: "number" },
    "真实加购人数": { sheetField: "真实加购人数", type: "number" },
    "真实支付买家数": { sheetField: "真实支付买家数", type: "number" },
    "真实支付件数": { sheetField: "真实支付件数", type: "number" },
    "真实转化率": { sheetField: "真实转化率", type: "number" },
    "真实加购率": { sheetField: "真实加购率", type: "number" },
    "UV价值": { sheetField: "UV价值", type: "number" },
    "件单价": { sheetField: "件单价", type: "number" },
    "客单价": { sheetField: "客单价", type: "number" },
    "人均购买件数": { sheetField: "人均购买件数", type: "number" },
    "退款率": { sheetField: "退款率", type: "number" },
    "真实搜索引导支付买家数": { sheetField: "真实搜索引导支付买家数", type: "number" },
    "搜索引导支付转化率": { sheetField: "搜索引导支付转化率", type: "number" },
    "搜索引导访客占比": { sheetField: "搜索引导访客占比", type: "number" },
    "真实搜索引导支付买家数占比": { sheetField: "真实搜索引导支付买家数占比", type: "number" },
    "费比": { sheetField: "费比", type: "number" },
    "平均点击成本": { sheetField: "平均点击成本", type: "number" },
    "直接roi": { sheetField: "直接roi", type: "number" },
    "直接加购成本": { sheetField: "直接加购成本", type: "number" },
    "直接转化率": { sheetField: "直接转化率", type: "number" },
    "直接加购率": { sheetField: "直接加购率", type: "number" },
    "总ROI": { sheetField: "总ROI", type: "number" },
    "总加购成本": { sheetField: "总加购成本", type: "number" },
    "总转化率": { sheetField: "总转化率", type: "number" },
    "总加购率": { sheetField: "总加购率", type: "number" },
    "点击率": { sheetField: "点击率", type: "number" },
    "直接成交占比": { sheetField: "直接成交占比", type: "number" },
    "成交新客占比": { sheetField: "成交新客占比", type: "number" },
    "引导访问潜客占比": { sheetField: "引导访问潜客占比", type: "number" },
    "自然流量转化金额比例": { sheetField: "自然流量转化金额比例", type: "number" },
    "人均成交笔数": { sheetField: "人均成交笔数", type: "number" },
    "理论花费": { sheetField: "理论花费", type: "number" },
    "花费超出": { sheetField: "花费超出", type: "number" },
    "总停留时长": { sheetField: "总停留时长", type: "number" },
    "商品详情总跳出人数": { sheetField: "商品详情总跳出人数", type: "number" }
  }
};

/**
 * 所有可用的映射配置
 */
const MAPPING_CONFIGS: Record<string, FieldMappingConfig> = {
  product_daily_view: productDailyViewMapping
};

/**
 * 获取指定ID的映射配置
 */
export function getMappingConfig(mappingId: string): FieldMappingConfig | null {
  return MAPPING_CONFIGS[mappingId] || null;
}

/**
 * 获取所有可用的映射配置列表
 */
export function getAllMappingConfigs(): Array<{ id: string; name: string; description: string; apiEndpoint: string }> {
  return Object.values(MAPPING_CONFIGS).map(config => ({
    id: config.id,
    name: config.name,
    description: config.description,
    apiEndpoint: config.apiEndpoint
  }));
}

/**
 * 根据映射配置生成记录的唯一标识
 */
export function generateRecordKey(config: FieldMappingConfig, data: Record<string, any>): string {
  const keyParts = config.uniqueKeys.map(key => {
    let value = data[key];
    if (config.fieldMappings[key]?.type === 'date' && value) {
      value = String(value).split('T')[0];
    }
    return String(value);
  });
  return keyParts.join('_');
}

/**
 * 将后端数据转换为表格字段格式
 */
export function transformBackendDataToSheetFields(
  config: FieldMappingConfig,
  backendData: Record<string, any>,
  fieldMap: Map<string, any>
): Record<string, any> {
  const recordFields: Record<string, any> = {};

  for (const [backendKey, fieldConfig] of Object.entries(config.fieldMappings)) {
    const sheetFieldName = fieldConfig.sheetField;

    if (fieldMap.has(sheetFieldName) && backendData[backendKey] !== undefined) {
      let value = backendData[backendKey];

      if (fieldConfig.type === 'date' && value) {
        value = new Date(value).getTime();
      }

      recordFields[sheetFieldName] = value;
    }
  }

  return recordFields;
}

/**
 * 从记录中提取唯一键值
 */
export function extractRecordKey(
  config: FieldMappingConfig,
  record: any
): string | null {
  const keyParts: string[] = [];

  for (const uniqueKey of config.uniqueKeys) {
    const fieldConfig = config.fieldMappings[uniqueKey];
    if (!fieldConfig) return null;

    const value = record.getCellValue(fieldConfig.sheetField);
    if (!value) return null;

    if (fieldConfig.type === 'date') {
      keyParts.push(new Date(value).toISOString().split('T')[0]);
    } else {
      keyParts.push(String(value));
    }
  }

  return keyParts.join('_');
}
