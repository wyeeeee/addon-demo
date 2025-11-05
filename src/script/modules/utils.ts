/*global DingdocsScript*/

/**
 * 工具函数模块
 */

/**
 * 根据sheetId或不传参获取数据表
 */
export function getSheet(sheetId?: string): any {
  const base = DingdocsScript.base;
  if (sheetId) {
    return base.getSheet(sheetId);
  }
  return base.getActiveSheet();
}

/**
 * 根据字段名称推断字段类型和属性配置
 */
export function inferFieldTypeAndProperty(fieldName: string): { type: any; property?: any } {
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
          formatter: 'FLOAT_4'
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
          formatter: 'FLOAT_2'
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
        formatter: 'INT'
      }
    };
  }

  // 默认为文本
  return { type: 'text' };
}

/**
 * 转换记录数据为简单对象格式
 */
export function mapRecordToObject(record: any) {
  return {
    id: record.getId(),
    fields: record.getCellValues()
  };
}
