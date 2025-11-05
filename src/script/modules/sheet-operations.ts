/*global DingdocsScript*/

/**
 * Sheet 操作模块
 * 提供数据表的 CRUD 操作
 */

/**
 * 获取当前激活的数据表
 */
export function getActiveSheet() {
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

/**
 * 获取所有数据表列表
 */
export function getAllSheets() {
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

/**
 * 创建新的数据表
 */
export function createSheet(name: string) {
  try {
    if (!name || name.trim() === '') {
      throw new Error('数据表名称不能为空');
    }

    const base = DingdocsScript.base;
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

/**
 * 删除数据表
 */
export function deleteSheet(sheetId: string) {
  try {
    if (!sheetId) {
      throw new Error('数据表ID不能为空');
    }
    const base = DingdocsScript.base;
    base.deleteSheet(sheetId);
    return { success: true };
  } catch (error: any) {
    throw new Error(`删除数据表失败: ${error.message}`);
  }
}

/**
 * 获取文档信息
 */
export function getDocumentInfo() {
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
