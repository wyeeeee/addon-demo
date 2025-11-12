/*global DingdocsScript*/

import { BATCH_SIZES, FIELD_MAPPING, SYNC_VERIFICATION } from './constants.ts';
import { API_CONFIG } from '../../config/api.ts';

/**
 * 数据同步模块
 * 提供从后端API同步数据到表格的功能
 */

/**
 * 同步数据：从后端获取数据并增量更新到表格
 */
export async function syncDataFromBackend(sheetId: string, startDate: string, endDate?: string) {
  try {
    console.log('[同步] 接收到参数:', { sheetId, startDate, endDate });

    const base = DingdocsScript.base;
    console.log('[同步] 获取 base 对象成功');

    const sheet = base.getSheet(sheetId);
    console.log('[同步] 尝试获取数据表:', sheetId);

    if (!sheet) {
      // 输出所有可用的数据表以便调试
      const allSheets = base.getSheets();
      console.error('[同步] 未找到数据表，可用的数据表:', allSheets.map(s => ({ id: s.getId(), name: s.getName() })));
      throw new Error(`未找到指定的数据表: ${sheetId}`);
    }

    console.log('[同步] 成功获取数据表:', sheet.getName());

    // 构建API URL
    let apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_DAILY_VIEW}`;
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

    // 增量同步：比对并更新数据
    console.log('开始增量同步...');
    const syncResult = await incrementalSyncWithVerification(sheet, backendData);
    console.log(`同步完成: 新增${syncResult.insertedCount}条，删除${syncResult.deletedCount}条`);

    return {
      success: true,
      deletedCount: syncResult.deletedCount,
      insertedCount: syncResult.insertedCount,
      retryCount: syncResult.retryCount,
      message: `增量同步完成: 新增${syncResult.insertedCount}条，删除${syncResult.deletedCount}条${syncResult.retryCount > 0 ? `，重试${syncResult.retryCount}次` : ''}`
    };
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || '未知错误';
    throw new Error(`同步数据失败: ${errorMsg}`);
  }
}

/**
 * 生成记录的唯一标识（日期+商品ID）
 */
function generateRecordKey(date: string, productId: string): string {
  return `${date}_${productId}`;
}

/**
 * 增量同步：比对表格数据和后端数据，只删除多余的，只新增缺失的
 */
async function incrementalSync(sheet: any, backendData: any[]): Promise<{ insertedCount: number; deletedCount: number }> {
  // 获取表格字段映射
  const fields = sheet.getFields();
  const fieldMap = new Map<string, any>();
  fields.forEach((field: any) => {
    fieldMap.set(field.getName(), field);
  });

  // 第一步：获取表格中所有现有记录
  console.log('正在获取表格现有数据...');
  const existingRecords = await getAllRecords(sheet);
  console.log(`表格现有记录数: ${existingRecords.length}`);

  // 第二步：构建后端数据的唯一标识集合
  const backendKeySet = new Set<string>();
  const backendDataMap = new Map<string, any>();

  backendData.forEach((item: any) => {
    // 确保日期格式统一：只取日期部分，去掉时间
    const dateStr = item.date.split('T')[0]; // 从 "2025-11-09T00:00:00Z" 提取 "2025-11-09"
    const key = generateRecordKey(dateStr, String(item.product_id));
    backendKeySet.add(key);
    backendDataMap.set(key, item);
  });

  // 第三步：构建表格数据的唯一标识映射
  const existingKeyMap = new Map<string, any>();

  existingRecords.forEach((record: any) => {
    const dateValue = record.getCellValue('日期');
    const productId = record.getCellValue('商品ID');

    if (dateValue && productId) {
      // 日期字段是时间戳，需要转换为日期字符串
      const dateStr = new Date(dateValue).toISOString().split('T')[0];
      const key = generateRecordKey(dateStr, String(productId));
      existingKeyMap.set(key, record);
    }
  });

  console.log(`后端数据唯一键数: ${backendKeySet.size}`);
  console.log(`表格数据唯一键数: ${existingKeyMap.size}`);

  // 调试：输出前5个键进行对比
  const backendKeys = Array.from(backendKeySet).slice(0, 5);
  const existingKeys = Array.from(existingKeyMap.keys()).slice(0, 5);
  console.log('后端数据示例键:', backendKeys);
  console.log('表格数据示例键:', existingKeys);

  // 第四步：找出需要删除的记录（表格有但后端没有）
  const recordsToDelete: string[] = [];

  existingKeyMap.forEach((record, key) => {
    if (!backendKeySet.has(key)) {
      recordsToDelete.push(record.getId());
    }
  });

  console.log(`需要删除的记录数: ${recordsToDelete.length}`);

  // 第五步：找出需要新增的记录（后端有但表格没有）
  const recordsToInsert: any[] = [];

  backendKeySet.forEach((key) => {
    if (!existingKeyMap.has(key)) {
      const backendItem = backendDataMap.get(key);
      if (backendItem) {
        const recordFields: Record<string, any> = {};

        // 遍历字段映射，将后端数据转换为表格字段
        for (const [backendKey, sheetFieldName] of Object.entries(FIELD_MAPPING)) {
          if (fieldMap.has(sheetFieldName) && backendItem[backendKey] !== undefined) {
            let value = backendItem[backendKey];

            // 日期字段特殊处理：转换为时间戳
            if (backendKey === 'date' && value) {
              value = new Date(value).getTime();
            }

            recordFields[sheetFieldName] = value;
          }
        }

        recordsToInsert.push({ fields: recordFields });
      }
    }
  });

  console.log(`需要新增的记录数: ${recordsToInsert.length}`);

  // 第六步：执行删除操作（分批并行删除，兼顾速度和稳定性）
  let deletedCount = 0;
  if (recordsToDelete.length > 0) {
    console.log('开始删除多余记录...');
    deletedCount = await batchParallelOperation(
      recordsToDelete,
      BATCH_SIZES.DELETE_RECORDS,
      BATCH_SIZES.PARALLEL_BATCH_SIZE,
      async (batch) => await sheet.deleteRecordsAsync(batch),
      '删除'
    );
    console.log(`删除完成: ${deletedCount}条`);
  }

  // 第七步：执行插入操作（分批并行插入，兼顾速度和稳定性）
  let insertedCount = 0;
  if (recordsToInsert.length > 0) {
    console.log('开始插入新记录...');
    insertedCount = await batchParallelOperation(
      recordsToInsert,
      BATCH_SIZES.INSERT_RECORDS,
      BATCH_SIZES.PARALLEL_BATCH_SIZE,
      async (batch) => await sheet.insertRecordsAsync(batch),
      '插入'
    );
    console.log(`插入完成: ${insertedCount}条`);
  }

  return { insertedCount, deletedCount };
}

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
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 分批并行操作：将大量数据分成多个批次，每批次内并行执行，批次间串行
 * @param items 要处理的数据数组
 * @param batchSize 每个批次的大小
 * @param parallelCount 并行批次数量
 * @param operation 对每个批次执行的操作
 * @param operationName 操作名称（用于日志）
 * @returns 处理的总数量
 */
async function batchParallelOperation<T>(
  items: T[],
  batchSize: number,
  parallelCount: number,
  operation: (batch: T[]) => Promise<any>,
  operationName: string
): Promise<number> {
  // 将数据分成多个批次
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  const totalBatches = batches.length;
  let processedCount = 0;

  // 分组并行处理：每次并行处理 parallelCount 个批次
  for (let i = 0; i < batches.length; i += parallelCount) {
    const parallelBatches = batches.slice(i, i + parallelCount);
    const batchNumbers = parallelBatches.map((_, idx) => i + idx + 1);

    console.log(`${operationName}批次组 [${batchNumbers.join(', ')}]/${totalBatches}，并行处理 ${parallelBatches.length} 个批次...`);

    // 并行执行当前组的所有批次
    const promises = parallelBatches.map(batch => operation(batch));
    await Promise.all(promises);

    // 统计已处理的数量
    parallelBatches.forEach(batch => {
      processedCount += batch.length;
    });

    console.log(`${operationName}进度: ${processedCount}/${items.length} (${Math.round(processedCount / items.length * 100)}%)`);

    // 批次组之间添加延迟，避免请求过于密集
    if (i + parallelCount < batches.length) {
      await delay(BATCH_SIZES.BATCH_DELAY_MS);
    }
  }

  return processedCount;
}

/**
 * 步骤1：获取后端数据
 */
export async function fetchBackendData(startDate: string, endDate?: string) {
  let apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_DAILY_VIEW}`;
  if (endDate) {
    apiUrl += `?start_date=${startDate}&end_date=${endDate}`;
  } else {
    apiUrl += `?date=${startDate}`;
  }

  console.log('[步骤1] 正在请求API:', apiUrl);
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  if (result.code !== 0) {
    throw new Error(result.msg || '获取数据失败');
  }

  console.log('[步骤1] 获取到数据条数:', result.data?.length || 0);
  return result.data || [];
}

