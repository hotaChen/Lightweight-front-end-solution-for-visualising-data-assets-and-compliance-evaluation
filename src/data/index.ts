import { reactive } from 'vue'
import { fetchPlatformSnapshot } from '@/api/platform'
import type {
  BusinessDomain,
  ComplianceStatus,
  DataCategory,
  DataTable,
  PlatformSnapshot,
  RadarScore,
  SensitivityLevel,
  TrendPoint,
} from '@/data/types'

export type {
  BusinessDomain,
  ComplianceStatus,
  DataCategory,
  DataTable,
  FieldInfo,
  PlatformSnapshot,
  RadarScore,
  SensitivityLevel,
  TrendPoint,
} from '@/data/types'

export const SENSITIVITY_META: Record<SensitivityLevel, { label: string; color: string; chartVar: string; order: number }> = {
  核心: { label: '核心数据', color: 'var(--chart-1)', chartVar: 'var(--chart-1)', order: 0 },
  敏感: { label: '敏感数据', color: 'var(--chart-2)', chartVar: 'var(--chart-2)', order: 1 },
  内部: { label: '内部数据', color: 'var(--chart-3)', chartVar: 'var(--chart-3)', order: 2 },
  公开: { label: '公开数据', color: 'var(--chart-4)', chartVar: 'var(--chart-4)', order: 3 },
}

export const CATEGORY_META: Record<DataCategory, { color: string }> = {
  个人信息: { color: 'var(--chart-1)' },
  财务数据: { color: 'var(--chart-2)' },
  业务数据: { color: 'var(--chart-4)' },
  公开数据: { color: 'var(--chart-3)' },
}

export const DATA_TABLES = reactive<DataTable[]>([])
export const BUSINESS_DOMAINS = reactive<BusinessDomain[]>([])
export const TREND_DATA = reactive<TrendPoint[]>([])
export const COMPLIANCE_RADAR = reactive<RadarScore[]>([])
export const HIGH_RISK_TABLES = reactive<DataTable[]>([])
export const CATEGORY_DISTRIBUTION = reactive<{ name: DataCategory; value: number; fill: string }[]>([])
export const DOMAIN_LEVEL_DISTRIBUTION = reactive<Array<Record<string, string | number>>>([])
export const RISK_HEATMAP = reactive<Array<Record<string, string | number>>>([])
export const COMPLIANCE_STATUS_STATS = reactive<{ status: ComplianceStatus; count: number; color: string }[]>([])
export const OVERVIEW_STATS = reactive({ totalTables: 0, totalFields: 0, highSensitiveRatio: 0, newLast30Days: 0, domains: 0 })
export const RISK_SUMMARY = reactive({ overallScore: 0 })
export const dataLoadState = reactive({ loading: true, error: '' })

let activeRequest: Promise<void> | null = null

export function getTableById(id: string) {
  return DATA_TABLES.find(table => table.id === id)
}

export function loadPlatformData(force = false): Promise<void> {
  if (activeRequest && !force) return activeRequest
  dataLoadState.loading = true
  dataLoadState.error = ''
  activeRequest = fetchPlatformSnapshot()
    .then(hydrateStore)
    .catch(error => {
      dataLoadState.error = error instanceof Error ? error.message : '加载平台数据失败'
    })
    .finally(() => {
      dataLoadState.loading = false
      activeRequest = null
    })
  return activeRequest
}

function hydrateStore(snapshot: PlatformSnapshot) {
  replaceArray(DATA_TABLES, snapshot.tables)
  replaceArray(BUSINESS_DOMAINS, [...new Set(snapshot.tables.map(table => table.domain))])
  replaceArray(TREND_DATA, snapshot.overview.trend)
  replaceArray(COMPLIANCE_RADAR, snapshot.risk.radar)
  replaceArray(HIGH_RISK_TABLES, [...snapshot.tables].sort((a, b) => b.riskScore - a.riskScore))
  RISK_SUMMARY.overallScore = snapshot.risk.overallScore

  OVERVIEW_STATS.totalTables = snapshot.tables.length
  OVERVIEW_STATS.totalFields = snapshot.tables.reduce((sum, table) => sum + table.fieldCount, 0)
  OVERVIEW_STATS.highSensitiveRatio = snapshot.tables.length
    ? Math.round(snapshot.tables.filter(table => table.level === '核心' || table.level === '敏感').length / snapshot.tables.length * 100)
    : 0
  OVERVIEW_STATS.newLast30Days = snapshot.overview.newLast30Days
  OVERVIEW_STATS.domains = BUSINESS_DOMAINS.length

  replaceArray(CATEGORY_DISTRIBUTION, (Object.keys(CATEGORY_META) as DataCategory[]).map(category => ({
    name: category,
    value: snapshot.tables.filter(table => table.category === category).length,
    fill: CATEGORY_META[category].color,
  })))
  replaceArray(DOMAIN_LEVEL_DISTRIBUTION, BUSINESS_DOMAINS.map(domain => {
    const tables = snapshot.tables.filter(table => table.domain === domain)
    return {
      domain,
      核心: tables.filter(table => table.level === '核心').length,
      敏感: tables.filter(table => table.level === '敏感').length,
      内部: tables.filter(table => table.level === '内部').length,
      公开: tables.filter(table => table.level === '公开').length,
    }
  }))
  replaceArray(RISK_HEATMAP, BUSINESS_DOMAINS.map(domain => ({
    domain,
    核心: snapshot.tables.filter(table => table.domain === domain && table.level === '核心').length,
    敏感: snapshot.tables.filter(table => table.domain === domain && table.level === '敏感').length,
    内部: snapshot.tables.filter(table => table.domain === domain && table.level === '内部').length,
    公开: snapshot.tables.filter(table => table.domain === domain && table.level === '公开').length,
  })))
  replaceArray(COMPLIANCE_STATUS_STATS, [
    { status: '已合规', count: snapshot.tables.filter(table => table.compliance === '已合规').length, color: 'var(--chart-4)' },
    { status: '待整改', count: snapshot.tables.filter(table => table.compliance === '待整改').length, color: 'var(--chart-2)' },
    { status: '超期整改', count: snapshot.tables.filter(table => table.compliance === '超期整改').length, color: 'var(--chart-1)' },
  ])
}

function replaceArray<T>(target: T[], values: T[]) {
  target.splice(0, target.length, ...values)
}
