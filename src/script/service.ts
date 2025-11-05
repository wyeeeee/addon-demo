/*global DingdocsScript*/

/**
 * AI表格边栏插件服务层
 * 运行在 Web Worker 中，提供AI表格操作的核心功能
 */

// 获取当前激活的数据表
function getActiveSheet() {
  try {
    const base = DingdocsScript.base;
    const sheet = base.getActiveSheet();
    if (!sheet) {
      throw new Error('未找到激活的数据表');
    }
    return {
      id: sheet.getId(),
      name: sheet.getName(),
      desc: sheet.getDesc() || '',
      fieldsCount: sheet.getFields().length
    };
  } catch (error: any) {
    throw new Error(`获取激活数据表失败: ${error.message}`);
  }
}

// 获取所有数据表列表
function getAllSheets() {
  try {
    const base = DingdocsScript.base;
    const sheets = base.getSheets();
    return sheets.map((sheet: any) => ({
      id: sheet.getId(),
      name: sheet.getName(),
      desc: sheet.getDesc() || '',
      fieldsCount: sheet.getFields().length
    }));
  } catch (error: any) {
    throw new Error(`获取数据表列表失败: ${error.message}`);
  }
}

// 创建新的数据表
function createSheet(name: string) {
  try {
    if (!name || name.trim() === '') {
      throw new Error('数据表名称不能为空');
    }
    
    const base = DingdocsScript.base;
    // 创建带有基本字段的数据表
    const sheet = base.insertSheet(name.trim(), [
      { name: '标题', type: 'text' },
      { name: '状态', type: 'singleSelect' },
      { name: '创建时间', type: 'date' }
    ]);
    
    return {
      id: sheet.getId(),
      name: sheet.getName(),
      desc: sheet.getDesc() || '',
      fieldsCount: sheet.getFields().length
    };
  } catch (error: any) {
    throw new Error(`创建数据表失败: ${error.message}`);
  }
}

// 删除数据表
function deleteSheet(sheetId: string) {
  try {
    if (!sheetId) {
      throw new Error('数据表ID不能为空');
    }
    console.log('sheetId', sheetId);
    const base = DingdocsScript.base;
    base.deleteSheet(sheetId);
    return { success: true };
  } catch (error: any) {
    throw new Error(`删除数据表失败: ${error.message}`);
  }
}

// 获取数据表字段信息
function getSheetFields(sheetId?: string) {
  try {
    const base = DingdocsScript.base;
    let sheet;
    if (sheetId) {
      sheet = base.getSheet(sheetId);
    } else {
      sheet = base.getActiveSheet();
    }
    
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }
    
    const fields = sheet.getFields();
    return fields.map((field: any) => ({
      id: field.getId(),
      name: field.getName(),
      type: field.getType(),
      isPrimary: field.isPrimary?.() || false,
    }));
  } catch (error: any) {
    throw new Error(`获取字段信息失败: ${error.message}`);
  }
}

// 添加字段
function addField(name: string, type: string, sheetId?: string) {
  try {
    if (!name || name.trim() === '') {
      throw new Error('字段名称不能为空');
    }
    
    const base = DingdocsScript.base;
    let sheet;
    if (sheetId) {
      sheet = base.getSheet(sheetId);
    } else {
      sheet = base.getActiveSheet();
    }
    
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }
    
    const field = sheet.insertField({
      name: name.trim(),
      type: type as any
    });
    
    return {
      id: field.getId(),
      name: field.getName(),
      type: field.getType(),
      isPrimary: field.isPrimary?.() || false
    };
  } catch (error: any) {
    throw new Error(`添加字段失败: ${error.message}`);
  }
}

// 删除字段
function deleteField(fieldId: string, sheetId?: string) {
  try {
    if (!fieldId) {
      throw new Error('字段ID不能为空');
    }
    
    const base = DingdocsScript.base;
    let sheet;
    if (sheetId) {
      sheet = base.getSheet(sheetId);
    } else {
      sheet = base.getActiveSheet();
    }
    
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }
    
    // 检查是否为主键字段
    const field = sheet.getField(fieldId);
    if (field && field.isPrimary?.()) {
      throw new Error('不能删除主键字段');
    }
    
    sheet.deleteField(fieldId);
    return { success: true };
  } catch (error: any) {
    throw new Error(`删除字段失败: ${error.message}`);
  }
}

