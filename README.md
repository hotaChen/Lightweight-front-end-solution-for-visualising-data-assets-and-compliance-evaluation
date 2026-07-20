# Lightweight-front-end-solution-for-visualising-data-assets-and-compliance-evaluation 数据资产分类分级与合规风险管理平台

企业数据资产分类分级、血缘追踪与合规风险管理的可视化原型系统。纯前端实现，所有数据为静态模拟数据，无需后端服务。
---

## 技术栈

| 类别 | 技术 | 用途 |
|------|------|------|
| 框架 | Vue 3 (Composition API + `<script setup>`) | 响应式 UI 框架 |
| 构建 | Vite 8 | 开发服务器与生产构建 |
| 语言 | TypeScript ~5.7 | 静态类型检查 |
| 路由 | Vue Router 4 | 客户端 SPA 路由，懒加载 |
| 图表 | ECharts 5 | 饼图、柱状图、折线图、雷达图、环形图 |
| 关系图 | AntV G6 5 | 数据血缘 DAG 图 (Dagre 布局) |
| CSS | 纯 CSS | CSS 自定义属性 + 原子工具类，无第三方框架 |

---

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # 生产构建 → dist/
npm run preview    # 预览构建产物
```

---

## 项目结构

```
src/
├── main.ts                         # 应用入口
├── App.vue                         # 根组件
├── router/index.ts                 # 6 条路由 (懒加载)
├── data/index.ts                   # 类型定义 + 模拟数据 + 聚合计算
├── styles/
│   ├── variables.css               # CSS 自定义属性 (亮/暗主题)
│   ├── reset.css                   # 浏览器重置
│   └── utilities.css               # 原子工具类 (~180 条)
├── components/
│   ├── AppShell.vue                # 全局布局 (侧边栏 + 面包屑 + 主内容)
│   ├── Badges.vue                  # 业务徽章 (等级/合规/风险)
│   ├── ui/                         # 基础组件 (Button, Card, Input, Select, Table, ...)
│   ├── overview/                   # 总览页 (StatCard, ChartCard, 3 个 ECharts 图表)
│   ├── risk/                       # 风险页 (Heatmap, Radar, Donut, SummaryStat)
│   ├── catalog/                    # 目录页 (CatalogTable, FieldTable, MetaItem)
│   └── lineage/                    # 血缘页 (G6 图, RelList)
└── pages/
    ├── OverviewPage.vue            # /              数据资产总览
    ├── RiskPage.vue                # /risk          合规风险看板
    ├── LineagePage.vue             # /lineage       数据血缘关系图
    ├── CatalogPage.vue             # /catalog       数据资产目录
    ├── FieldDetailPage.vue         # /catalog/:id   字段详情
    └── NavPage.vue                 # /design-system 导航入口
