/**
 * 数据比对模块
 * 在 UI 端比对后端数据和表格数据，返回需要删除和插入的记录
 */

import { getMappingConfig, generateRecordKey } from './mapping-config.ts';

/**
 * 比对数据，返回需要删除和插入的记录
 */
export function compareData(
  mappingId: string,
  backendData: any[],
  existingRecords: Array<{ id: string; fields: Record<string, any> }>
) {
  const config = getMappingConfig(mappingId);
  if (!config) {
    throw new Error(`未找到映射配置: ${mappingId}`);
  }

  // 构建后端数据的唯一标识集合
  const backendKeySet = new Set<string>();
  const backendDataMap = new Map<string, any>();

  backendData.forEach((item: any) => {
    const key = generateRecordKey(config, item);
    backendKeySet.add(key);
    backendDataMap.set(key, item);
  });

  // 构建表格数据的唯一标识映射
  const existingKeyMap = new Map<string, any>();

  existingRecords.forEach((record: any) => {
    const keyParts: string[] = [];
    let valid = true;

    for (const uniqueKey of config.uniqueKeys) {
      const fieldConfig = config.fieldMappings[uniqueKey];
      if (!fieldConfig) {
        valid = false;
        break;
      }

      const value = record.fields[fieldConfig.sheetField];
      if (!value) {
        valid = false;
        break;
      }

      if (fieldConfig.type === 'date') {
        keyParts.push(new Date(value).toISOString().split('T')[0]);
      } else {
        keyParts.push(String(value));
      }
    }

    if (valid) {
      const key = keyParts.join('_');
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
        const recordFields: Record<string, any> = {};

        for (const [backendKey, fieldConfig] of Object.entries(config.fieldMappings)) {
          if (backendKey in backendItem) {
            let value = backendItem[backendKey];

            if (fieldConfig.type === 'date' && value) {
              value = new Date(value).getTime();
            }

            recordFields[fieldConfig.sheetField] = value;
          }
        }

        // 调试：打印第一条转换后的记录
        if (recordsToInsert.length === 0) {
          console.log('[调试] 第一条转换后的记录字段:', Object.keys(recordFields));
          console.log('[调试] 第一条转换后的记录数据:', recordFields);
        }

        recordsToInsert.push({ fields: recordFields });
      }
    }
  });

  return {
    recordsToDelete,
    recordsToInsert
  };
}
