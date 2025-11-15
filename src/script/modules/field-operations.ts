import { getSheet } from './utils.ts';

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