// 获取记录数据
async function getRecords(sheetId?: string, pageSize = 20) {
  try {
    const base = DingdocsScript.base;
    let sheet;
    if (sheetId) {
      sheet = base.getSheet(sheetId);
    } else {
      sheet = base.getActiveSheet();
    }
    
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }
    
    const result = await sheet.getRecordsAsync({ pageSize });
    
    return {
      records: result.records.map((record: any) => ({
        id: record.getId(),
        fields: record.getCellValues()
      })),
      hasMore: result.hasMore,
      cursor: result.cursor,
      total: result.records.length
    };
  } catch (error: any) {
    throw new Error(`获取记录失败: ${error.message}`);
  }
}

// 添加记录
async function addRecord(fields: Record<string, any>, sheetId?: string) {
  try {
    const base = DingdocsScript.base;
    let sheet;
    if (sheetId) {
      sheet = base.getSheet(sheetId);
    } else {
      sheet = base.getActiveSheet();
    }
    
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }
    
    const records = await sheet.insertRecordsAsync([{ fields }]);
    const record = records[0];
    
    return {
      id: record.getId(),
      fields: record.getCellValues()
    };
  } catch (error: any) {
    throw new Error(`添加记录失败: ${error.message}`);
  }
}

// 更新记录
async function updateRecord(recordId: string, fields: Record<string, any>, sheetId?: string) {
  try {
    if (!recordId) {
      throw new Error('记录ID不能为空');
    }
    
    const base = DingdocsScript.base;
    let sheet;
    if (sheetId) {
      sheet = base.getSheet(sheetId);
    } else {
      sheet = base.getActiveSheet();
    }
    
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }
    
    const records = await sheet.updateRecordsAsync([{ id: recordId, fields }]);
    const record = records[0];
    
    return {
      id: record.getId(),
      fields: record.getCellValues()
    };
  } catch (error: any) {
    throw new Error(`更新记录失败: ${error.message}`);
  }
}

// 删除记录
async function deleteRecord(recordId: string, sheetId?: string) {
  try {
    if (!recordId) {
      throw new Error('记录ID不能为空');
    }

    const base = DingdocsScript.base;
    let sheet;
    if (sheetId) {
      sheet = base.getSheet(sheetId);
    } else {
      sheet = base.getActiveSheet();
    }

    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }

    await sheet.deleteRecordsAsync(recordId);
    return { success: true };
  } catch (error: any) {
    throw new Error(`删除记录失败: ${error.message}`);
  }
}

// 批量删除记录（支持并行删除）
async function deleteRecords(sheetId: string, recordIds: string[]) {
  const base = DingdocsScript.base;
  const sheet = base.getSheet(sheetId);
  if (!sheet) throw new Error('未找到数据表');

  // 如果记录数量较少，直接删除
  if (recordIds.length <= 100) {
    await sheet.deleteRecordsAsync(recordIds);
    return { success: true };
  }

  // 如果记录数量较多，使用并行批量删除（每批100条）
  const deletePromises = [];
  for (let i = 0; i < recordIds.length; i += 100) {
    const batch = recordIds.slice(i, i + 100);
    deletePromises.push(sheet.deleteRecordsAsync(batch));
  }
  await Promise.all(deletePromises);
  return { success: true };
}