```

---

## 路由

| 路径 | 页面 | 优先级 | 说明 |
|------|------|--------|------|
| `/` | 数据资产总览 | P0 | 全局指标、分类分布、敏感等级、变更趋势 |
| `/risk` | 合规风险看板 | P0 | 综合评分、风险热力图、合规雷达、整改清单 |
| `/lineage` | 数据血缘关系图 | P1 | DAG 图，节点点击查看上下游 |
| `/catalog` | 数据资产目录 | P1 | 多维筛选检索，下钻字段详情 |
| `/catalog/:id` | 字段详情 | — | 表元信息、简化血缘、字段清单 |
| `/design-system` | 导航入口 | — | 功能模块导航页 |

### 跨页面导航

- 分类饼图点击扇区 → `/catalog?category=xxx`
- 风险快览/待处置清单点击行 → `/catalog/:id`
- 详情页血缘区 → `/lineage`
- 血缘图节点详情 → `/catalog/:id`

---

## 数据模型

### 核心类型

```typescript
type SensitivityLevel = "核心" | "敏感" | "内部" | "公开"     // 4 级
type DataCategory = "个人信息" | "财务数据" | "业务数据" | "公开数据"  // 4 类
type BusinessDomain = "客户中心" | "交易系统" | "营销平台" | "风控合规" | "人力资源" | "供应链"  // 6 域
type ComplianceStatus = "已合规" | "待整改" | "超期整改"         // 3 态
```

### DataTable 实体

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| name / cnName | string | 英文/中文表名 |
| domain | BusinessDomain | 所属业务域 |
| category | DataCategory | 数据分类 |
| level | SensitivityLevel | 敏感等级 |
| owner | string | 负责人 |
| riskScore | number | 风险评分 (0-100) |
| compliance | ComplianceStatus | 合规状态 |
| fields | FieldInfo[] | 字段清单 |
| upstream / downstream | string[] | 上下游表 ID |

### FieldInfo 实体

| 字段 | 类型 | 说明 |
|------|------|------|
| name / desc / type | string | 字段名/描述/数据类型 |
| category | DataCategory | 数据分类 |
| level | SensitivityLevel | 敏感等级 |
| regulation | string | 依据法规 |

### 模拟数据

- **10 张数据表**，覆盖 6 个业务域，总计 178+ 字段
- 预计算聚合数据: `OVERVIEW_STATS`, `CATEGORY_DISTRIBUTION`, `DOMAIN_LEVEL_DISTRIBUTION`, `TREND_DATA`, `RISK_HEATMAP`, `COMPLIANCE_RADAR`, `COMPLIANCE_STATUS_STATS`, `HIGH_RISK_TABLES`

---

## 组件设计

### AppShell 布局

```
+-------------------------------------------------------+
|  Sidebar (16rem)  |  Header (sticky, 3.5rem)          |
|  +-----------+    |  [Trigger] > Breadcrumb           |
|  | Logo      |    +-----------------------------------+
|  | Nav × 5   |    |  Main Content                     |
|  | User Info |    |                                   |
|  +-----------+    +-----------------------------------+
```

- 侧边栏 sticky, 100vh；顶栏 sticky, 毛玻璃效果
- 面包屑自动渲染，导航项根据当前路由高亮
- 暗色模式由 `prefers-color-scheme` 媒体查询驱动

### Badges 业务徽章

```html
<Badges badge-type="level" :level="'核心'" />
<Badges badge-type="compliance" :status="'待整改'" />
<Badges badge-type="risk" :score="92" />
```

### ECharts 图表

统一模式: `ref` 获取 DOM → `onMounted` 初始化 → `setOption` 配置 → `onUnmounted` 销毁

| 组件 | 类型 | 说明 |
|------|------|------|
| CategoryPie | 环形饼图 | 点击扇区路由跳转 |
| DomainLevelBar | 堆叠柱状图 | 4 级 stack, 6 域分组 |
| TrendLine | 折线图 | 新增/变更双线, 12 个月 |
| ComplianceRadar | 雷达图 | 6 维合规评分 |
| ComplianceStatusDonut | 环形图 | 3 段合规状态 |

### AntV G6 血缘图

- G6 v5 `Graph` + Dagre 布局 (`rankdir: 'LR'`)
- 节点按敏感等级着色边框；点击节点高亮关联边 + 更新侧栏详情
- 拖拽画布、滚轮缩放

---

## CSS 体系

**设计令牌** — `variables.css` 定义 ~40 个 CSS 变量: `--chart-1` ~ `--chart-5`, `--background`, `--foreground`, `--card`, `--muted`, `--border`, `--primary`, `--sidebar-*`, `--radius` 等。暗色模式通过 `@media (prefers-color-scheme: dark)` 覆盖。

**工具类** — `utilities.css` 提供 ~180 条原子规则 (Flex/Grid、间距、排版、尺寸、边框、响应式断点、hover 伪类)，等效 Tailwind 子集。

**组件样式** — `<style scoped>` 隔离，直接引用 CSS 变量。

---

## 浏览器兼容性

Chrome 90+, Firefox 90+, Safari 15+, Edge 90+。依赖 CSS Grid、CSS 自定义属性、`color-mix()`、`prefers-color-scheme`。不支持 IE。

---

## ECharts 图表开发指南

### 通用模式

所有图表组件 (`CategoryPie`, `DomainLevelBar`, `TrendLine`, `ComplianceRadar`, `ComplianceStatusDonut`) 遵循统一结构：

```vue
<template>
  <div ref="chartRef" class="chart-container" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { cssVar } from '@/utils/color'

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)

  // ★ 使用 cssVar() 解析 CSS 变量，不要直接传 'var(--xxx)' 到 ECharts
  const mutedFg = cssVar('--muted-foreground')
  const border = cssVar('--border')

  chart.setOption({ /* ECharts 配置 */ })
}

