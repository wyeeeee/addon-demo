/**
 * 批量操作的批次大小常量
 */
export const BATCH_SIZES = {
  INSERT_RECORDS: 500,  // 单次插入记录批次大小
  DELETE_RECORDS: 100,  // 单次删除记录批次大小
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
