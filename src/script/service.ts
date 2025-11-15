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
  batchDeleteRecords,
  batchInsertRecords,
  getSheetAllRecords
} from './modules/data-sync.ts';

import { getAllMappingConfigs } from './modules/mapping-config.ts';
import { compareData } from './modules/data-compare.ts';

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
DingdocsScript.registerScript('batchDeleteRecords', batchDeleteRecords);
DingdocsScript.registerScript('batchInsertRecords', batchInsertRecords);
DingdocsScript.registerScript('getSheetAllRecords', getSheetAllRecords);
DingdocsScript.registerScript('getAllMappingConfigs', getAllMappingConfigs);
DingdocsScript.registerScript('compareData', compareData);

export {};
