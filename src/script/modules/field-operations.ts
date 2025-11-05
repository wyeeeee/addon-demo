/*global DingdocsScript*/

import { FIELD_MAPPING } from './constants.ts';
import { getSheet, inferFieldTypeAndProperty } from './utils.ts';

/**
 * Field 操作模块
 * 提供字段的 CRUD 操作和同步功能
 */

/**
 * 获取数据表字段信息
 */
export function getSheetFields(sheetId?: string) {
  try {
    const sheet = getSheet(sheetId);
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

/**
 * 添加字段
 */
export function addField(name: string, type: string, sheetId?: string) {
  try {
    if (!name || name.trim() === '') {
      throw new Error('字段名称不能为空');
    }

    const sheet = getSheet(sheetId);
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

/**
 * 删除字段
 */
export function deleteField(fieldId: string, sheetId?: string) {
  try {
    if (!fieldId) {
      throw new Error('字段ID不能为空');
    }

    const sheet = getSheet(sheetId);
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

/**
 * 同步表格字段,确保与后端数据字段一致
 */
export async function syncSheetFields(sheetId: string) {
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

  // 目标字段名称列表
  const targetFieldNames = Object.values(FIELD_MAPPING);
  const targetFieldNamesSet = new Set(targetFieldNames);
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
