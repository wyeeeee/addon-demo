/*global DingdocsScript*/

import { BATCH_SIZES } from './constants.ts';
import { getSheet, mapRecordToObject } from './utils.ts';

/**
 * Record 操作模块
 * 提供记录的 CRUD 操作和批量操作
 */

/**
 * 获取记录数据
 */
export async function getRecords(sheetId?: string, pageSize = 20) {
  try {
    const sheet = getSheet(sheetId);
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }

    const result = await sheet.getRecordsAsync({ pageSize });

    return {
      records: result.records.map(mapRecordToObject),
      hasMore: result.hasMore,
      cursor: result.cursor,
      total: result.records.length
    };
  } catch (error: any) {
    throw new Error(`获取记录失败: ${error.message}`);
  }
}

/**
 * 添加记录
 */
export async function addRecord(fields: Record<string, any>, sheetId?: string) {
  try {
    const sheet = getSheet(sheetId);
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }

    const records = await sheet.insertRecordsAsync([{ fields }]);
    const record = records[0];

    return mapRecordToObject(record);
  } catch (error: any) {
    throw new Error(`添加记录失败: ${error.message}`);
  }
}

/**
 * 更新记录
 */
export async function updateRecord(recordId: string, fields: Record<string, any>, sheetId?: string) {
  try {
    if (!recordId) {
      throw new Error('记录ID不能为空');
    }

    const sheet = getSheet(sheetId);
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }

    const records = await sheet.updateRecordsAsync([{ id: recordId, fields }]);
    const record = records[0];

    return mapRecordToObject(record);
  } catch (error: any) {
    throw new Error(`更新记录失败: ${error.message}`);
  }
}

/**
 * 删除记录
 */
export async function deleteRecord(recordId: string, sheetId?: string) {
  try {
    if (!recordId) {
      throw new Error('记录ID不能为空');
    }

    const sheet = getSheet(sheetId);
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }

    await sheet.deleteRecordsAsync(recordId);
    return { success: true };
  } catch (error: any) {
    throw new Error(`删除记录失败: ${error.message}`);
  }
}

/**
 * 批量删除记录（支持并行删除）
 */
export async function deleteRecords(sheetId: string, recordIds: string[]) {
  const base = DingdocsScript.base;
  const sheet = base.getSheet(sheetId);
  if (!sheet) throw new Error('未找到数据表');

  // 如果记录数量较少，直接删除
  if (recordIds.length <= BATCH_SIZES.DELETE_RECORDS) {
    await sheet.deleteRecordsAsync(recordIds);
    return { success: true };
  }

  // 如果记录数量较多，使用并行批量删除
  const deletePromises = [];
  for (let i = 0; i < recordIds.length; i += BATCH_SIZES.DELETE_RECORDS) {
    const batch = recordIds.slice(i, i + BATCH_SIZES.DELETE_RECORDS);
    deletePromises.push(sheet.deleteRecordsAsync(batch));
  }
  await Promise.all(deletePromises);
  return { success: true };
}

/**
 * 批量插入记录（简化版本，直接插入已格式化的记录）
 */
export async function insertRecords(sheetId: string, records: any[]) {
  const base = DingdocsScript.base;
  const sheet = base.getSheet(sheetId);
  if (!sheet) throw new Error('未找到数据表');

  // 如果数据量较少，直接插入
  if (records.length <= BATCH_SIZES.INSERT_RECORDS) {
    await sheet.insertRecordsAsync(records);
    return { success: true, count: records.length };
  }

  // 如果数据量较多，使用并行批量插入
  const insertPromises = [];
  for (let i = 0; i < records.length; i += BATCH_SIZES.INSERT_RECORDS) {
    const batch = records.slice(i, i + BATCH_SIZES.INSERT_RECORDS);
    insertPromises.push(sheet.insertRecordsAsync(batch));
  }
  await Promise.all(insertPromises);
  return { success: true, count: records.length };
}
