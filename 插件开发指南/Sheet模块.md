# Sheet模块

`Sheet`即数据表，它负责维护数据与数据之间的联系，接口提供了操作数据表的方法，包括基本信息管理、字段管理、视图管理以及记录操作等功能

通过 `Base` 获取到 `Sheet` 之后，就可以调用 `Sheet` 中的 API，可以通过 `base.getActiveSheet` 方法来获取当前选中的数据表实例：

```typescript
const sheet = DingdocsScript.base.getActiveSheet();
const sheet = DingdocsScript.base.getSheet('数据表1');
```

## 基本信息方法

### getId

获取当前数据表ID。

```typescript
getId(): string
```

**返回值**

*   `string` - 数据表ID
    

**示例**

```typescript
const sheetId = sheet.getId();
console.log(`当前数据表ID: ${sheetId}`);

```

### getName

获取当前数据表名称。

```typescript
getName(): string

```

**返回值**

*   `string` - 数据表名称
    

**示例**

```typescript
const sheetName = sheet.getName();
console.log(`当前数据表名称: ${sheetName}`);

```

### setName

设置当前数据表名称。

```typescript
setName(name: string): Sheet

```

**参数**

*   `name`: `string` - 数据表名称
    

**返回值**

*   `Sheet` - Sheet对象本身，支持链式调用
    

**示例**

```typescript
sheet.setName('销售记录');
// 链式调用
sheet.setName('客户信息').getFields();

```

**注意事项**

*   数据表名称长度不能超过100个字符
    
*   不能包含以下特殊字符: `/\?*[ ]:`
    
*   不能与已有数据表同名
    

### getDesc

获取数据表描述。

```typescript
getDesc(): string | undefined

```

**返回值**

*   `string | undefined` - 数据表描述文案，没有描述时默认返回undefined
    

**示例**

```typescript
const description = sheet.getDesc();
if (description) {
  console.log(`数据表描述: ${description}`);
} else {
  console.log('该数据表暂无描述');
}

```

### setDesc

设置当前数据表描述。

```typescript
setDesc(desc: string): Sheet

```

**参数**

*   `desc`: `string` - 数据表描述文案
    

**返回值**

*   `Sheet` - Sheet对象本身，支持链式调用
    

**示例**

```typescript
sheet.setDesc('本表用于记录公司客户的基本信息和联系方式');

```

## 字段管理方法

### isFieldExist

判断当前数据表中指定ID的字段是否存在。

```typescript
isFieldExist(fieldId: string): boolean

```

**参数**

*   `fieldId`: `string` - 字段ID
    

**返回值**

*   `boolean` - 是否存在
    

**示例**

```typescript
if (sheet.isFieldExist('fld123456')) {
  console.log('字段存在，可以进行操作');
} else {
  console.log('字段不存在，请检查字段ID');
}

```

### getFields

获取当前数据表中所有字段列表。

```typescript

getFields(): Field[]


```

**返回值**

*   `Field[]` - 字段列表
    

**示例**

```typescript
const fields = sheet.getFields();
console.log(`数据表共有 ${fields.length} 个字段`);
fields.forEach(field => {
  console.log(`- ${field.getName()}: ${field.getType()}`);
});

```

### getField

根据字段ID或字段名称获取指定字段。

```typescript
getField<T extends Field = Field>(idOrName: string): T | null
```

**参数**

*   `idOrName`: `string` - 字段ID或字段名称
    

**返回值**

*   `Field | null` - 字段对象，若当前未找到符合条件的字段，则返回null
    

**示例**

```typescript
// 通过字段ID获取字段
const fieldById = sheet.getField('fld123456');

// 通过字段名称获取字段
const fieldByName = sheet.getField('客户姓名');
if (fieldByName) {
  console.log(`字段类型: ${fieldByName.getType()}`);
} else {
  console.log('未找到指定字段');
}

```

建议传入 `Field` 类型(例如示例中的 `<AttachmentField>`)，来获得更好的语法提示

```typescript
// getAttachmentUrls是附件字段独有的方法
const field = sheet.getField<AttachmentField>(idOrName);
const urls = field.getAttachmentUrls('recordId');
```

### insertField

插入字段。

```typescript
insertField(name: string, type: FieldType, property?: OpenApi.FieldProperty): Field

interface FieldProperty {
  /**
   * 字段格式[数字/时间/进度/货币字段可配置]
   */
  formatter?: NUMERICAL_FORMAT | DATE_FORMAT | PROGRESS_FORMAT;
  /**
   * 选项配置[单选/多选字段可配置]
   */
  choices?: SelectOptions[];
  /**
   * 要关联的数据表Id[单向关联/双向关联字段可配置]
   */
  linkedSheetId?: string;
  /**
   * 双向关联的字段Id[由系统自动生成]
   */
  linkedFieldId?: string;
  /**
   * 是否可多选[人员/群组/部门/单向关联/双向关联字段可配置]
   */
  multiple?: boolean;
  /**
   * 最小值[进度、评分字段可配置，评分字段下仅支持配置0或1的整数]
   */
  min?: number;
  /**
   * 最大值[进度、评分字段可配置，评分字段下仅支持配置2～5的整数]
   */
  max?: number;
  /**
   * 是否可自定义进度条值[进度字段可配置]
   */
  customizeRange?: boolean;
  /**
   * 评分图标[评分字段可配置]
   */
  icon?: RATING_ICON_TYPE;
  /**
   * 货币币种[货币字段可配置]
   */
  currencyType?: CURRENCY_TYPE;
}
```

