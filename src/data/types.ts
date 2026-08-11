export type SensitivityLevel = '核心' | '敏感' | '内部' | '公开'
export type DataCategory = '个人信息' | '财务数据' | '业务数据' | '公开数据'
export type ComplianceStatus = '已合规' | '待整改' | '超期整改'
export type BusinessDomain = string

export interface FieldInfo {
  name: string
  desc: string
  type: string
  category: DataCategory
  level: SensitivityLevel
  regulation: string
}

export interface DataTable {
  id: string
  name: string
  cnName: string
  domain: BusinessDomain
  category: DataCategory
  level: SensitivityLevel
  owner: string
  updatedAt: string
  fieldCount: number
  riskScore: number
  compliance: ComplianceStatus
  riskIssue: string
  desc: string
  fields: FieldInfo[]
  upstream: string[]
  downstream: string[]
}

export interface TrendPoint {
  month: string
  新增: number
  变更: number
}

export interface RadarScore {
  dimension: string
  score: number
}

export interface PlatformSnapshot {
  tables: DataTable[]
  overview: { newLast30Days: number; trend: TrendPoint[] }
  risk: { overallScore: number; radar: RadarScore[] }
}
