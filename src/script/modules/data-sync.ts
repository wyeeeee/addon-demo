/*global DingdocsScript*/

import { BATCH_SIZES, FIELD_MAPPING } from './constants.ts';
import { API_CONFIG } from '../../config/api.ts';

/**
 * 数据同步模块 - 简化版
 * Service 层只提供基础的单批次操作，UI 层控制整个同步流程
 */

/**
 * 获取后端数据
 */
export async function fetchBackendData(startDate: string, endDate?: string) {
  try {
    // 构建API URL
    let apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_DAILY_VIEW}`;
    if (endDate) {
      apiUrl += `?start_date=${startDate}&end_date=${endDate}`;
    } else {
      apiUrl += `?date=${startDate}`;
    }

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

    if (result.code !== 0) {
      throw new Error(result.msg || '获取数据失败');
    }

    const backendData = result.data || [];
    console.log('获取到数据条数:', backendData.length);

    return backendData;
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || '未知错误';
    throw new Error(`获取后端数据失败: ${errorMsg}`);
  }
}

/**
 * 获取表格中所有现有记录（返回可序列化的数据）
 */
export async function getSheetRecords(sheetId: string) {
  try {
    const base = DingdocsScript.base;
    const sheet = base.getSheet(sheetId);
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }

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

      // 将 Record 对象转换为可序列化的普通对象
      recordsResult.records.forEach((record: any) => {
        allRecords.push({
          id: record.getId(),
          fields: record.getCellValues()
        });
      });

      hasMore = recordsResult.hasMore;
      cursor = recordsResult.cursor;
    }

    console.log(`获取到表格现有记录数: ${allRecords.length}`);
    return allRecords;
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || '未知错误';
    throw new Error(`获取表格记录失败: ${errorMsg}`);
  }
}

/**
 * 批量插入记录（单批次）
 */
export async function batchInsertRecords(sheetId: string, records: any[]) {
  try {
    const base = DingdocsScript.base;
    const sheet = base.getSheet(sheetId);
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }

    if (records.length === 0) {
      return { insertedCount: 0 };
    }

    console.log(`批量插入记录: ${records.length}条`);
    await sheet.insertRecordsAsync(records);
    console.log(`插入完成: ${records.length}条`);

    return { insertedCount: records.length };
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || '未知错误';
    throw new Error(`批量插入记录失败: ${errorMsg}`);
  }
}

/**
 * 批量删除记录（单批次）
 */
export async function batchDeleteRecords(sheetId: string, recordIds: string[]) {
  try {
    const base = DingdocsScript.base;
    const sheet = base.getSheet(sheetId);
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }

    if (recordIds.length === 0) {
      return { deletedCount: 0 };
    }

    console.log(`批量删除记录: ${recordIds.length}条`);
    await sheet.deleteRecordsAsync(recordIds);
    console.log(`删除完成: ${recordIds.length}条`);

    return { deletedCount: recordIds.length };
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || '未知错误';
    throw new Error(`批量删除记录失败: ${errorMsg}`);
  }
}

/**
 * 获取字段映射
 */
export async function getFieldMapping(sheetId: string) {
  try {
    const base = DingdocsScript.base;
    const sheet = base.getSheet(sheetId);
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }

    const fields = sheet.getFields();
    const fieldMap = new Map<string, any>();
    fields.forEach((field: any) => {
      fieldMap.set(field.getName(), field);
    });

    // 返回字段映射的简化版本（只包含字段名）
    const fieldNames: string[] = [];
    fieldMap.forEach((field, name) => {
      fieldNames.push(name);
    });

    return { fieldNames, fieldMapping: FIELD_MAPPING };
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || '未知错误';
    throw new Error(`获取字段映射失败: ${errorMsg}`);
  }
}