**参数**

*   `name`: `string` - 字段名称
    
*   `type`: `FieldType` - 字段类型
    
*   `property`: `FieldProperty` - 字段配置
    

**返回值**

*   `Field` - 插入的字段对象
    

**示例**

```typescript
// 插入文本字段
const textField = sheet.insertField('备注', 'text');
```

### updateField

更新指定字段配置。

如果要修改字段类型，请调用【updateFieldAsync】

```typescript
updateField(field: FieldToUpdate): Field

interface FieldToUpdate {
  id?: string;
  name?: string;
  property?: FieldProperty;
}

```

**返回值**

*   `Field` - 更新后的字段对象
    

### updateFieldAsync

更新指定字段配置，包括【字段类型】

```typescript
updateFieldAsync(id: string, field: FieldToUpdate): Promise<Field>

interface FieldToUpdate {
  name?: string;
  type?: string
  property?: FieldProperty;
}

```

**返回值**

*   `Promoise<Field>` - 更新后的字段对象
    

### deleteField

根据字段ID或字段名称删除指定字段。

```typescript
deleteField(idOrName: string): Sheet
```

**参数**

*   `idOrName`: `string` - 字段ID或字段名称
    

**返回值**

*   `Sheet` - Sheet对象本身，支持链式调用
    

**示例**

```typescript
// 通过字段ID删除字段
sheet.deleteField('fld123456');

// 通过字段名称删除字段
sheet.deleteField('临时备注');

// 链式调用
sheet.deleteField('不需要的字段').setName('更新后的表名');

```

**注意事项**

*   不能删除主键字段
    
*   不能删除表中的最后一个字段
    

## 视图管理方法

### getViews

获取当前数据表的所有视图列表。

```typescript
getViews(): View[]
```

**返回值**

*   `View[]` - 视图列表
    

**示例**

```typescript
const views = sheet.getViews();
console.log(`数据表共有 ${views.length} 个视图`);

```

### getView

根据视图ID或视图名称获取指定视图。

```typescript
getView(id: string): View | null

```

**参数**

*   `id`: `string` - 指定视图的ID
    

**返回值**

*   `View | null` - 指定的视图对象，未找到视图时返回null
    

## 记录操作方法

### getRecordAsync

获取单条记录。

```typescript
getRecordAsync(recordId: string): Promise<Record | null>
```

**参数**

*   `recordId`: `string` - 记录ID
    

**返回值**

*   `Promise<Record | null>` - 记录对象，如果记录不存在则返回null
    

**示例**

```typescript
// 获取指定ID的记录
const record = await sheet.getRecordAsync('rec123456');
if (record) {
  console.log(`记录标题: ${record.getCellValue('标题')}`);
  console.log(`记录创建时间: ${record.getCellValue('创建时间')}`);
} else {
  console.log('未找到指定记录');
}

```

## getRecordsAsync

分页加载数据表中的记录。

```typescript
getRecordsAsync(options?: GetRecordsOptions): Promise<GetRecordsResult>

```

**参数**

*   `recordIds`: `string[]` (可选) - 要加载的 recordId
    
*   `fieldIds`: `string[]` (可选) - 要加载的 fieldId
    
*   `pageSize`: `number` (可选) - 每页加载的记录数量
    
*   `cursor`: `string` (可选) - 用于分页的游标
    
*   `viewId`: `string` (可选) - 指定视图，获取当前视图下的记录
    

**返回值**

*   `Promise<GetRecordsResult>` - 包含以下属性的结果对象：
    
    *   `records`: `Record[]` - 记录列表
        
    *   `hasMore`: `boolean` - 是否还有更多记录可加载
        
    *   `cursor`: `string` - 用于加载下一页的游标，如果没有更多记录则为空字符串
        

**示例**

```typescript
// 基本使用 - 使用选项对象
const result = await sheet.getRecordsAsync({ 
  pageSize: 50 
});
console.log(`获取了 ${result.records.length} 条记录`);
result.records.forEach(record => {
  console.log(`- ${record.getCellValue('标题')}`);
});


// 分页加载所有记录
async function loadAllRecords(sheet) {
  const allRecords = [];

  let hasMore = true;
  let cursor = '';
  
  while (hasMore) {
    const result = await sheet.getRecordsAsync({
      pageSize: 100,
      cursor: cursor
    });
    
    allRecords.push(...result.records);
    hasMore = result.hasMore;
    cursor = result.cursor;
    
    console.log(`已加载 ${allRecords.length} 条记录...`);
  }
  
  return allRecords;
}

```

