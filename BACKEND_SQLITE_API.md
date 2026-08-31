# SQLite 后端 API 说明

本文档说明项目中 Node.js + SQLite 后端的代码位置、数据库结构、API 接口、前端调用链和启动方式。

## 1. 后端概览

项目后端位于 `server/` 目录，使用 Node.js 内置 HTTP 模块创建 API 服务，并通过系统中的 `sqlite3` 命令行工具访问 SQLite 数据库。

后端对外提供一个主要接口：

```text
GET /api/platform
```

该接口从 SQLite 查询数据资产、字段、血缘关系、趋势和风险评分，并组装成前端页面需要的平台数据快照。

## 2. 后端文件位置

项目目录：

```text
Lightweight-front-end-solution-for-visualising-data-assets-and-compliance-evaluation/
```

核心文件如下：

| 文件 | 说明 |
|------|------|
| `server/index.mjs` | Node.js HTTP API 入口，处理请求并返回 JSON |
| `server/db.mjs` | SQLite 执行、查询、初始化和数据导入封装 |
| `server/init.mjs` | 手动初始化数据库的脚本 |
| `db/schema.sql` | SQLite 数据表结构和约束定义 |
| `db/platform.sqlite` | 实际的 SQLite 数据库文件，初始化后生成 |
| `mock/platform.json` | 初始化数据库时使用的初始数据 |
| `package.json` | 后端启动和数据库初始化命令 |

## 3. 代码职责

### 3.1 `server/index.mjs`

这是后端 API 服务入口，主要职责包括：

- 创建 Node.js HTTP 服务。
- 监听默认 `8787` 端口。
- 处理 `GET /api/platform` 请求。
- 查询 `assets`、`fields`、`lineage`、`trend_points` 和 `radar_scores` 表。
- 将字段归并到对应资产。
- 根据血缘关系生成 `upstream` 和 `downstream` 数组。
- 计算最近 30 天新增资产数量和风险总评分。
- 返回 JSON 格式响应。

核心代码位置：

```text
server/index.mjs:15    platformSnapshot()
server/index.mjs:47    HTTP 请求处理
server/index.mjs:56    初始化数据库并启动服务
```

### 3.2 `server/db.mjs`

这是 SQLite 数据访问层，主要职责包括：

- 确定数据库文件路径。
- 创建数据库所在目录。
- 调用系统 `sqlite3` 命令执行 SQL。
- 将查询结果以 JSON 形式返回。
- 执行数据库表结构初始化。
- 从 `mock/platform.json` 导入初始数据。

默认数据库路径：

```text
db/platform.sqlite
```

相关代码位置：

```text
server/db.mjs:7     databasePath
server/db.mjs:11    runSql()
server/db.mjs:31    queryRows()
server/db.mjs:46    initializeDatabase()
```

### 3.3 `server/init.mjs`

该文件用于单独初始化数据库：

```bash
npm run db:init
```

初始化过程会：

1. 读取 `db/schema.sql`。
2. 创建数据库表。
3. 检查 `assets` 表中是否已有数据。
4. 如果数据库为空，则导入 `mock/platform.json` 的初始数据。
5. 如果数据库已有数据，则不会重复导入。

## 4. SQLite 数据库结构

数据库表结构定义在：

```text
db/schema.sql
```

### 4.1 `assets`

保存数据资产基本信息：

| 字段 | 说明 |
|------|------|
| `id` | 资产唯一 ID |
| `name` | 英文名称 |
| `cn_name` | 中文名称 |
| `domain` | 业务域 |
| `category` | 数据分类 |
| `level` | 敏感等级 |
| `owner` | 负责人 |
| `updated_at` | 最近更新时间 |
| `risk_score` | 风险评分，范围为 0-100 |
| `compliance` | 合规状态 |
| `risk_issue` | 风险问题 |
| `description` | 资产描述 |

### 4.2 `fields`

保存数据资产字段信息：

| 字段 | 说明 |
|------|------|
| `id` | 自增主键 |
| `asset_id` | 所属资产 ID |
| `name` | 字段名称 |
| `description` | 字段描述 |
| `data_type` | 数据类型 |
| `category` | 数据分类 |
| `level` | 敏感等级 |
| `regulation` | 依据法规 |

`asset_id` 关联 `assets.id`，资产删除时，其字段会级联删除。

### 4.3 `lineage`

保存资产之间的上下游关系：

| 字段 | 说明 |
|------|------|
| `upstream_id` | 上游资产 ID |
| `downstream_id` | 下游资产 ID |

上游和下游资产均关联 `assets.id`，并且不允许资产自身关联自身。

### 4.4 `trend_points`

保存数据资产新增和变更趋势：

| 字段 | 说明 |
|------|------|
| `month` | 月份 |
| `added` | 新增数量 |
| `changed` | 变更数量 |

### 4.5 `radar_scores`

保存合规风险雷达评分：

| 字段 | 说明 |
|------|------|
| `dimension` | 评分维度 |
| `score` | 评分，范围为 0-100 |