/**
 * 步骤2：获取表格现有记录
 */
export async function getExistingRecords(sheetId: string) {
  const base = DingdocsScript.base;
  const sheet = base.getSheet(sheetId);
  if (!sheet) {
    throw new Error(`未找到指定的数据表: ${sheetId}`);
  }

  console.log('[步骤2] 正在获取表格现有数据...');
  const records = await getAllRecords(sheet);
  console.log('[步骤2] 表格现有记录数:', records.length);

  return records.map(record => ({
    id: record.getId(),
    date: record.getCellValue('日期'),
    productId: record.getCellValue('商品ID')
  }));
}

/**
 * 步骤3：计算需要同步的差异
 */
export async function calculateSyncDiff(sheetId: string, backendData: any[], existingRecords: any[]) {
  const base = DingdocsScript.base;
  const sheet = base.getSheet(sheetId);
  if (!sheet) {
    throw new Error(`未找到指定的数据表: ${sheetId}`);
  }

  console.log('[步骤3] 开始计算同步差异...');

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
    if (record.date && record.productId) {
      const dateStr = new Date(record.date).toISOString().split('T')[0];
      const key = generateRecordKey(dateStr, String(record.productId));
      existingKeyMap.set(key, record.id);
    }
  });

  // 找出需要删除的记录
  const recordsToDelete: string[] = [];
  existingKeyMap.forEach((recordId, key) => {
    if (!backendKeySet.has(key)) {
      recordsToDelete.push(recordId);
    }
  });

  // 找出需要新增的记录
  const recordsToInsert: any[] = [];
  const fields = sheet.getFields();
  const fieldMap = new Map<string, any>();
  fields.forEach((field: any) => {
    fieldMap.set(field.getName(), field);
  });

  backendKeySet.forEach((key) => {
    if (!existingKeyMap.has(key)) {
      const backendItem = backendDataMap.get(key);
      if (backendItem) {
        const recordFields: Record<string, any> = {};
        for (const [backendKey, sheetFieldName] of Object.entries(FIELD_MAPPING)) {
          if (fieldMap.has(sheetFieldName) && backendItem[backendKey] !== undefined) {
            let value = backendItem[backendKey];
            if (backendKey === 'date' && value) {
              value = new Date(value).getTime();
            }
            recordFields[sheetFieldName] = value;
          }
        }
        recordsToInsert.push({ fields: recordFields });
      }
    }
  });

  console.log('[步骤3] 需要删除:', recordsToDelete.length, '条');
  console.log('[步骤3] 需要新增:', recordsToInsert.length, '条');

  return {
    recordsToDelete,
    recordsToInsert,
    totalBatches: Math.ceil(recordsToInsert.length / BATCH_SIZES.INSERT_RECORDS)
  };
}