onMounted(() => initChart())
onUnmounted(() => chart?.dispose())
</script>
```

### 颜色解析器 `cssVar()`

```typescript
// src/utils/color.ts
import { cssVar } from '@/utils/color'

// 两种格式均支持：
cssVar('--chart-1')        // '#ef4444'
cssVar('var(--chart-1)')   // '#ef4444'  (数据层导出格式)
```

**为什么需要 `cssVar()`**：数据层导出的颜色字段存储的是 CSS 变量引用（如 `var(--chart-1)`）。ECharts 基于 Canvas 渲染，无法解析 CSS 自定义属性，必须在传入 `setOption()` 之前用 `cssVar()` 转换为实际色值。

### 设计令牌色板

| 变量 | 亮色主题 | 暗色主题 | 用途 |
|------|------|------|------|
| `--chart-1` | `#ef4444` | `#f87171` | 红色 (核心/高风险) |
| `--chart-2` | `#f97316` | `#fb923c` | 橙色 (敏感/警告) |
| `--chart-3` | `#6366f1` | `#818cf8` | 紫色 (内部) |
| `--chart-4` | `#22c55e` | `#4ade80` | 绿色 (公开/已合规) |
| `--chart-5` | `#06b6d4` | `#22d3ee` | 青色 (辅助) |
| `--primary` | `#3b82f6` | `#60a5fa` | 主题蓝 |
| `--muted-foreground` | `#64748b` | `#94a3b8` | 弱化文字 |
| `--border` | `#e2e8f0` | `#334155` | 边框/分割线 |
| `--card` | `#ffffff` | `#1e293b` | 卡片背景 |

### 新增图表步骤

1. 在 `src/components/<domain>/` 下创建 `YourChart.vue`
2. 复制通用模式骨架（`ref` + `onMounted` + `onUnmounted`）
3. 在 `initChart()` 中调用 `cssVar()` 解析所有颜色
4. 调用 `chart.setOption({...})` 配置 ECharts
5. 数据直接从 `@/data` 导入，颜色通过 `cssVar()` 渲染
6. **禁止**在 `setOption()` 内出现 `var(--xxx)` 字符串

---

## AntV G6 血缘图开发指南

### 组件接口

```typescript
// src/components/lineage/LineageGraphPanel.vue
// 核心依赖
import { Graph } from '@antv/g6'
import { DATA_TABLES, getTableById } from '@/data'
```

**数据流**：`DATA_TABLES` → `{ nodes, edges }` → G6 `Graph.render()`

```typescript
// 节点转换
const nodes = DATA_TABLES.map(t => ({
  id: t.id,
  data: { label: t.cnName, tableName: t.name, level: t.level },
  style: {
    stroke: levelColor(t.level),  // ★ 直接使用色值，不用 var(--xxx)
    lineWidth: 2,
    size: [150, 56],
    radius: 6,
  },
}))

// 边转换 (下游关系 → 有向边)
DATA_TABLES.forEach(t => {
  t.downstream.forEach(d => edges.push({ source: t.id, target: d }))
})
```

### 依赖配置

```typescript
new Graph({
  container: HTMLElement,
  data: { nodes, edges },
  layout: { type: 'dagre', rankdir: 'LR', nodesep: 30, ranksep: 160 },
  node: { type: 'rect' },
  edge: { type: 'polyline', style: { endArrow: true } },
  behaviors: ['drag-canvas', 'zoom-canvas'],
  autoFit: 'view',
})
```

### 交互事件

```typescript
graph.on('node:click', (evt) => {
  const id = evt.target?.id      // 对应 DataTable.id
  // 更新右侧详情面板 → selectedId.value = id
})
```

### 样式注意事项

- G6 基于 Canvas，同样**不能使用 CSS 变量**
- 节点边框颜色必须传入实际色值（`#ef4444` 等）
- 节点点击事件通过 `evt.target.id` 获取表 ID，再由 `getTableById()` 查找详情

