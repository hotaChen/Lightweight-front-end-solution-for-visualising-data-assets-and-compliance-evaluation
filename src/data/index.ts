// 数据资产分类分级与合规风险管理平台 - 模拟数据层
// 无需后端，所有数据为演示用静态数据

// 敏感等级定义
export type SensitivityLevel = "核心" | "敏感" | "内部" | "公开"

export const SENSITIVITY_META: Record<
  SensitivityLevel,
  { label: string; color: string; chartVar: string; order: number }
> = {
  核心: { label: "核心数据", color: "var(--chart-1)", chartVar: "var(--chart-1)", order: 0 },
  敏感: { label: "敏感数据", color: "var(--chart-2)", chartVar: "var(--chart-2)", order: 1 },
  内部: { label: "内部数据", color: "var(--chart-3)", chartVar: "var(--chart-3)", order: 2 },
  公开: { label: "公开数据", color: "var(--chart-4)", chartVar: "var(--chart-4)", order: 3 },
}

// 数据分类
export type DataCategory = "个人信息" | "财务数据" | "业务数据" | "公开数据"

export const CATEGORY_META: Record<DataCategory, { color: string }> = {
  个人信息: { color: "var(--chart-1)" },
  财务数据: { color: "var(--chart-2)" },
  业务数据: { color: "var(--chart-4)" },
  公开数据: { color: "var(--chart-3)" },
}

// 业务域
export const BUSINESS_DOMAINS = ["客户中心", "交易系统", "营销平台", "风控合规", "人力资源", "供应链"] as const
export type BusinessDomain = (typeof BUSINESS_DOMAINS)[number]

// 合规状态
export type ComplianceStatus = "已合规" | "待整改" | "超期整改"

// 字段定义
export interface FieldInfo {
  name: string
  desc: string
  type: string
  category: DataCategory
  level: SensitivityLevel
  regulation: string
}

// 数据表定义
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
  riskScore: number // 0-100
  compliance: ComplianceStatus
  desc: string
  fields: FieldInfo[]
  upstream: string[] // 上游表 id
  downstream: string[] // 下游表 id
}

