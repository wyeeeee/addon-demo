# Base模块

当前AI表格格实例，AI表格格相关 API 的主入口，提供了操作AI表格基础对象的方法，支持查询权限、管理数据表以及获取选择区域等信息。

```typescript
const base = DingdocsScript.base;
```

### getActiveSheet

获取当前激活的数据表对象。

```typescript
getActiveSheet(): Sheet | null
```

**返回值**

*   `Sheet | null` - 当前选中的数据表对象，若未选中任何数据表则返回 null
    

**示例**

```typescript
const activeSheet = base.getActiveSheet();
if (activeSheet) {
  console.log(`当前选中的数据表: ${activeSheet.getName()}`);
} else {
  console.log('当前未选中任何数据表');
}

```

### getSheet

根据数据表ID或数据表名称获取指定数据表。

```typescript
getSheet(idOrName: string): Sheet | null

```

**参数**

*   `idOrName`: `string` - 数据表ID或数据表名称
    

**返回值**

*   `Sheet | null` - 匹配的数据表对象，若未找到则返回 null
    

**示例**

```typescript
// 通过名称获取数据表
const productSheet = base.getSheet('产品清单');
if (productSheet) {
  console.log(`成功获取数据表，字段数量: ${productSheet.getFields().length}`);
}

// 通过ID获取数据表
const sheetById = base.getSheet('sht123456');

```

### getSheets

获取当前用户可见的所有数据表。

```typescript
getSheets(): Sheet[]
```

**返回值**

*   `Sheet[]` - 当前用户可见的所有数据表对象数组
    

**示例**

```typescript
const allSheets = base.getSheets();
console.log(`可见的数据表数量: ${allSheets.length}`);
allSheets.forEach(sheet => {
  console.log(`- ${sheet.getName()}`);
});

```

### insertSheet

插入一张数据表。

```typescript
insertSheet(name: string, fields?: FieldToInsert[]): Sheet

interface FieldToInsert {
  /** 字段名称 */
  name: string;
  /** 字段类型 */
  type: FieldType;
  /** 字段属性 */
  property?: FieldProperty;
}
```

**参数**

*   `name`: `string` - 数据表名称
    
*   `fields`: `FieldToInsert[]` (可选) - 数据表携带的字段配置，不传时会携带默认空数据表模版的字段
    

**返回值**

*   `Sheet` - 新插入的数据表对象
    

**示例**

```typescript
// 创建一个仅有默认字段的数据表
const newSheet = base.insertSheet('新数据表');

// 创建一个带有自定义字段的数据表
const customSheet = base.insertSheet('客户信息', [
  { name: '客户名称', type: 'text' },
  { name: '注册日期', type: 'date' }
]);

```

### deleteSheet

根据数据表ID或数据表名称删除指定数据表。

```typescript
deleteSheet(idOrName: string): Base
```

**参数**

*   `idOrName`: `string` - 数据表ID或数据表名称
    

**返回值**

*   `Base` - Base对象本身，支持链式调用
    

**示例**

```typescript
// 通过名称删除数据表
base.deleteSheet('临时数据表');

// 通过ID删除数据表并链式调用
base.deleteSheet('sht123456').getSheets();

```

### getSelection

获取当前AI表格激活区域的信息

```typescript
getSelection: () => Selection;


interface Selection {
  /** 当前AI表格的ID */
  baseId: string;
  /** 当前选中区域所属数据表ID，未选中数据表时返回null */
  sheetId: SheetId | null;
  /** 当前选中区域所属视图ID，未选中视图时返回null */
  viewId: string | null;
  /** 当前选中区域所属字段ID，未选中单元格时返回null */
  fieldId: FieldId | null;
  /** 当前选中区域所属记录ID，未选中单元格时返回null */
  recordId: string | null;
  /**
   * 当前选中表区域的范围
   */
  selectedArea: {
    /**
     * 当前选中区域所属字段ID
     */
    fieldIds: string[] | null;
    /**
     * 当前选中区域所属记录ID
     */
    recordIds: string[] | null;
  } | null;
}
```

**返回值**

*   `Selection` - 数据表激活区域的信息
    

### getDentryUuid

获取文档dentryUuid。

```typescript
getDentryUuid(): string
```

**返回值**

*   `string` - 文档的dentryUuid
    

**示例**

```typescript
const uuid = base.getDentryUuid();
console.log(`当前文档UUID: ${uuid}`);

```

## 注意事项

1.  在使用 `insertSheet` 方法时，确保提供的字段名称不重复，且第一个字段类型必须支持作为主字段
    
2.  不能删除最后一张数据表，调用 `deleteSheet` 时需注意
    
3.  部分操作受权限限制，在执行前可以通过 `getPermissionAsync` 检查权限