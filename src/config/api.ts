/**
 * API配置
 * 统一管理所有后端接口地址
 */

export const API_CONFIG = {
  BASE_URL: 'https://xipiapi.moonmark.chat',
  ENDPOINTS: {
    PRODUCT_DAILY_VIEW: '/api/product-daily-view',
    DINGTALK_SIGN: '/api/dingtalk/sign'
  }
} as const;

/**
 * 钉钉配置
 */
export const DINGTALK_CONFIG = {
  AGENT_ID: '4087416485',
  CORP_ID: 'ding356a17aee2f7ad14'
} as const;