/**
 * 步骤4：执行批量删除
 */
export async function syncBatchDelete(sheetId: string, recordIds: string[]) {
  const base = DingdocsScript.base;
  const sheet = base.getSheet(sheetId);
  if (!sheet) {
    throw new Error(`未找到指定的数据表: ${sheetId}`);
  }

  if (recordIds.length === 0) {
    return { deletedCount: 0 };
  }

  console.log(`[批量删除] 开始删除 ${recordIds.length} 条记录...`);

  let deletedCount = 0;
  for (let i = 0; i < recordIds.length; i += BATCH_SIZES.DELETE_RECORDS) {
    const batch = recordIds.slice(i, i + BATCH_SIZES.DELETE_RECORDS);
    await sheet.deleteRecordsAsync(batch);
    deletedCount += batch.length;
  }

  console.log(`[批量删除] 完成，共删除 ${deletedCount} 条`);
  return { deletedCount };
}

/**
 * 步骤5：执行批量插入（单个批次）
 */
export async function syncBatchInsert(sheetId: string, records: any[], batchIndex: number, totalBatches: number) {
  const base = DingdocsScript.base;
  const sheet = base.getSheet(sheetId);
  if (!sheet) {
    throw new Error(`未找到指定的数据表: ${sheetId}`);
  }

  console.log(`[批量插入] 批次 ${batchIndex + 1}/${totalBatches}，插入 ${records.length} 条记录...`);

  await sheet.insertRecordsAsync(records);

  console.log(`[批量插入] 批次 ${batchIndex + 1}/${totalBatches} 完成`);
  return { insertedCount: records.length };
}

