# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**轻量级数据资产可视化与合规性评估前端方案** — A purely static frontend system for enterprise data asset visualization and compliance assessment. No backend required: all data comes from local Mock JSON files; the build output (`dist/`) runs by double-clicking `index.html`.

This is a Tongji University innovation training project. The frontend visualizes AI classification results produced by a separate backend project (课题一).

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Vue 3 | 3.4+ |
| Build | Vite | 5.x |
| Router | Vue Router 4 — **Hash mode** (`createWebHashHistory`) | 4.x |
| UI Library | Ant Design Vue | 4.x |
| Charts | Apache ECharts 5 + vue-echarts | 5.x / 6.x |
| Graph / Lineage | AntV G6 | 5.x |
| Mock Data | Static JSON files in `src/mock/` | — |
| Language | JavaScript (ES2022+) | — |

**Why Hash mode**: `base: './'` in `vite.config.js` + Hash router means `dist/index.html` can be opened directly in a browser without a web server.

## Commands

```bash
npm run dev       # Start dev server (Vite hot-reload)
npm run build     # Build to dist/ — double-click dist/index.html to run offline
npm run preview   # Preview the production build locally
npm run lint      # ESLint check
```

> Package manager: prefer **pnpm** (`pnpm install`), npm also works.

## Planned Directory Structure

```
data-asset-viz/          ← project root (to be initialized at M1)
├── src/
│   ├── main.js                     # App entry
│   ├── App.vue                     # Root component (global layout shell)
│   ├── router/index.js             # Vue Router — Hash mode, 5 routes
│   ├── mock/                       # ALL mock data lives here
│   │   ├── overview.json           # F1 stats, charts
│   │   ├── lineage.json            # F2 graph nodes & edges
│   │   ├── risk.json               # F3 heatmap, radar, risk list
│   │   └── tables.json             # F4 table + field details
│   ├── views/                      # Page-level components (one per route)
│   │   ├── Overview.vue            # /overview — data asset summary
│   │   ├── Lineage.vue             # /lineage — G6 lineage graph
│   │   ├── RiskBoard.vue           # /risk    — compliance risk dashboard
│   │   ├── TableDetail.vue         # /table/:id — field detail drilldown
│   │   └── About.vue               # /about   — system description page
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.vue       # Top title bar
│   │   │   └── AppSidebar.vue      # Left nav menu (Ant Design Menu)
│   │   ├── charts/
│   │   │   ├── PieChart.vue        # Category distribution (ECharts)
│   │   │   ├── BarChart.vue        # Level-by-domain stacked bar (ECharts)
│   │   │   ├── LineChart.vue       # 12-month trend (ECharts)
│   │   │   ├── HeatmapChart.vue    # Risk heatmap (ECharts)
│   │   │   ├── RadarChart.vue      # Compliance radar (ECharts)
│   │   │   └── LineageGraph.vue    # G6 directed graph wrapper
│   │   └── common/
│   │       ├── StatCard.vue        # KPI metric card
│   │       └── RiskBadge.vue       # Sensitivity level tag
│   └── styles/
│       ├── variables.css           # CSS custom properties (colors, fonts)
│       └── global.css              # Global resets & shared styles
├── index.html
├── vite.config.js                  # base: './', enables offline open
└── package.json
```

## Architecture & Data Flow

### Mock data → component pattern
```javascript
// In a view component — import JSON directly; swap to real API later
import overviewData from '@/mock/overview.json'

// To migrate to a real API, only this line changes:
// import { getOverviewData } from '@/api/overview'
```

Mock JSON is the **single source of truth** for all displayed values. Never hard-code data values in components — always read from `src/mock/*.json`.

### ECharts integration
```javascript
// Chart components use vue-echarts; option is a computed property
// <v-chart :option="chartOption" autoresize />
// When reactive data changes, chartOption recomputes → chart auto-updates
```