**注意事项**

*   每页最多加载100条记录
    
*   通过多次调用并使用游标可以加载所有符合条件的记录
    
*   对于性能考虑，建议适当设置页面大小，避免一次加载过多数据
    
*   返回的记录已经过权限过滤，只包含当前用户有权限查看的记录
    

### insertRecordsAsync

批量插入记录。

```typescript
insertRecordsAsync(records: RecordToInsert[ ]): Promise<Record[]>

interface RecordToInsert {
  /**
   * 字段值，key为fieldId，value为对应的值。
   */
  fields: Record<string /* fieldId */, OpenApi.CellValue>;
  id?: string;
}
```

**参数**

*   `records`: `RecordToInsert[]` - 要插入的记录数组，每个记录包含fields属性（字段值映射）
    

**返回值**

*   `Promise<Record[]>` - 插入的记录对象数组
    

**示例**

```typescript
// 插入单条记录
const newRecords = await sheet.insertRecordsAsync([
  {
    fields: {
      '标题': '新客户开发计划',
      '负责人': '张三',
      '优先级': '高',
      '截止日期': '2025-12-31'
    }
  }
]);
console.log(`成功创建记录，ID: ${newRecords[0].getId()}`);

// 批量插入多条记录
const batchRecords = await sheet.insertRecordsAsync([
  {
    fields: { '客户名称': '阿里巴巴', '联系人': '马云', '状态': '已签约' }
  },
  {
    fields: { '客户名称': '腾讯', '联系人': '马化腾', '状态': '洽谈中' }
  },
  {
    fields: { '客户名称': '百度', '联系人': '李彦宏', '状态': '已联系' }
  }
]);
console.log(`成功批量创建 ${batchRecords.length} 条记录`);

```

**注意事项**

*   一次最多可以插入500条记录
    
*   需要有记录创建权限
    
*   字段标识符可以是字段ID或字段名称
    
*   如果记录总数超过表格限制会失败
    

### updateRecordsAsync

批量更新记录。

```typescript
updateRecordsAsync(records: RecordToUpdate[]): Promise<Record[]>

interface RecordToUpdate {
  /**
   * 字段值，key为fieldId，value为对应的值。
   */
  fields: Record<string /* fieldId */, OpenApi.CellValue>;
  id: string;
}
```

**参数**

*   `records`: `RecordToUpdate[]` - 要更新的记录数组，每个记录包含fields属性（字段值映射）
    
    *   `id`: `string` - 要更新的记录ID
        
    *   `fields`: `Record<string, unknown>` - 要更新的字段值映射
        

**返回值**

*   `Promise<Record[ ]>` - 更新后的记录对象数组
    

**示例**

```typescript
// 更新单条记录
const updatedRecords = await sheet.updateRecordsAsync([
  {
    id: 'rec123456',
    fields: {
      '状态': '已完成',
      '完成时间': new Date(),
      '备注': '按时完成所有任务'
    }
  }
]);
console.log(`成功更新记录: ${updatedRecords[0].getId()}`);

// 批量更新多条记录状态
await sheet.updateRecordsAsync([
  {
    id: 'rec123456',
    fields: { '状态': '已完成' }
  },
  {
    id: 'rec234567',
    fields: { '状态': '处理中', '优先级': '高' }
  },
  {
    id: 'rec345678',
    fields: { '状态': '已取消', '备注': '客户需求变更' }
  }
]);

```

**注意事项**

*   一次最多可以更新100条记录
    
*   需要有记录更新权限
    
*   只会更新指定的字段，未指定的字段保持不变
    
*   字段标识符可以是字段ID或字段名称
    

### deleteRecordsAsync

删除一条或多条记录。

```typescript
deleteRecordsAsync(ids: string | string[ ]): Promise<void>
```

**参数**

*   `ids`: `string | string[ ]` - 要删除的记录ID或ID数组
    

**返回值**

*   `Promise<void>` - 返回Promise，操作完成时解析
    

**示例**

```typescript
// 删除单条记录
await sheet.deleteRecordsAsync('rec123456');
console.log('记录已删除');

// 删除多条记录
await sheet.deleteRecordsAsync([
  'rec123456', 
  'rec234567', 
  'rec345678'
]);
console.log('多条记录已删除');

// 条件删除记录示例
const recordsToDelete = await sheet.getRecordsAsync({
  filter: {
    conjunction: 'and',
    conditions: [
      {
        fieldName: '状态',
        operator: 'is',
        value: '已取消'
      }
    ]
  }
});

if (recordsToDelete.records.length > 0) {
  const recordIds = recordsToDelete.records.map(record => record.getId());
  await sheet.deleteRecordsAsync(recordIds);
  console.log(`已删除 ${recordIds.length} 条已取消的记录`);
}

```

**注意事项**

*   一次最多可以删除100条记录
    
*   需要有记录删除权限