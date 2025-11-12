/*global DingdocsScript*/

/**
 * AI表格边栏插件服务层
 * 运行在 Web Worker 中，提供AI表格操作的核心功能
 */

// 导入各模块功能
import {
  getActiveSheet,
  getAllSheets,
  createSheet,
  deleteSheet,
  getDocumentInfo
} from './modules/sheet-operations.ts';

import {
  getSheetFields,
  addField,
  deleteField
} from './modules/field-operations.ts';

import {
  getRecords,
  addRecord,
  updateRecord,
  deleteRecord,
  deleteRecords,
  insertRecords
} from './modules/record-operations.ts';

import {
  fetchBackendData,
  getExistingRecords,
  calculateSyncDiff,
  syncBatchDelete,
  syncBatchInsert
} from './modules/data-sync.ts';

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
// 注册分步同步相关方法
DingdocsScript.registerScript('fetchBackendData', fetchBackendData);
DingdocsScript.registerScript('getExistingRecords', getExistingRecords);
DingdocsScript.registerScript('calculateSyncDiff', calculateSyncDiff);
DingdocsScript.registerScript('syncBatchDelete', syncBatchDelete);
DingdocsScript.registerScript('syncBatchInsert', syncBatchInsert);

export {};