// 核心数据表集合
export const DATA_TABLES: DataTable[] = [
  {
    id: "t_user_account",
    name: "user_account",
    cnName: "用户账户表",
    domain: "客户中心",
    category: "个人信息",
    level: "核心",
    owner: "张敏",
    updatedAt: "2026-06-05",
    fieldCount: 18,
    riskScore: 92,
    compliance: "待整改",
    desc: "存储用户注册账户的核心身份信息，是所有客户相关数据的源头表。",
    upstream: [],
    downstream: ["t_order", "t_user_profile", "t_marketing_audience"],
    fields: [
      { name: "user_id", desc: "用户唯一标识", type: "BIGINT", category: "个人信息", level: "内部", regulation: "GB/T 35273" },
      { name: "real_name", desc: "真实姓名", type: "VARCHAR(64)", category: "个人信息", level: "核心", regulation: "个人信息保护法" },
      { name: "id_card_no", desc: "身份证号码", type: "VARCHAR(18)", category: "个人信息", level: "核心", regulation: "个人信息保护法" },
      { name: "phone", desc: "手机号码", type: "VARCHAR(11)", category: "个人信息", level: "敏感", regulation: "个人信息保护法" },
      { name: "email", desc: "电子邮箱", type: "VARCHAR(128)", category: "个人信息", level: "敏感", regulation: "GB/T 35273" },
      { name: "password_hash", desc: "密码散列值", type: "VARCHAR(256)", category: "个人信息", level: "核心", regulation: "网络安全法" },
      { name: "register_time", desc: "注册时间", type: "DATETIME", category: "业务数据", level: "内部", regulation: "—" },
      { name: "status", desc: "账户状态", type: "TINYINT", category: "业务数据", level: "公开", regulation: "—" },
    ],
  },
  {
    id: "t_order",
    name: "order_main",
    cnName: "订单主表",
    domain: "交易系统",
    category: "财务数据",
    level: "核心",
    owner: "李伟",
    updatedAt: "2026-06-07",
    fieldCount: 24,
    riskScore: 88,
    compliance: "待整改",
    desc: "记录所有交易订单的核心信息，关联用户与支付数据。",
    upstream: ["t_user_account"],
    downstream: ["t_payment", "t_finance_report"],
    fields: [
      { name: "order_id", desc: "订单编号", type: "VARCHAR(32)", category: "业务数据", level: "内部", regulation: "—" },
      { name: "user_id", desc: "下单用户ID", type: "BIGINT", category: "个人信息", level: "内部", regulation: "GB/T 35273" },
      { name: "amount", desc: "订单金额", type: "DECIMAL(12,2)", category: "财务数据", level: "敏感", regulation: "会计法" },
      { name: "pay_account", desc: "支付账户", type: "VARCHAR(64)", category: "财务数据", level: "核心", regulation: "个人金融信息保护" },
      { name: "address", desc: "收货地址", type: "VARCHAR(256)", category: "个人信息", level: "敏感", regulation: "个人信息保护法" },
      { name: "create_time", desc: "创建时间", type: "DATETIME", category: "业务数据", level: "内部", regulation: "—" },
    ],
  },
  {
    id: "t_payment",
    name: "payment_record",
    cnName: "支付流水表",
    domain: "交易系统",
    category: "财务数据",
    level: "核心",
    owner: "李伟",
    updatedAt: "2026-06-07",
    fieldCount: 20,
    riskScore: 95,
    compliance: "超期整改",
    desc: "支付交易流水记录，包含银行卡及金融账户敏感信息。",
    upstream: ["t_order"],
    downstream: ["t_finance_report"],
    fields: [
      { name: "pay_id", desc: "支付流水号", type: "VARCHAR(32)", category: "业务数据", level: "内部", regulation: "—" },
      { name: "bank_card", desc: "银行卡号", type: "VARCHAR(19)", category: "财务数据", level: "核心", regulation: "个人金融信息保护" },
      { name: "amount", desc: "支付金额", type: "DECIMAL(12,2)", category: "财务数据", level: "敏感", regulation: "会计法" },
      { name: "channel", desc: "支付渠道", type: "VARCHAR(32)", category: "业务数据", level: "内部", regulation: "—" },
      { name: "status", desc: "支付状态", type: "TINYINT", category: "业务数据", level: "公开", regulation: "—" },
    ],
  },
  {
    id: "t_user_profile",
    name: "user_profile",
    cnName: "用户画像表",
    domain: "营销平台",
    category: "个人信息",
    level: "敏感",
    owner: "王芳",
    updatedAt: "2026-06-04",
    fieldCount: 32,
    riskScore: 74,
    compliance: "待整改",
    desc: "基于用户行为构建的画像标签数据，用于精准营销。",
    upstream: ["t_user_account"],
    downstream: ["t_marketing_audience"],
    fields: [
      { name: "user_id", desc: "用户ID", type: "BIGINT", category: "个人信息", level: "内部", regulation: "GB/T 35273" },
      { name: "age_range", desc: "年龄段", type: "VARCHAR(16)", category: "个人信息", level: "敏感", regulation: "个人信息保护法" },
      { name: "consume_level", desc: "消费等级", type: "VARCHAR(16)", category: "业务数据", level: "内部", regulation: "—" },
      { name: "interest_tags", desc: "兴趣标签", type: "JSON", category: "个人信息", level: "敏感", regulation: "个人信息保护法" },
      { name: "location", desc: "常驻地", type: "VARCHAR(64)", category: "个人信息", level: "敏感", regulation: "个人信息保护法" },
    ],
  },
  {
    id: "t_marketing_audience",
    name: "marketing_audience",
    cnName: "营销人群包",
    domain: "营销平台",
    category: "业务数据",
    level: "内部",
    owner: "王芳",
    updatedAt: "2026-06-02",
    fieldCount: 12,
    riskScore: 45,
    compliance: "已合规",
    desc: "营销活动圈选的目标人群集合，用于广告投放。",
    upstream: ["t_user_account", "t_user_profile"],
    downstream: [],
    fields: [
      { name: "audience_id", desc: "人群包ID", type: "VARCHAR(32)", category: "业务数据", level: "内部", regulation: "—" },
      { name: "user_id", desc: "用户ID", type: "BIGINT", category: "个人信息", level: "内部", regulation: "GB/T 35273" },
      { name: "campaign", desc: "关联活动", type: "VARCHAR(64)", category: "业务数据", level: "公开", regulation: "—" },
    ],
  },
  {
    id: "t_finance_report",
    name: "finance_report",
    cnName: "财务报表",
    domain: "风控合规",
    category: "财务数据",
    level: "敏感",
    owner: "陈强",
    updatedAt: "2026-06-06",
    fieldCount: 16,
    riskScore: 68,
    compliance: "已合规",
    desc: "汇总财务数据形成的报表，供管理层决策使用。",
    upstream: ["t_order", "t_payment"],
    downstream: [],
    fields: [
      { name: "report_id", desc: "报表ID", type: "VARCHAR(32)", category: "业务数据", level: "内部", regulation: "—" },
      { name: "total_revenue", desc: "总营收", type: "DECIMAL(16,2)", category: "财务数据", level: "敏感", regulation: "会计法" },
      { name: "period", desc: "统计周期", type: "VARCHAR(16)", category: "业务数据", level: "公开", regulation: "—" },
    ],
  },
  {
    id: "t_employee",
    name: "employee_info",
    cnName: "员工信息表",
    domain: "人力资源",
    category: "个人信息",
    level: "敏感",
    owner: "刘洋",
    updatedAt: "2026-05-30",
    fieldCount: 22,
    riskScore: 71,
    compliance: "待整改",
    desc: "公司员工的人事档案信息，含薪酬等敏感字段。",
    upstream: [],
    downstream: [],
    fields: [
      { name: "emp_id", desc: "员工编号", type: "VARCHAR(16)", category: "业务数据", level: "内部", regulation: "—" },
      { name: "name", desc: "姓名", type: "VARCHAR(64)", category: "个人信息", level: "敏感", regulation: "个人信息保护法" },
      { name: "salary", desc: "月薪", type: "DECIMAL(10,2)", category: "财务数据", level: "核心", regulation: "劳动法" },
      { name: "bank_account", desc: "工资卡号", type: "VARCHAR(19)", category: "财务数据", level: "核心", regulation: "个人金融信息保护" },
    ],
  },
  {
    id: "t_product",
    name: "product_catalog",
    cnName: "商品目录表",
    domain: "供应链",
    category: "公开数据",
    level: "公开",
    owner: "赵磊",
    updatedAt: "2026-06-01",
    fieldCount: 15,
    riskScore: 22,
    compliance: "已合规",
    desc: "对外公开的商品基础信息目录。",
    upstream: [],
    downstream: ["t_order"],
    fields: [
      { name: "product_id", desc: "商品ID", type: "VARCHAR(32)", category: "公开数据", level: "公开", regulation: "—" },
      { name: "title", desc: "商品标题", type: "VARCHAR(128)", category: "公开数据", level: "公开", regulation: "—" },
      { name: "price", desc: "标价", type: "DECIMAL(10,2)", category: "公开数据", level: "公开", regulation: "—" },
    ],
  },
  {
    id: "t_supplier",
    name: "supplier_info",
    cnName: "供应商信息表",
    domain: "供应链",
    category: "业务数据",
    level: "内部",
    owner: "赵磊",
    updatedAt: "2026-05-28",
    fieldCount: 14,
    riskScore: 38,
    compliance: "已合规",
    desc: "合作供应商的资质与联系信息。",
    upstream: [],
    downstream: ["t_product"],
    fields: [
      { name: "supplier_id", desc: "供应商ID", type: "VARCHAR(32)", category: "业务数据", level: "内部", regulation: "—" },
      { name: "company_name", desc: "企业名称", type: "VARCHAR(128)", category: "业务数据", level: "内部", regulation: "—" },
      { name: "contact_phone", desc: "联系电话", type: "VARCHAR(20)", category: "个人信息", level: "敏感", regulation: "个人信息保护法" },
    ],
  },
  {
    id: "t_risk_log",
    name: "risk_event_log",
    cnName: "风控事件日志",
    domain: "风控合规",
    category: "业务数据",
    level: "敏感",
    owner: "陈强",
    updatedAt: "2026-06-08",
    fieldCount: 19,
    riskScore: 63,
    compliance: "已合规",
    desc: "风控系统产生的风险事件记录与处置日志。",
    upstream: ["t_user_account", "t_payment"],
    downstream: [],
    fields: [
      { name: "event_id", desc: "事件ID", type: "VARCHAR(32)", category: "业务数据", level: "内部", regulation: "—" },
      { name: "user_id", desc: "关联用户", type: "BIGINT", category: "个人信息", level: "内部", regulation: "GB/T 35273" },
      { name: "risk_type", desc: "风险类型", type: "VARCHAR(32)", category: "业务数据", level: "敏感", regulation: "—" },
    ],
  },
]

