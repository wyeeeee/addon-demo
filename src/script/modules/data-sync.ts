/*global DingdocsScript*/

import { BATCH_SIZES, FIELD_MAPPING } from './constants.ts';

/**
 * 数据同步模块
 * 提供从后端API同步数据到表格的功能
 */

/**
 * 同步数据：从后端获取数据并更新到表格
 */
export async function syncDataFromBackend(sheetId: string, startDate: string, endDate?: string) {
  try {
    const base = DingdocsScript.base;
    const sheet = base.getSheet(sheetId);
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }

    // 构建API URL
    let apiUrl = 'http://155.94.172.181:7675/api/product-daily-view';
    if (endDate) {
      apiUrl += `?start_date=${startDate}&end_date=${endDate}`;
    } else {
      apiUrl += `?date=${startDate}`;
    }

    // 获取后端数据
    console.log('正在请求API:', apiUrl);

    if (typeof fetch === 'undefined') {
      throw new Error('fetch API不可用，请检查运行环境');
    }

    const response = await fetch(apiUrl);
    console.log('API响应状态:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('API返回数据:', result);

    if (result.code !== 0) {
      throw new Error(result.msg || '获取数据失败');
    }

    const backendData = result.data || [];
    console.log('获取到数据条数:', backendData.length);

    // 删除表中所有现有记录（并行批量删除）
    console.log('开始删除旧记录...');
    const deletedCount = await deleteAllRecords(sheet);
    console.log(`删除完成，共删除 ${deletedCount} 条记录`);

    // 转换并插入新数据（并行批量插入）
    console.log('开始插入新记录...');
    const insertedCount = await insertAllRecords(sheet, backendData);
    console.log(`插入完成，共插入 ${insertedCount} 条记录`);

    return {
      success: true,
      deletedCount,
      insertedCount,
      message: `成功删除${deletedCount}条记录，插入${insertedCount}条新记录`
    };
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || '未知错误';
    throw new Error(`同步数据失败: ${errorMsg}`);
  }
}

/**
 * 删除表格中所有记录
 */
async function deleteAllRecords(sheet: any): Promise<number> {
  const allRecordIds: string[] = [];
  let hasMore = true;
  let cursor: string | undefined = undefined;

  // 第一步：一次性获取所有记录ID
  while (hasMore) {
    const recordsResult = await sheet.getRecordsAsync({
      pageSize: BATCH_SIZES.GET_RECORDS,
      cursor
    });
    if (recordsResult.records.length === 0) {
      break;
    }

    allRecordIds.push(...recordsResult.records.map((r: any) => r.getId()));
    hasMore = recordsResult.hasMore;
    cursor = recordsResult.cursor;
  }

  // 第二步：并行删除所有记录
  if (allRecordIds.length > 0) {
    const deletePromises = [];
    for (let i = 0; i < allRecordIds.length; i += BATCH_SIZES.DELETE_RECORDS) {
      const batch = allRecordIds.slice(i, i + BATCH_SIZES.DELETE_RECORDS);
      deletePromises.push(sheet.deleteRecordsAsync(batch));
    }
    await Promise.all(deletePromises);
  }

  return allRecordIds.length;
}

/**
 * 插入所有新记录
 */
async function insertAllRecords(sheet: any, backendData: any[]): Promise<number> {
  // 获取表格字段映射
  const fields = sheet.getFields();
  const fieldMap = new Map<string, any>();
  fields.forEach((field: any) => {
    fieldMap.set(field.getName(), field);
  });

  // 第一步：预先转换所有数据
  const allRecordsToInsert = backendData.map((item: any) => {
    const fields: Record<string, any> = {};

    // 遍历字段映射，将后端数据转换为表格字段
    for (const [backendKey, sheetFieldName] of Object.entries(FIELD_MAPPING)) {
      if (fieldMap.has(sheetFieldName) && item[backendKey] !== undefined) {
        let value = item[backendKey];

        // 日期字段特殊处理：转换为时间戳
        if (backendKey === 'date' && value) {
          value = new Date(value).getTime();
        }

        fields[sheetFieldName] = value;
      }
    }

    return { fields };
  });

  // 第二步：并行插入所有记录
  const insertPromises = [];
  for (let i = 0; i < allRecordsToInsert.length; i += BATCH_SIZES.INSERT_RECORDS) {
    const batch = allRecordsToInsert.slice(i, i + BATCH_SIZES.INSERT_RECORDS);
    insertPromises.push(sheet.insertRecordsAsync(batch));
  }
  await Promise.all(insertPromises);

  return allRecordsToInsert.length;
}
