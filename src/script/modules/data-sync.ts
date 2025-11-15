/*global DingdocsScript*/

import { BATCH_SIZES } from './constants.ts';

/**
 * 数据同步模块
 * 提供批量操作和数据获取功能
 */

/**
 * 获取表格中所有记录
 */
async function getAllRecords(sheet: any): Promise<any[]> {
  const allRecords: any[] = [];
  let hasMore = true;
  let cursor: string | undefined = undefined;

  while (hasMore) {
    const recordsResult: any = await sheet.getRecordsAsync({
      pageSize: BATCH_SIZES.GET_RECORDS,
      cursor
    });

    if (recordsResult.records.length === 0) {
      break;
    }

    allRecords.push(...recordsResult.records);
    hasMore = recordsResult.hasMore;
    cursor = recordsResult.cursor;
  }

  return allRecords;
}

/**
 * 批量删除记录（供UI层调用）
 */
export async function batchDeleteRecords(sheetId: string, recordIds: string[]): Promise<{ deletedCount: number }> {
  try {
    const base = DingdocsScript.base;
    const sheet = base.getSheet(sheetId);
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }

    if (recordIds.length === 0) {
      return { deletedCount: 0 };
    }

    console.log(`开始删除 ${recordIds.length} 条记录...`);

    let deletedCount = 0;
    for (let i = 0; i < recordIds.length; i += BATCH_SIZES.DELETE_RECORDS) {
      const batch = recordIds.slice(i, i + BATCH_SIZES.DELETE_RECORDS);
      await sheet.deleteRecordsAsync(batch);
      deletedCount += batch.length;
      console.log(`已删除 ${deletedCount}/${recordIds.length} 条记录`);
    }

    console.log(`删除完成: ${deletedCount}条`);
    return { deletedCount };
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || '未知错误';
    throw new Error(`批量删除记录失败: ${errorMsg}`);
  }
}

/**
 * 批量插入记录（供UI层调用）
 */
export async function batchInsertRecords(sheetId: string, records: any[]): Promise<{ insertedCount: number }> {
  try {
    const base = DingdocsScript.base;
    const sheet = base.getSheet(sheetId);
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }

    if (records.length === 0) {
      return { insertedCount: 0 };
    }

    console.log(`开始插入 ${records.length} 条记录...`);

    let insertedCount = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZES.INSERT_RECORDS) {
      const batch = records.slice(i, i + BATCH_SIZES.INSERT_RECORDS);
      await sheet.insertRecordsAsync(batch);
      insertedCount += batch.length;
      console.log(`已插入 ${insertedCount}/${records.length} 条记录`);
    }

    console.log(`插入完成: ${insertedCount}条`);
    return { insertedCount };
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || '未知错误';
    throw new Error(`批量插入记录失败: ${errorMsg}`);
  }
}

/**
 * 获取表格中所有记录（供UI层调用）
 */
export async function getSheetAllRecords(sheetId: string): Promise<Array<{ id: string; fields: Record<string, any> }>> {
  try {
    const base = DingdocsScript.base;
    const sheet = base.getSheet(sheetId);
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }

    const records = await getAllRecords(sheet);

    return records.map((record: any) => ({
      id: record.getId(),
      fields: record.getCellValues()
    }));
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || '未知错误';
    throw new Error(`获取表格记录失败: ${errorMsg}`);
  }
}