export function getTableById(id: string) {
  return DATA_TABLES.find((t) => t.id === id)
}

// ============ 总览页统计 ============
export const OVERVIEW_STATS = {
  totalTables: DATA_TABLES.length,
  totalFields: DATA_TABLES.reduce((s, t) => s + t.fieldCount, 0),
  highSensitiveRatio: Math.round(
    (DATA_TABLES.filter((t) => t.level === "核心" || t.level === "敏感").length / DATA_TABLES.length) * 100,
  ),
  newLast30Days: 27,
  domains: BUSINESS_DOMAINS.length,
}

// 分类分布（饼图）
export const CATEGORY_DISTRIBUTION = (Object.keys(CATEGORY_META) as DataCategory[]).map((cat) => ({
  name: cat,
  value: DATA_TABLES.filter((t) => t.category === cat).length,
  fill: CATEGORY_META[cat].color,
}))

// 敏感等级 × 业务域（堆叠柱状图）
export const DOMAIN_LEVEL_DISTRIBUTION = BUSINESS_DOMAINS.map((domain) => {
  const tablesInDomain = DATA_TABLES.filter((t) => t.domain === domain)
  return {
    domain,
    核心: tablesInDomain.filter((t) => t.level === "核心").length,
    敏感: tablesInDomain.filter((t) => t.level === "敏感").length,
    内部: tablesInDomain.filter((t) => t.level === "内部").length,
    公开: tablesInDomain.filter((t) => t.level === "公开").length,
  }
})