// 同步表格字段,确保与后端数据字段一致
async function syncSheetFields(sheetId: string) {
  const base = DingdocsScript.base;
  const sheet = base.getSheet(sheetId);
  if (!sheet) throw new Error('未找到数据表');

  const fields = sheet.getFields();
  const existingFieldNames = new Set<string>();
  let primaryField: any = null;

  // 收集现有字段名称并找到主键字段
  fields.forEach((field: any) => {
    existingFieldNames.add(field.getName());
    if (field.isPrimary?.()) {
      primaryField = field;
    }
  });

  // 目标字段名称列表（从FIELD_MAPPING获取,保持顺序）
  const targetFieldNames = Object.values(FIELD_MAPPING);
  const targetFieldNamesSet = new Set(targetFieldNames);

  // 第一个目标字段应该是主键字段
  const expectedPrimaryFieldName = targetFieldNames[0];

  // 1. 处理主键字段：如果主键字段名称不匹配,重命名主键字段
  if (primaryField && primaryField.getName() !== expectedPrimaryFieldName) {
    console.log(`重命名主键字段: ${primaryField.getName()} -> ${expectedPrimaryFieldName}`);
    primaryField.setName(expectedPrimaryFieldName);
    existingFieldNames.delete(primaryField.getName());
    existingFieldNames.add(expectedPrimaryFieldName);
  }

  // 2. 删除多余的非主键字段
  for (const field of fields) {
    const fieldName = field.getName();
    const isPrimary = field.isPrimary?.();

    if (!isPrimary && !targetFieldNamesSet.has(fieldName)) {
      console.log(`删除多余字段: ${fieldName}`);
      sheet.deleteField(field.getId());
      existingFieldNames.delete(fieldName);
    }
  }

  // 3. 添加缺少的字段
  for (const sheetFieldName of targetFieldNames) {
    if (!existingFieldNames.has(sheetFieldName)) {
      console.log(`添加缺少字段: ${sheetFieldName}`);
      // 根据字段名称推断字段类型和属性
      const fieldConfig = inferFieldTypeAndProperty(sheetFieldName);
      sheet.insertField({
        name: sheetFieldName,
        type: fieldConfig.type,
        property: fieldConfig.property
      });
    }
  }

  return { success: true };
}

// 根据字段名称推断字段类型和属性配置
function inferFieldTypeAndProperty(fieldName: string): { type: any; property?: any } {
  // 日期相关
  if (fieldName.includes('日期') || fieldName.includes('时间')) {
    return { type: 'date' };
  }

  // 数值相关 - 需要区分整数和小数
  if (fieldName.includes('数') || fieldName.includes('量') || fieldName.includes('金额') ||
      fieldName.includes('成本') || fieldName.includes('价格') || fieldName.includes('ROI') ||
      fieldName.includes('率') || fieldName.includes('占比') || fieldName.includes('费用') ||
      fieldName.includes('营业额') || fieldName.includes('停留时长')) {

    // 百分比类型字段(各种率、占比) - 保留4位小数
    if (fieldName.includes('率') || fieldName.includes('占比')) {
      return {
        type: 'number',
        property: {
          formatter: 'FLOAT_4'  // 保留4位小数
        }
      };
    }

    // 金额类型字段 - 保留2位小数
    if (fieldName.includes('金额') || fieldName.includes('成本') ||
        fieldName.includes('价格') || fieldName.includes('费用') ||
        fieldName.includes('营业额')) {
      return {
        type: 'number',
        property: {
          formatter: 'FLOAT_2'  // 保留2位小数
        }
      };
    }

    // ROI - 保留2位小数
    if (fieldName.includes('ROI')) {
      return {
        type: 'number',
        property: {
          formatter: 'FLOAT_2'
        }
      };
    }

    // 其他数值(如件数、人数等整数) - 整数格式
    return {
      type: 'number',
      property: {
        formatter: 'INT'  // 整数格式
      }
    };
  }

  // 默认为文本
  return { type: 'text' };
}

// 批量插入记录（带字段映射，支持并行插入）
async function insertRecords(sheetId: string, backendData: any[]) {
  const base = DingdocsScript.base;
  const sheet = base.getSheet(sheetId);
  if (!sheet) throw new Error('未找到数据表');

  // 在插入数据前,先同步字段
  await syncSheetFields(sheetId);

  // 重新获取字段映射（因为字段可能已变更）
  const fields = sheet.getFields();
  const fieldMap = new Map<string, any>();
  fields.forEach((field: any) => {
    fieldMap.set(field.getName(), field);
  });

  const recordsToInsert = backendData.map((item: any) => {
    const fields: Record<string, any> = {};

    for (const [backendKey, sheetFieldName] of Object.entries(FIELD_MAPPING)) {
      if (fieldMap.has(sheetFieldName) && item[backendKey] !== undefined) {
        let value = item[backendKey];
        if (backendKey === 'date' && value) {
          value = new Date(value).getTime();
        }
        fields[sheetFieldName] = value;
      }
    }

    return { fields };
  });

  // 如果数据量较少，直接插入
  if (recordsToInsert.length <= 500) {
    await sheet.insertRecordsAsync(recordsToInsert);
    return { success: true, count: recordsToInsert.length };
  }

  // 如果数据量较多，使用并行批量插入（每批500条）
  const insertPromises = [];
  for (let i = 0; i < recordsToInsert.length; i += 500) {
    const batch = recordsToInsert.slice(i, i + 500);
    insertPromises.push(sheet.insertRecordsAsync(batch));
  }
  await Promise.all(insertPromises);
  return { success: true, count: recordsToInsert.length };
}

