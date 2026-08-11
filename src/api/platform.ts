import { apiGet, ApiError } from '@/api/client'
import type {
  ComplianceStatus,
  DataCategory,
  DataTable,
  FieldInfo,
  PlatformSnapshot,
  RadarScore,
  SensitivityLevel,
  TrendPoint,
} from '@/data/types'

const LEVELS = new Set<SensitivityLevel>(['核心', '敏感', '内部', '公开'])
const CATEGORIES = new Set<DataCategory>(['个人信息', '财务数据', '业务数据', '公开数据'])
const STATUSES = new Set<ComplianceStatus>(['已合规', '待整改', '超期整改'])

export async function fetchPlatformSnapshot(signal?: AbortSignal): Promise<PlatformSnapshot> {
  return parsePlatformSnapshot(await apiGet<unknown>('/platform', signal))
}

function parsePlatformSnapshot(value: unknown): PlatformSnapshot {
  const root = asRecord(value, '响应根对象')
  const overview = asRecord(root.overview, 'overview')
  const risk = asRecord(root.risk, 'risk')
  const tables = asArray(root.tables, 'tables').map(parseTable)
  const snapshot: PlatformSnapshot = {
    tables,
    overview: {
      newLast30Days: asNumber(overview.newLast30Days, 'overview.newLast30Days'),
      trend: asArray(overview.trend, 'overview.trend').map(parseTrend),
    },
    risk: {
      overallScore: boundedNumber(risk.overallScore, 'risk.overallScore', 0, 100),
      radar: asArray(risk.radar, 'risk.radar').map(parseRadar),
    },
  }
  validateRelations(tables)
  return snapshot
}

function parseTable(value: unknown, index: number): DataTable {
  const path = `tables[${index}]`
  const item = asRecord(value, path)
  const level = enumValue(item.level, `${path}.level`, LEVELS)
  const category = enumValue(item.category, `${path}.category`, CATEGORIES)
  const compliance = enumValue(item.compliance, `${path}.compliance`, STATUSES)
  return {
    id: asString(item.id, `${path}.id`),
    name: asString(item.name, `${path}.name`),
    cnName: asString(item.cnName, `${path}.cnName`),
    domain: asString(item.domain, `${path}.domain`),
    category,
    level,
    owner: asString(item.owner, `${path}.owner`),
    updatedAt: asString(item.updatedAt, `${path}.updatedAt`),
    fieldCount: asNumber(item.fieldCount, `${path}.fieldCount`),
    riskScore: boundedNumber(item.riskScore, `${path}.riskScore`, 0, 100),
    compliance,
    riskIssue: asString(item.riskIssue, `${path}.riskIssue`),
    desc: asString(item.desc, `${path}.desc`),
    upstream: stringArray(item.upstream, `${path}.upstream`),
    downstream: stringArray(item.downstream, `${path}.downstream`),
    fields: asArray(item.fields, `${path}.fields`).map((field, fieldIndex) => parseField(field, `${path}.fields[${fieldIndex}]`)),
  }
}

function parseField(value: unknown, path: string): FieldInfo {
  const item = asRecord(value, path)
  return {
    name: asString(item.name, `${path}.name`),
    desc: asString(item.desc, `${path}.desc`),
    type: asString(item.type, `${path}.type`),
    category: enumValue(item.category, `${path}.category`, CATEGORIES),
    level: enumValue(item.level, `${path}.level`, LEVELS),
    regulation: asString(item.regulation, `${path}.regulation`),
  }
}

function parseTrend(value: unknown, index: number): TrendPoint {
  const path = `overview.trend[${index}]`
  const item = asRecord(value, path)
  return { month: asString(item.month, `${path}.month`), 新增: asNumber(item['新增'], `${path}.新增`), 变更: asNumber(item['变更'], `${path}.变更`) }
}

function parseRadar(value: unknown, index: number): RadarScore {
  const path = `risk.radar[${index}]`
  const item = asRecord(value, path)
  return { dimension: asString(item.dimension, `${path}.dimension`), score: boundedNumber(item.score, `${path}.score`, 0, 100) }
}

function validateRelations(tables: DataTable[]) {
  const ids = new Set<string>()
  tables.forEach(table => {
    if (ids.has(table.id)) throw new ApiError(`接口数据包含重复资产 ID：${table.id}`)
    ids.add(table.id)
  })
  tables.forEach(table => [...table.upstream, ...table.downstream].forEach(id => {
    if (!ids.has(id)) throw new ApiError(`资产 ${table.id} 引用了不存在的血缘节点 ${id}`)
  }))
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path)
  return value as Record<string, unknown>
}
function asArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path)
  return value
}
function asString(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.trim()) fail(path)
  return value
}
function asNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(path)
  return value
}
function boundedNumber(value: unknown, path: string, min: number, max: number): number {
  const number = asNumber(value, path)
  if (number < min || number > max) fail(path)
  return number
}
function enumValue<T extends string>(value: unknown, path: string, values: Set<T>): T {
  const text = asString(value, path) as T
  if (!values.has(text)) fail(path)
  return text
}
function stringArray(value: unknown, path: string): string[] {
  return asArray(value, path).map((item, index) => asString(item, `${path}[${index}]`))
}
function fail(path: string): never {
  throw new ApiError(`接口字段 ${path} 缺失或格式不正确`)
}
