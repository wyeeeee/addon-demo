# View模块

表示数据表中的视图，是数据表的呈现方式，提供了访问视图基本信息和转换为具体视图类型的方法。View是所有具体视图类型（如GridView、KanbanView等）的基础类。

## 基本信息方法

### getId

获取视图ID。

```typescript
getId(): string

```

**返回值**

*   `string` - 视图ID
    

**示例**

```typescript
const view = sheet.getView('view123');
const viewId = view.getId();
console.log(`视图ID: ${viewId}`);

```

### getType

获取视图类型。

```typescript
getType(): 'Gantt' | 'Grid' | 'Kanban' | 'Calendar' | 'Gallery'

```

**返回值**

*   `string` - 视图类型
    

**示例**

```typescript
const view = sheet.getView('view123');
const viewType = view.getType();
console.log(`视图类型: ${viewType}`);

```

### isValid

检查视图对象是否有效。

```typescript
isValid(): boolean

```

**返回值**

*   `boolean` - 如果视图存在且有效返回true，否则返回false
    

**示例**

```typescript
const view = sheet.getView('view123');
if (view.isValid()) {
  console.log('视图有效，可以进行操作');
} else {
  console.log('视图无效或已被删除');
}

```

### getSheetId

获取视图所属数据表的ID。

```typescript
getSheetId(): string

```

**返回值**

*   `string` - 数据表ID
    

**示例**

```typescript
const sheetId = view.getSheetId();
console.log(`视图所属数据表ID: ${sheetId}`);

```

## 视图类型转换方法

### asGridView

将当前视图转换为表格视图对象。

```typescript
asGridView(): GridView | null

```

**返回值**

*   `GridView | null` - 如果当前视图是表格视图则返回GridView对象，否则返回null
    

**示例**

```typescript
const view = sheet.getView('view123');
const gridView = view.asGridView();

if (gridView) {
  console.log('这是一个表格视图');
  
  // 可以使用表格视图的专有方法
  const visibleFields = await gridView.getVisibleFieldIdList();
  const filterInfo = await gridView.getFilterInfo();
  
  console.log(`可见字段数量: ${visibleFields.length}`);
  console.log(`筛选条件数量: ${filterInfo?.conditions.length || 0}`);
} else {
  console.log('这不是表格视图');
}

```

## 视图类型说明

目前支持以下几种不同类型的视图：

*   **GridView（表格视图）** - 以表格形式展示数据
    

每种视图类型都有其特定的功能和API，View基类提供了统一的基础接口。

## 视图基础概念

### 筛选（Filter）

视图根据筛选条件过滤出数据表中符合条件的记录，主要由筛选条件和生效条件两部分组成：

```typescript
interface IFilterInfo {
  conjunction: FilterConjunction;  // 筛选条件之间的关系

  conditions: FilterInfoCondition[ ];  // 具体的筛选条件

}

interface FilterInfoCondition {
  fieldId: string;  // 字段ID
  conditionId?: string;  // 条件ID（可选）
  value: any;  // 匹配值
  operator: FilterOperator;  // 操作符
}

enum FilterConjunction {
  And = 'and',  // 满足所有条件
  Or = 'or'     // 满足任一条件
}

enum FilterOperator {
  Is = 'is',                    // 等于
  IsNot = 'isNot',             // 不等于
  Contains = 'contains',        // 包含
  DoesNotContain = 'doesNotContain',  // 不包含
  IsEmpty = 'isEmpty',         // 为空
  IsNotEmpty = 'isNotEmpty',   // 不为空
  IsGreater = 'isGreater',     // 大于
  IsGreaterEqual = 'isGreaterEqual',  // 大于或等于
  IsLess = 'isLess',           // 小于
  IsLessEqual = 'isLessEqual'  // 小于或等于
}

```

## 扩展阅读

*   [GridView模块](./GridView%E6%A8%A1%E5%9D%97.md)\- 表格视图的详细API文档
    
*   其他视图类型的API文档（如KanbanView、FormView等）将在后续提供