/**
 * 带校验的增量同步：执行同步后校验数据一致性，必要时重试
 */
async function incrementalSyncWithVerification(
  sheet: any,
  backendData: any[]
): Promise<{ insertedCount: number; deletedCount: number; retryCount: number }> {
  let totalInsertedCount = 0;
  let totalDeletedCount = 0;
  let retryCount = 0;

  // 构建后端数据的唯一标识集合（用于校验）
  const backendKeySet = new Set<string>();
  backendData.forEach((item: any) => {
    const dateStr = item.date.split('T')[0];
    const key = generateRecordKey(dateStr, String(item.product_id));
    backendKeySet.add(key);
  });

  const expectedRecordCount = backendKeySet.size;
  console.log(`期望的记录总数: ${expectedRecordCount}`);

  // 第一次执行同步
  console.log('执行初始同步...');
  const initialResult = await incrementalSync(sheet, backendData);
  totalInsertedCount += initialResult.insertedCount;
  totalDeletedCount += initialResult.deletedCount;

  // 等待服务器处理
  console.log(`等待${SYNC_VERIFICATION.VERIFICATION_DELAY_MS}ms，让服务器处理数据...`);
  await delay(SYNC_VERIFICATION.VERIFICATION_DELAY_MS);

  // 开始校验和重试循环
  while (retryCount < SYNC_VERIFICATION.MAX_RETRY_COUNT) {
    console.log(`\n第${retryCount + 1}次校验数据一致性...`);

    // 重新获取表格数据进行校验
    const currentRecords = await getAllRecords(sheet);
    const currentKeySet = new Set<string>();

    currentRecords.forEach((record: any) => {
      const dateValue = record.getCellValue('日期');
      const productId = record.getCellValue('商品ID');

      if (dateValue && productId) {
        const dateStr = new Date(dateValue).toISOString().split('T')[0];
        const key = generateRecordKey(dateStr, String(productId));
        currentKeySet.add(key);
      }
    });

    const actualRecordCount = currentKeySet.size;
    console.log(`当前表格记录数: ${actualRecordCount}，期望记录数: ${expectedRecordCount}`);

    // 检查数据是否一致
    if (actualRecordCount === expectedRecordCount) {
      // 进一步检查是否所有后端数据都存在
      let allKeysMatch = true;
      for (const key of backendKeySet) {
        if (!currentKeySet.has(key)) {
          allKeysMatch = false;
          console.log(`缺失记录键: ${key}`);
          break;
        }
      }

      if (allKeysMatch) {
        console.log('✓ 数据校验通过，记录数一致且所有数据完整');
        break;
      } else {
        console.log('✗ 记录数相同但存在数据不匹配，需要重试');
      }
    } else {
      const diff = expectedRecordCount - actualRecordCount;
      console.log(`✗ 记录数不一致，差异: ${diff}条`);
    }

    // 如果已达到最大重试次数，报错退出
    if (retryCount >= SYNC_VERIFICATION.MAX_RETRY_COUNT - 1) {
      const errorMsg = `数据同步校验失败: 经过${SYNC_VERIFICATION.MAX_RETRY_COUNT}次重试后，表格记录数(${actualRecordCount})仍与期望记录数(${expectedRecordCount})不一致`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // 执行重试
    retryCount++;
    console.log(`\n准备第${retryCount}次重试，等待${SYNC_VERIFICATION.RETRY_DELAY_MS}ms...`);
    await delay(SYNC_VERIFICATION.RETRY_DELAY_MS);

    console.log(`开始第${retryCount}次增量同步重试...`);
    const retryResult = await incrementalSync(sheet, backendData);
    totalInsertedCount += retryResult.insertedCount;
    totalDeletedCount += retryResult.deletedCount;
    console.log(`重试完成: 新增${retryResult.insertedCount}条，删除${retryResult.deletedCount}条`);

    // 等待服务器处理
    await delay(SYNC_VERIFICATION.VERIFICATION_DELAY_MS);
  }

  return {
    insertedCount: totalInsertedCount,
    deletedCount: totalDeletedCount,
    retryCount
  };
}