// 获取文档信息
function getDocumentInfo() {
  try {
    const base = DingdocsScript.base;
    const uuid = base.getDentryUuid();
    const sheets = base.getSheets();
    
    return {
      uuid,
      sheetsCount: sheets.length,
      currentSheet: base.getActiveSheet()?.getName() || '无'
    };
  } catch (error: any) {
    throw new Error(`获取文档信息失败: ${error.message}`);
  }
}

// 字段映射表：后端字段名 -> AI表格字段名
const FIELD_MAPPING: Record<string, string> = {
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

// 同步数据：从后端获取数据并更新到表格
async function syncDataFromBackend(sheetId: string, startDate: string, endDate?: string) {
  try {
    const base = DingdocsScript.base;
    const sheet = base.getSheet(sheetId);
    if (!sheet) {
      throw new Error('未找到指定的数据表');
    }

    // 构建API URL
    let apiUrl = 'http://localhost:8080/api/product-daily-view';
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

    // 删除表中所有现有记录（并行批量删除，提升性能）
    console.log('开始删除旧记录...');
    const allRecordIds: string[] = [];
    let hasMore = true;
    let cursor: string | undefined = undefined;

    // 第一步：一次性获取所有记录ID
    while (hasMore) {
      const recordsResult = await sheet.getRecordsAsync({
        pageSize: 100,
        cursor
      });
      if (recordsResult.records.length === 0) {
        break;
      }

      allRecordIds.push(...recordsResult.records.map((r: any) => r.getId()));
      hasMore = recordsResult.hasMore;
      cursor = recordsResult.cursor;
    }
    console.log(`获取到 ${allRecordIds.length} 条待删除记录`);

    // 第二步：并行删除所有记录（每批100条）
    if (allRecordIds.length > 0) {
      const deletePromises = [];
      for (let i = 0; i < allRecordIds.length; i += 100) {
        const batch = allRecordIds.slice(i, i + 100);
        deletePromises.push(sheet.deleteRecordsAsync(batch));
      }
      await Promise.all(deletePromises);
      console.log(`删除完成，共删除 ${allRecordIds.length} 条记录`);
    }
    const deletedCount = allRecordIds.length;

    // 获取表格字段映射
    const fields = sheet.getFields();
    const fieldMap = new Map<string, any>();
    fields.forEach((field: any) => {
      fieldMap.set(field.getName(), field);
    });
    console.log(`表格字段数: ${fields.length}`);

    // 转换并插入新数据（并行批量插入，每批500条，提升性能）
    const batchSize = 500;
    console.log('开始插入新记录...');

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

    // 第二步：并行插入所有记录（每批500条）
    const insertPromises = [];
    for (let i = 0; i < allRecordsToInsert.length; i += batchSize) {
      const batch = allRecordsToInsert.slice(i, i + batchSize);
      insertPromises.push(sheet.insertRecordsAsync(batch));
    }
    await Promise.all(insertPromises);
    const insertedCount = allRecordsToInsert.length;
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

// 注册所有方法供UI层调用
DingdocsScript.registerScript('getActiveSheet', getActiveSheet);
DingdocsScript.registerScript('getAllSheets', getAllSheets);
DingdocsScript.registerScript('createSheet', createSheet);
DingdocsScript.registerScript('deleteSheet', deleteSheet);
DingdocsScript.registerScript('getSheetFields', getSheetFields);
DingdocsScript.registerScript('addField', addField);
DingdocsScript.registerScript('deleteField', deleteField);
DingdocsScript.registerScript('getRecords', getRecords);
DingdocsScript.registerScript('addRecord', addRecord);
DingdocsScript.registerScript('updateRecord', updateRecord);
DingdocsScript.registerScript('deleteRecord', deleteRecord);
DingdocsScript.registerScript('deleteRecords', deleteRecords);
DingdocsScript.registerScript('insertRecords', insertRecords);
DingdocsScript.registerScript('getDocumentInfo', getDocumentInfo);
DingdocsScript.registerScript('syncDataFromBackend', syncDataFromBackend);

export {};