### Cross-component state / inter-chart linking
Use Vue `provide/inject` or a lightweight event bus (`mitt`) for cross-page state (e.g., clicking a pie slice filters the lineage graph via route query params).

### Navigation & linking
- Lineage sidebar → `router.push('/table/' + tableId)` → TableDetail
- Risk list row → `router.push('/table/' + tableId)` → TableDetail
- Breadcrumb in TableDetail reads `route.query.from` to display correct origin label

## Pages & Key Modules

| Route | View | Primary Libraries | Data Source |
|---|---|---|---|
| `/overview` | Overview.vue | ECharts (pie, bar, line), Ant Design Statistic | `mock/overview.json` |
| `/lineage` | Lineage.vue | AntV G6 5.x (Dagre layout), Ant Design Drawer | `mock/lineage.json` + `mock/tables.json` |
| `/risk` | RiskBoard.vue | ECharts (heatmap, radar), Ant Design Table | `mock/risk.json` + `mock/tables.json` |
| `/table/:id` | TableDetail.vue | Ant Design Table, Breadcrumb | `mock/tables.json` |
| `/about` | About.vue | Ant Design Descriptions | static content |

## Visual / Color Conventions

These must be used consistently across all charts and badges:

| Sensitivity Level | Color |
|---|---|
| 核心级 (Core) | `#F5222D` (red) |
| 敏感级 (Sensitive) | `#FA8C16` (orange) |
| 内部级 (Internal) | `#FADB14` (yellow) |
| 公开级 (Public) | `#52C41A` (green) |

| Usage | Color |
|---|---|
| Primary / nav / buttons | `#1677FF` (Ant Design blue) |
| Page background | `#F0F2F5` |
| Sidebar background | `#001529` |
| High-risk row highlight | `#FFF1F0` (core) / `#FFF7E6` (sensitive) |

Data category colors for pie charts: 个人信息 `#5470C6`, 财务数据 `#EE6666`, 业务数据 `#91CC75`, 系统数据 `#FAC858`, 公开数据 `#73C0DE`.

## Mock Data Schema (Contract)

Changes to JSON structure require updating all consuming components. Value-only edits are safe.

```
DataTable  → id, name, domain, level, riskScore, owner, fieldCount, updatedAt, fields[]
Field      → id, name, description, dataType, category, level, regulation, riskScore
LineageNode → id, label, domain, level
LineageEdge → source, target, label?
```

## G6 Notes

- Use AntV G6 **5.x** — API differs significantly from 4.x; do not reference 4.x examples.
- Layout: Dagre hierarchical (top-to-bottom) for lineage DAG.
- Fallback: if G6 5.x proves unstable, degrade to ECharts `graph` series (decision must be made before M3 starts, 2026-07-13).
- Keep Mock node count at 40–50 to meet the ≥30 fps drag performance requirement.

## Key Configuration Snippets

```javascript
// vite.config.js — enables dist/index.html to open without a server
export default { base: './' }

// router/index.js — Hash mode for offline compatibility
import { createWebHashHistory } from 'vue-router'
const router = createRouter({ history: createWebHashHistory(), routes })
// Invalid paths → redirect to /overview via router.beforeEach guard
```

## Project Status & Milestones

| Milestone | Date | Scope |
|---|---|---|
| M0 ✅ | 2026-06-14 | Requirements, tech selection, design docs, prototypes |
| M1 | 2026-06-28 | Vite scaffold, routing, global layout, all Mock JSON files |
| M2 | 2026-07-12 | Overview page (F1) — 4 stat cards + 3 charts |
| M3 | 2026-07-26 | Lineage graph (F2) + Risk board (F3) |
| M4 | 2026-08-09 | Table detail page (F4) + enhancements |
| M5 | 2026-08-17 | Integration, routing guards, performance |
| M6 | 2026-08-23 | Final QA, demo package, report |

Full requirements, acceptance criteria, and task assignments are in `docs/`.