// 近12个月趋势（折线图）
export const TREND_DATA = [
  { month: "7月", 新增: 12, 变更: 8 },
  { month: "8月", 新增: 18, 变更: 11 },
  { month: "9月", 新增: 15, 变更: 14 },
  { month: "10月", 新增: 22, 变更: 9 },
  { month: "11月", 新增: 19, 变更: 16 },
  { month: "12月", 新增: 25, 变更: 12 },
  { month: "1月", 新增: 21, 变更: 18 },
  { month: "2月", 新增: 17, 变更: 13 },
  { month: "3月", 新增: 28, 变更: 20 },
  { month: "4月", 新增: 24, 变更: 15 },
  { month: "5月", 新增: 31, 变更: 22 },
  { month: "6月", 新增: 27, 变更: 19 },
]

// ============ 合规风险看板 ============
// 风险热力图：业务域 × 敏感等级
export const RISK_HEATMAP = BUSINESS_DOMAINS.map((domain) => {
  const row: Record<string, number> = {}
  ;(["核心", "敏感", "内部", "公开"] as SensitivityLevel[]).forEach((level) => {
    row[level] = DATA_TABLES.filter((t) => t.domain === domain && t.level === level).reduce(
      (s, t) => s + Math.round(t.riskScore / 10),
      0,
    )
  })
  return { domain, ...row }
})

// 合规评分雷达图
export const COMPLIANCE_RADAR = [
  { dimension: "个人信息保护", score: 78 },
  { dimension: "财务合规", score: 65 },
  { dimension: "内部数据安全", score: 84 },
  { dimension: "数据流转管控", score: 72 },
  { dimension: "访问权限管理", score: 88 },
  { dimension: "审计留痕", score: 80 },
]

// 合规状态统计
export const COMPLIANCE_STATUS_STATS: { status: ComplianceStatus; count: number; color: string }[] = [
  { status: "已合规", count: DATA_TABLES.filter((t) => t.compliance === "已合规").length, color: "var(--chart-4)" },
  { status: "待整改", count: DATA_TABLES.filter((t) => t.compliance === "待整改").length, color: "var(--chart-2)" },
  { status: "超期整改", count: DATA_TABLES.filter((t) => t.compliance === "超期整改").length, color: "var(--chart-1)" },
]

// 高风险数据表（按风险分排序）
export const HIGH_RISK_TABLES = [...DATA_TABLES].sort((a, b) => b.riskScore - a.riskScore)
