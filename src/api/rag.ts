const configuredRagBaseUrl = import.meta.env.VITE_RAG_API_BASE_URL?.trim()
const RAG_API_BASE_URL = (configuredRagBaseUrl || '/rag-api').replace(/\/$/, '')

export type ClassificationLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'UNKNOWN'
export type RunStatus = 'RUNNING' | 'SUCCESS' | 'PARTIAL_FAILED' | 'FAILED'

export interface FieldProfile {
  schema_version?: '1.0'
  source_system?: string
  database_name?: string
  table_name?: string
  table_comment?: string | null
  field_name: string
  field_cn?: string | null
  field_comment?: string | null
  data_type?: string
  is_nullable?: boolean
  column_key?: string | null
  sample_values?: string[]
  business_domain?: string
}

export interface Evidence {
  content: string
  source: string
  article?: string | null
  score?: number | null
  chunk_id?: string | null
}

export interface ClassificationResult {
  field_name: string
  is_personal?: boolean | null
  category: string
  subcategory?: string | null
  level: ClassificationLevel
  confidence: number
  reason: string
  evidence: Evidence[]
  need_review: boolean
  decision_path: string
}

export interface ClassifyResponse {
  code: number
  message: string
  data?: ClassificationResult | null
}

export interface PipelineRequest {
  sample_limit?: number
  table_names?: string[] | null
  continue_on_error?: boolean
}

export interface PipelineSummary {
  run_id: string
  source_database: string
  total_fields: number
  success_fields: number
  review_fields: number
  failed_fields: number
  status: RunStatus
  started_at: string
  finished_at?: string | null
}

export interface RunDetail extends PipelineSummary {
  source_system: string
  model_name: string
  knowledge_base_version: string
  error_message?: string | null
}

export interface ClassificationResultRow {
  result_id: number
  run_id: string
  field_id: string
  source_system: string
  database_name: string
  table_name: string
  column_name: string
  business_domain: string
  category: string
  subcategory?: string | null
  is_personal?: boolean | null
  level: Exclude<ClassificationLevel, 'UNKNOWN'>
  confidence: number
  reason: string
  need_review: boolean
  decision_path: string
  created_at: string
}

export interface ClassificationEvidenceRow {
  evidence_id: number
  result_id: number
  rank_no: number
  document_name: string
  article?: string | null
  content: string
  relevance_score?: number | null
  chunk_id?: string | null
}

export interface SourceTableMetadata {
  database_name: string
  table_name: string
  table_comment?: string | null
  column_count: number
}

export interface ResultFilters {
  run_id?: string
  database_name?: string
  table_name?: string
  column_name?: string
  level?: Exclude<ClassificationLevel, 'UNKNOWN'>
  category?: string
  need_review?: boolean
  is_personal?: boolean
  limit?: number
  offset?: number
}

export class RagApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'RagApiError'
    this.status = status
  }
}

export function getRagHealth(signal?: AbortSignal) {
  return ragRequest<{ status: string }>('/health', { signal })
}

export function classifyField(profile: FieldProfile, signal?: AbortSignal) {
  return ragRequest<ClassifyResponse>('/classify', { method: 'POST', body: profile, signal })
}

export function runPipeline(payload: PipelineRequest, signal?: AbortSignal) {
  return ragRequest<PipelineSummary>('/pipeline/run', { method: 'POST', body: payload, signal })
}

export function getRun(runId: string, signal?: AbortSignal) {
  return ragRequest<RunDetail>(`/runs/${encodeURIComponent(runId)}`, { signal })
}

export function getResults(filters: ResultFilters, signal?: AbortSignal) {
  return ragRequest<ClassificationResultRow[]>(`/results${toQuery(filters)}`, { signal })
}

export function getResultEvidence(resultId: number, signal?: AbortSignal) {
  return ragRequest<ClassificationEvidenceRow[]>(`/results/${resultId}/evidence`, { signal })
}

export function getSourceTables(signal?: AbortSignal) {
  return ragRequest<SourceTableMetadata[]>('/source/tables', { signal })
}

function toQuery(params: object) {
  const search = new URLSearchParams()
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
}

async function ragRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${RAG_API_BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers: options.body === undefined
        ? { Accept: 'application/json' }
        : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new RagApiError('无法连接 RAG 服务，请确认后端已启动并检查代理配置')
  }

  const payload = await readPayload(response)
  if (!response.ok) throw new RagApiError(errorMessage(payload, response.status), response.status)
  return payload as T
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    if (!response.ok) return text
    throw new RagApiError('RAG 服务返回的内容不是有效 JSON', response.status)
  }
}

function errorMessage(payload: unknown, status: number) {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (payload && typeof payload === 'object') {
    const detail = (payload as { detail?: unknown }).detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map(item => {
        if (!item || typeof item !== 'object') return '参数格式不正确'
        const issue = item as { loc?: unknown[]; msg?: string }
        const location = Array.isArray(issue.loc) ? issue.loc.slice(1).join('.') : ''
        return `${location ? `${location}：` : ''}${issue.msg || '参数格式不正确'}`
      }).join('；')
    }
    const message = (payload as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return `RAG 服务返回异常（HTTP ${status}）`
}