## 5. API 接口

### `GET /api/platform`

返回前端所需的完整平台数据。

请求示例：

```bash
curl http://localhost:8787/api/platform
```

响应结构：

```json
{
  "tables": [
    {
      "id": "t_payment",
      "name": "payment_record",
      "cnName": "支付流水表",
      "domain": "交易系统",
      "category": "财务数据",
      "level": "核心",
      "owner": "李伟",
      "updatedAt": "2026-06-07",
      "fieldCount": 1,
      "riskScore": 95,
      "compliance": "超期整改",
      "riskIssue": "主要风险问题",
      "desc": "资产描述",
      "upstream": [],
      "downstream": [],
      "fields": [
        {
          "name": "bank_card",
          "desc": "银行卡号",
          "type": "VARCHAR(19)",
          "category": "财务数据",
          "level": "核心",
          "regulation": "个人金融信息保护"
        }
      ]
    }
  ],
  "overview": {
    "newLast30Days": 0,
    "trend": [
      {
        "month": "6月",
        "新增": 27,
        "变更": 19
      }
    ]
  },
  "risk": {
    "overallScore": 78,
    "radar": [
      {
        "dimension": "个人信息保护",
        "score": 78
      }
    ]
  }
}
```

接口响应字段说明与完整约定见：

```text
API_CONTRACT.md
```

## 6. 前端调用链

```text
页面组件
  ↓
src/api/platform.ts
  ↓
src/api/client.ts
  ↓
GET /api/platform
  ↓（Vite 开发代理）
http://localhost:8787/api/platform
  ↓
server/index.mjs
  ↓
server/db.mjs
  ↓
db/platform.sqlite
```

前端默认 API 基础地址为 `/api`，配置代码位于：

```text
src/api/client.ts:1
```

开发环境代理配置位于：

```text
vite.config.ts:39
```

## 7. 启动方式

### 7.1 安装依赖

在项目目录下执行：

```bash
npm install
```

同时确认系统已经安装 SQLite 命令行工具，并可以执行：

```bash
sqlite3 --version
```

### 7.2 初始化数据库

```bash
npm run db:init
```

该命令会生成：

```text
db/platform.sqlite
```

实际上，直接启动 API 时也会自动执行初始化逻辑：

```bash
npm run api
```

### 7.3 启动后端

```bash
npm run api
```

默认访问地址：

```text
http://localhost:8787/api/platform
```

### 7.4 启动前端

在另一个终端执行：

```bash
npm run dev
```

默认前端地址：

```text
http://localhost:5173
```

### 7.5 一种典型启动顺序

终端一：

```bash
cd Lightweight-front-end-solution-for-visualising-data-assets-and-compliance-evaluation
npm run api
```

终端二：

```bash
cd Lightweight-front-end-solution-for-visualising-data-assets-and-compliance-evaluation
npm run dev
```

## 8. Mock 模式

如果不启动 SQLite 后端，也可以使用前端 Mock 模式：

```bash
npm run dev:mock
```

此模式由 Vite 直接读取：

```text
mock/platform.json
```

Mock 模式不会访问 `db/platform.sqlite`，适合只查看前端页面或进行界面开发。

## 9. 环境变量配置

### `DATABASE_PATH`

修改 SQLite 数据库文件路径：

```bash
DATABASE_PATH=/path/to/platform.sqlite npm run api
```

默认值为：

```text
db/platform.sqlite
```

### `API_PORT`

修改后端 API 端口：

```bash
API_PORT=9000 npm run api
```

### `CORS_ORIGIN`

当前端和后端部署在不同域名时，可以设置允许访问的前端来源：

```bash
CORS_ORIGIN=https://your-frontend.example.com npm run api
```

### `VITE_API_BASE_URL`

前端连接独立后端时，可以创建 `.env.production.local`：

```env
VITE_API_BASE_URL=https://your-backend.example.com/api
VITE_ENABLE_MOCK_API=false
```

## 10. 修改数据

可以通过 SQLite 命令行查看数据库：

```bash
sqlite3 db/platform.sqlite
```

查看所有表：

```sql
.tables
```

查询资产：

```sql
SELECT * FROM assets;
```

查询字段：

```sql
SELECT * FROM fields;
```

查询血缘关系：

```sql
SELECT * FROM lineage;
```

修改数据库结构时，请同步更新：

```text
db/schema.sql
server/index.mjs
API_CONTRACT.md
```

## 11. 注意事项

- `sqlite3` 必须安装并能够从系统命令行调用。
- `npm run db:init` 不会覆盖已有 `assets` 数据，避免重复导入初始数据。
- 修改 `db/schema.sql` 后，如需重新导入初始数据，应备份数据库后再处理现有数据库文件。
- 生产环境建议通过环境变量配置独立的 `DATABASE_PATH` 和 `CORS_ORIGIN`。
- 前端 Mock 模式和 SQLite API 模式只能选择其一，使用 `npm run dev:mock` 时不需要启动后端。