---

## Mock 数据入口说明

### 数据文件

所有模拟数据位于 **`src/data/index.ts`**，无需后端，直接导入使用。

### 核心导出

```typescript
// 原始数据
export const DATA_TABLES: DataTable[]       // 10 张数据表，含完整字段
export function getTableById(id: string)     // 按 ID 查找单张表

// 聚合数据 (预计算，各页面直接使用)
export const OVERVIEW_STATS                 // 全局统计指标
export const CATEGORY_DISTRIBUTION          // 分类分布 (饼图)
export const DOMAIN_LEVEL_DISTRIBUTION      // 业务域 × 等级 (柱状图)
export const TREND_DATA                     // 近 12 月趋势 (折线图)
export const RISK_HEATMAP                   // 风险热力图数据
export const COMPLIANCE_RADAR               // 合规雷达图数据
export const COMPLIANCE_STATUS_STATS        // 合规状态统计 (环形图)
export const HIGH_RISK_TABLES               // 按风险评分降序

// 元数据
export const SENSITIVITY_META               // 4 等级的颜色/标签映射
export const CATEGORY_META                  // 4 分类的颜色映射
export const BUSINESS_DOMAINS               // 6 个业务域列表
```

### 类型定义

| 类型 | 值 |
|------|------|
| `SensitivityLevel` | `"核心" \| "敏感" \| "内部" \| "公开"` |
| `DataCategory` | `"个人信息" \| "财务数据" \| "业务数据" \| "公开数据"` |
| `BusinessDomain` | `"客户中心" \| "交易系统" \| "营销平台" \| "风控合规" \| "人力资源" \| "供应链"` |
| `ComplianceStatus` | `"已合规" \| "待整改" \| "超期整改"` |

### 修改/新增数据表

直接编辑 `DATA_TABLES` 数组，每个元素遵循 `DataTable` 接口：

```typescript
{
  id: "t_xxx",                    // 唯一标识，与上下游引用匹配
  name: "table_name",             // 英文表名
  cnName: "中文表名",
  domain: "客户中心",              // 必须属于 BUSINESS_DOMAINS
  category: "个人信息",            // 必须属于 DataCategory
  level: "核心",                   // 必须属于 SensitivityLevel
  owner: "负责人姓名",
  updatedAt: "2026-07-13",
  fieldCount: 12,
  riskScore: 85,                  // 0-100
  compliance: "待整改",            // 必须属于 ComplianceStatus
  desc: "表描述",
  upstream: ["t_parent"],         // 上游表 ID 数组
  downstream: ["t_child"],        // 下游表 ID 数组
  fields: [                       // 字段数组
    {
      name: "field_name",
      desc: "字段描述",
      type: "VARCHAR(64)",
      category: "个人信息",
      level: "核心",
      regulation: "个人信息保护法",
    },
  ],
}
```

### 修改聚合数据

修改 `DATA_TABLES` 后，以下聚合常量会**自动重新计算**（模块顶层代码，每次热更新重新执行）：
- `OVERVIEW_STATS` — 从 `DATA_TABLES` 动态计算
- `CATEGORY_DISTRIBUTION` / `DOMAIN_LEVEL_DISTRIBUTION` — 动态计算
- `RISK_HEATMAP` — 动态计算
- `COMPLIANCE_STATUS_STATS` / `HIGH_RISK_TABLES` — 动态计算

手动维护的常量：
- `TREND_DATA` — 需手动更新月份和数值
- `COMPLIANCE_RADAR` — 需手动更新各维度评分

### 颜色约定

数据层中的颜色字段统一使用 CSS 变量引用格式：

```typescript
export const SENSITIVITY_META = {
  核心: { color: 'var(--chart-1)', ... },  // 存储 CSS 变量引用
  敏感: { color: 'var(--chart-2)', ... },
  // ...
}
```

- **DOM 渲染**（HTML/CSS）：直接使用 `var(--xxx)`，浏览器自动解析
- **Canvas 渲染**（ECharts/G6）：通过 `cssVar()` 工具函数转换为实际色值
