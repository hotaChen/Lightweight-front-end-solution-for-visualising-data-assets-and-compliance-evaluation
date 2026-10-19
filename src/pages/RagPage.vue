<template>
  <AppShell :breadcrumbs="[{ label: 'RAG 智能分类' }]">
    <template #actions>
      <div :class="['health-chip', `health-chip--${healthState}`]">
        <span class="health-dot" />
        {{ healthLabel }}
      </div>
    </template>

    <div class="rag-page">
      <section class="hero-card">
        <div>
          <div class="eyebrow">RAG · 数据分类分级</div>
          <h1>智能识别数据敏感等级</h1>
          <p>结合字段画像、样例数据与冻结知识库，为字段生成分类、分级、判定理由及法规依据。</p>
        </div>
        <div class="hero-meta">
          <div><span>知识库</span><strong>{{ runDetail?.knowledge_base_version || 'b-rebuild-20260917' }}</strong></div>
          <div><span>检索策略</span><strong>Top-3 语义检索</strong></div>
          <div><span>判定路径</span><strong>RAG + 结构化 LLM</strong></div>
        </div>
      </section>

      <nav class="mode-tabs" aria-label="RAG 功能切换">
        <button v-for="item in modes" :key="item.key" :class="['mode-tab', { active: activeMode === item.key }]" type="button" @click="activeMode = item.key">
          <component :is="item.icon" />
          <span><strong>{{ item.title }}</strong><small>{{ item.description }}</small></span>
        </button>
      </nav>

      <section v-if="activeMode === 'single'" class="workspace-grid">
        <form class="panel form-panel" @submit.prevent="submitSingle">
          <div class="panel-heading">
            <div><span class="step">01</span><h2>字段画像</h2></div>
            <span class="panel-note">带 * 为必填项</span>
          </div>

          <div class="form-grid">
            <label class="field"><span>字段名 *</span><input v-model.trim="singleForm.field_name" maxlength="128" placeholder="例如：mobile" /></label>
            <label class="field"><span>字段中文名</span><input v-model.trim="singleForm.field_cn" maxlength="256" placeholder="例如：手机号" /></label>
            <label class="field"><span>数据类型</span><input v-model.trim="singleForm.data_type" maxlength="256" placeholder="例如：varchar(20)" /></label>
            <label class="field"><span>业务域</span><input v-model.trim="singleForm.business_domain" maxlength="256" placeholder="例如：customer" /></label>
            <label class="field"><span>来源系统</span><input v-model.trim="singleForm.source_system" maxlength="256" placeholder="manual" /></label>
            <label class="field"><span>表名</span><input v-model.trim="singleForm.table_name" maxlength="256" placeholder="例如：customer_account" /></label>
            <label class="field field--wide"><span>字段注释</span><textarea v-model.trim="singleForm.field_comment" maxlength="1000" rows="3" placeholder="描述字段的业务含义，信息越完整，分类结果越可靠" /></label>
            <label class="field field--wide"><span>样例值 <small>最多 5 个，每行一个</small></span><textarea v-model="singleForm.sample_values" rows="4" placeholder="138****0000&#10;139****0000" /></label>
          </div>

          <div v-if="singleError" class="alert alert--error">{{ singleError }}</div>
          <div class="form-actions">
            <button class="button button--ghost" type="button" :disabled="singleLoading" @click="resetSingle">重置</button>
            <button class="button button--primary" type="submit" :disabled="singleLoading">
              <span v-if="singleLoading" class="spinner" />
              {{ singleLoading ? '正在检索与判定…' : '开始智能分类' }}
            </button>
          </div>
        </form>

        <div class="panel result-panel">
          <div class="panel-heading">
            <div><span class="step">02</span><h2>分类结果</h2></div>
            <span v-if="singleResult" :class="['level-badge', levelClass(singleResult.level)]">{{ levelText(singleResult.level) }}</span>
          </div>

          <div v-if="singleLoading" class="empty-state">
            <div class="ai-orbit"><span /><span /><span /></div>
            <h3>正在分析字段画像</h3>
            <p>执行语义检索并生成结构化分类结论，请勿重复提交。</p>
          </div>
          <div v-else-if="!singleResult" class="empty-state">
            <div class="empty-icon">RAG</div>
            <h3>等待分类</h3>
            <p>填写左侧字段信息后开始识别，结果将在此处展示。</p>
          </div>
          <template v-else>
            <div v-if="singleResult.level === 'UNKNOWN'" class="alert alert--error">分类处理失败，请根据判定理由检查输入或稍后重试。</div>
            <div v-if="singleResult.need_review" class="alert alert--warning">该结果建议人工复核，当前系统仅支持查看依据。</div>

            <div class="result-summary">
              <div><span>数据类别</span><strong>{{ singleResult.category }}</strong><small>{{ singleResult.subcategory || '未细分子类别' }}</small></div>
              <div><span>个人信息</span><strong>{{ personalText(singleResult.is_personal) }}</strong><small>{{ singleResult.decision_path }}</small></div>
              <div><span>置信度</span><strong>{{ percent(singleResult.confidence) }}</strong><div class="confidence-track"><i :style="{ width: percent(singleResult.confidence) }" /></div></div>
            </div>

            <article class="reason-card"><span>判定理由</span><p>{{ singleResult.reason }}</p></article>

            <div class="evidence-heading"><h3>检索依据</h3><span>{{ singleResult.evidence.length }} 条</span></div>
            <div v-if="singleResult.evidence.length" class="evidence-list">
              <article v-for="(evidence, index) in singleResult.evidence" :key="evidence.chunk_id || index" class="evidence-card">
                <div class="evidence-rank">{{ index + 1 }}</div>
                <div>
                  <div class="evidence-source"><strong>{{ evidence.source }}</strong><span v-if="evidence.score != null">相关度 {{ percent(evidence.score) }}</span></div>
                  <div v-if="evidence.article" class="evidence-article">{{ evidence.article }}</div>
                  <p>{{ evidence.content }}</p>
                  <code v-if="evidence.chunk_id">{{ evidence.chunk_id }}</code>
                </div>
              </article>
            </div>
            <div v-else class="inline-empty">本次分类未返回检索依据</div>
          </template>
        </div>
      </section>

      <section v-else-if="activeMode === 'batch'" class="workspace-grid workspace-grid--batch">
        <form class="panel form-panel" @submit.prevent="submitPipeline">
          <div class="panel-heading"><div><span class="step">01</span><h2>批量任务配置</h2></div><span class="panel-note">同步执行</span></div>

          <div class="field">
            <span>选择数据表</span>
            <div v-if="sourceTablesLoading" class="inline-empty">正在读取 A 库表结构…</div>
            <div v-else class="table-picker">
              <div v-if="sourceTablesError" class="preset-notice">元数据接口暂不可用，当前展示 A 库 E-R 图中的预置业务表。</div>
              <label v-for="table in availableTables" :key="table.table_name" :class="['table-option', { selected: selectedTables.includes(table.table_name) }]">
                <input v-model="selectedTables" type="checkbox" :value="table.table_name" />
                <span><strong>{{ table.table_name }}</strong><small>{{ table.table_comment || table.database_name }}</small></span>
                <em>{{ table.column_count }} 字段</em>
              </label>
              <div class="manual-tables">
                <textarea v-model="manualTables" rows="3" placeholder="也可补充其他表名，每行一个" />
                <small v-if="sourceTablesError">接口错误：{{ sourceTablesError }}</small>
              </div>
            </div>
          </div>

          <div class="form-grid compact-grid">
            <label class="field"><span>字段采样数量</span><select v-model.number="pipelineForm.sample_limit"><option v-for="number in 6" :key="number - 1" :value="number - 1">{{ number - 1 }} 个</option></select></label>
            <label class="switch-field"><input v-model="pipelineForm.continue_on_error" type="checkbox" /><span><strong>失败后继续</strong><small>单个字段失败不终止后续分类</small></span></label>
          </div>

          <div class="alert alert--info">任务提交后将同步扫描、检索和分类。页面等待超时不代表后端任务已终止，请勿重复提交。</div>
          <div v-if="pipelineError" class="alert alert--error">{{ pipelineError }}</div>
          <div class="form-actions">
            <button class="button button--primary" type="submit" :disabled="pipelineLoading">
              <span v-if="pipelineLoading" class="spinner" />
              {{ pipelineLoading ? '任务执行中…' : '启动批量分类' }}
            </button>
          </div>
        </form>

        <div class="panel result-panel">
          <div class="panel-heading"><div><span class="step">02</span><h2>任务状态</h2></div><span v-if="runDetail" :class="['status-badge', statusClass(runDetail.status)]">{{ statusText(runDetail.status) }}</span></div>
          <div v-if="pipelineLoading" class="empty-state"><div class="ai-orbit"><span /><span /><span /></div><h3>正在处理数据库字段</h3><p>后端完成全部字段后将一次性返回汇总结果。</p></div>
          <div v-else-if="!runDetail" class="empty-state"><div class="empty-icon">DB</div><h3>尚未启动任务</h3><p>选择数据表和采样策略后启动批量分类。</p></div>
          <template v-else>
            <div class="run-id-row"><span>任务 ID</span><code>{{ runDetail.run_id }}</code><button type="button" @click="copyRunId">复制</button></div>
            <div class="metric-grid">
              <div><span>扫描字段</span><strong>{{ runDetail.total_fields }}</strong></div>
              <div><span>分类成功</span><strong class="success-text">{{ runDetail.success_fields }}</strong></div>
              <div><span>建议复核</span><strong class="warning-text">{{ runDetail.review_fields }}</strong></div>
              <div><span>处理失败</span><strong class="danger-text">{{ runDetail.failed_fields }}</strong></div>
            </div>
            <dl class="run-details">
              <div><dt>来源数据库</dt><dd>{{ runDetail.source_database }}</dd></div>
              <div><dt>模型</dt><dd>{{ runDetail.model_name }}</dd></div>
              <div><dt>知识库版本</dt><dd>{{ runDetail.knowledge_base_version }}</dd></div>
              <div><dt>开始时间</dt><dd>{{ formatDate(runDetail.started_at) }}</dd></div>
              <div><dt>结束时间</dt><dd>{{ formatDate(runDetail.finished_at) }}</dd></div>
            </dl>
            <div v-if="runDetail.error_message" class="alert alert--error">{{ runDetail.error_message }}</div>
            <button class="button button--primary button--full" type="button" @click="viewRunResults">查看本次分类结果</button>
          </template>
        </div>
      </section>

      <section v-else class="results-workspace">
        <div class="panel filters-panel">
          <div class="panel-heading"><div><span class="step">01</span><h2>任务与筛选</h2></div></div>
          <label class="field"><span>任务 ID</span><div class="input-action"><input v-model.trim="runIdInput" placeholder="输入 UUID 查看指定任务" /><button class="load-button" type="button" :disabled="resultsLoading" @click="applyRunId"><span>加载</span></button></div></label>
          <div class="filter-row">
            <label class="field"><span>敏感等级</span><select v-model="resultFilters.level"><option value="">全部等级</option><option value="L1">L1 · 公开数据</option><option value="L2">L2 · 内部数据</option><option value="L3">L3 · 敏感数据</option><option value="L4">L4 · 核心敏感数据</option></select></label>
            <label class="field"><span>复核状态</span><select v-model="resultFilters.need_review"><option value="">全部结果</option><option value="true">仅待复核</option><option value="false">无需复核</option></select></label>
            <label class="field"><span>个人信息</span><select v-model="resultFilters.is_personal"><option value="">全部结果</option><option value="true">是</option><option value="false">否</option></select></label>
            <button class="button button--outline filter-button" type="button" :disabled="resultsLoading" @click="loadResults(0)">应用筛选</button>
          </div>
          <div v-if="resultsError" class="alert alert--error">{{ resultsError }}</div>
        </div>

        <div v-if="runDetail" class="metric-grid result-metrics">
          <div><span>扫描字段</span><strong>{{ runDetail.total_fields }}</strong></div>
          <div><span>分类成功</span><strong>{{ runDetail.success_fields }}</strong></div>
          <div><span>建议复核</span><strong>{{ runDetail.review_fields }}</strong></div>
          <div><span>处理失败</span><strong>{{ runDetail.failed_fields }}</strong></div>
          <div><span>任务状态</span><strong class="metric-status">{{ statusText(runDetail.status) }}</strong></div>
        </div>

        <div class="panel results-panel">
          <div class="panel-heading"><div><span class="step">02</span><h2>分类结果</h2></div><span class="panel-note">第 {{ resultOffset + 1 }}–{{ resultOffset + results.length }} 条</span></div>
          <div v-if="resultsLoading" class="table-state"><span class="spinner spinner--dark" />正在加载结果…</div>
          <div v-else-if="!results.length" class="empty-state compact"><div class="empty-icon">0</div><h3>暂无匹配结果</h3><p>请输入任务 ID 或调整筛选条件后重试。</p></div>
          <div v-else class="result-table-wrap">
            <table class="result-table">
              <thead><tr><th>字段</th><th>分类</th><th>等级</th><th>个人信息</th><th>置信度</th><th>复核</th><th>分类时间</th><th /></tr></thead>
              <tbody>
                <tr v-for="row in results" :key="row.result_id">
                  <td><strong>{{ row.column_name }}</strong><small>{{ row.database_name }} / {{ row.table_name }}</small></td>
                  <td><strong>{{ row.category }}</strong><small>{{ row.subcategory || row.business_domain }}</small></td>
                  <td><span :class="['level-badge', levelClass(row.level)]">{{ row.level }}</span></td>
                  <td>{{ personalText(row.is_personal) }}</td>
                  <td><div class="score-cell"><span>{{ percent(row.confidence) }}</span><i><b :style="{ width: percent(row.confidence) }" /></i></div></td>
                  <td><span :class="['review-tag', { required: row.need_review }]">{{ row.need_review ? '待复核' : '无需复核' }}</span></td>
                  <td>{{ formatDate(row.created_at) }}</td>
                  <td><button class="text-button" type="button" @click="openEvidence(row)">查看依据</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <button class="button button--outline" type="button" :disabled="resultOffset === 0 || resultsLoading" @click="loadResults(Math.max(0, resultOffset - resultLimit))">上一页</button>
            <span>第 {{ Math.floor(resultOffset / resultLimit) + 1 }} 页</span>
            <button class="button button--outline" type="button" :disabled="results.length < resultLimit || resultsLoading" @click="loadResults(resultOffset + resultLimit)">下一页</button>
          </div>
        </div>
      </section>
    </div>

    <div v-if="selectedResult" class="drawer-layer" @click.self="closeEvidence">
      <aside class="evidence-drawer">
        <header><div><span>分类详情</span><h2>{{ selectedResult.column_name }}</h2><p>{{ selectedResult.database_name }} / {{ selectedResult.table_name }}</p></div><button type="button" aria-label="关闭" @click="closeEvidence">×</button></header>
        <div class="drawer-body">
          <div class="drawer-summary"><span :class="['level-badge', levelClass(selectedResult.level)]">{{ levelText(selectedResult.level) }}</span><strong>{{ selectedResult.category }}<small>{{ selectedResult.subcategory || '未细分' }}</small></strong><strong>{{ percent(selectedResult.confidence) }}<small>分类置信度</small></strong></div>
          <div v-if="selectedResult.need_review" class="alert alert--warning">该结果建议人工复核。</div>
          <article class="reason-card"><span>判定理由</span><p>{{ selectedResult.reason }}</p></article>
          <div class="evidence-heading"><h3>检索依据</h3><span>{{ persistedEvidence.length }} 条</span></div>
          <div v-if="evidenceLoading" class="table-state"><span class="spinner spinner--dark" />正在加载依据…</div>
          <div v-else-if="evidenceError" class="alert alert--error">{{ evidenceError }}</div>
          <div v-else-if="persistedEvidence.length" class="evidence-list">
            <article v-for="evidence in persistedEvidence" :key="evidence.evidence_id" class="evidence-card">
              <div class="evidence-rank">{{ evidence.rank_no }}</div>
              <div><div class="evidence-source"><strong>{{ evidence.document_name }}</strong><span v-if="evidence.relevance_score != null">相关度 {{ percent(evidence.relevance_score) }}</span></div><div v-if="evidence.article" class="evidence-article">{{ evidence.article }}</div><p>{{ evidence.content }}</p><code v-if="evidence.chunk_id">{{ evidence.chunk_id }}</code></div>
            </article>
          </div>
          <div v-else class="inline-empty">该结果没有保存检索依据</div>
        </div>
      </aside>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import {
  classifyField,
  getRagHealth,
  getResultEvidence,
  getResults,
  getRun,
  getSourceTables,
  runPipeline,
  type ClassificationEvidenceRow,
  type ClassificationLevel,
  type ClassificationResult,
  type ClassificationResultRow,
  type RunDetail,
  type RunStatus,
  type SourceTableMetadata,
} from '@/api/rag'

type Mode = 'single' | 'batch' | 'results'
type HealthState = 'checking' | 'online' | 'offline'

const route = useRoute()
const router = useRouter()
const activeMode = ref<Mode>('single')
const healthState = ref<HealthState>('checking')
const singleLoading = ref(false)
const singleError = ref('')
const singleResult = ref<ClassificationResult | null>(null)
const pipelineLoading = ref(false)
const pipelineError = ref('')
const runDetail = ref<RunDetail | null>(null)
const sourceTables = ref<SourceTableMetadata[]>([])
const sourceTablesLoading = ref(true)
const sourceTablesError = ref('')
const selectedTables = ref<string[]>([])
const manualTables = ref('')
const runIdInput = ref('')
const results = ref<ClassificationResultRow[]>([])
const resultsLoading = ref(false)
const resultsError = ref('')
const resultOffset = ref(0)
const resultLimit = 20
const selectedResult = ref<ClassificationResultRow | null>(null)
const persistedEvidence = ref<ClassificationEvidenceRow[]>([])
const evidenceLoading = ref(false)
const evidenceError = ref('')

const singleForm = reactive({ field_name: '', field_cn: '', data_type: 'unknown', business_domain: 'general', source_system: 'manual', table_name: 'manual', field_comment: '', sample_values: '' })
const pipelineForm = reactive({ sample_limit: 3, continue_on_error: true })
const resultFilters = reactive({ level: '', need_review: '', is_personal: '' })

const demoSourceTables: SourceTableMetadata[] = [
  { database_name: 'enterprise_source', table_name: 'employee', table_comment: '员工信息', column_count: 12 },
  { database_name: 'enterprise_source', table_name: 'customer_account', table_comment: '客户账户', column_count: 11 },
  { database_name: 'enterprise_source', table_name: 'customer_order', table_comment: '客户订单', column_count: 10 },
  { database_name: 'enterprise_source', table_name: 'product', table_comment: '商品信息', column_count: 8 },
]

const modes = [
  { key: 'single' as const, title: '单字段分类', description: '即时识别并查看检索依据', icon: () => h('svg', { viewBox: '0 0 24 24', innerHTML: '<path d="M4 4h16v16H4zM8 9h8M8 13h5"/>' }) },
  { key: 'batch' as const, title: '数据库批量分类', description: '扫描 A 库并持久化结果', icon: () => h('svg', { viewBox: '0 0 24 24', innerHTML: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>' }) },
  { key: 'results' as const, title: '任务结果', description: '筛选结果与查看法规依据', icon: () => h('svg', { viewBox: '0 0 24 24', innerHTML: '<path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5"/>' }) },
]

const healthLabel = computed(() => ({ checking: '服务检查中', online: 'RAG 服务在线', offline: 'RAG 服务离线' })[healthState.value])
const availableTables = computed(() => sourceTables.value.length ? sourceTables.value : demoSourceTables)

onMounted(async () => {
  void checkHealth()
  void loadSourceTables()
  const queryRunId = typeof route.query.run_id === 'string' ? route.query.run_id : ''
  if (queryRunId) {
    runIdInput.value = queryRunId
    activeMode.value = 'results'
    await loadRunAndResults(queryRunId)
  }
})

async function checkHealth() {
  try {
    const health = await getRagHealth()
    healthState.value = health.status.toLowerCase() === 'ok' ? 'online' : 'offline'
  } catch {
    healthState.value = 'offline'
  }
}

async function loadSourceTables() {
  sourceTablesLoading.value = true
  sourceTablesError.value = ''
  try {
    sourceTables.value = await getSourceTables()
  } catch (error) {
    sourceTablesError.value = messageOf(error)
  } finally {
    sourceTablesLoading.value = false
  }
}

async function submitSingle() {
  singleError.value = ''
  if (!singleForm.field_name) {
    singleError.value = '请填写字段名'
    return
  }
  const samples = singleForm.sample_values.split(/\r?\n/).map(value => value.trim()).filter(Boolean)
  if (samples.length > 5) {
    singleError.value = '样例值最多填写 5 个'
    return
  }
  singleLoading.value = true
  singleResult.value = null
  try {
    const response = await classifyField({
      field_name: singleForm.field_name,
      field_cn: singleForm.field_cn || null,
      field_comment: singleForm.field_comment || null,
      data_type: singleForm.data_type || 'unknown',
      business_domain: singleForm.business_domain || 'general',
      source_system: singleForm.source_system || 'manual',
      table_name: singleForm.table_name || 'manual',
      database_name: 'manual',
      sample_values: samples,
    })
    if (response.code !== 200 || !response.data) throw new Error(response.message || '分类处理失败')
    singleResult.value = response.data
  } catch (error) {
    singleError.value = messageOf(error)
  } finally {
    singleLoading.value = false
  }
}

function resetSingle() {
  Object.assign(singleForm, { field_name: '', field_cn: '', data_type: 'unknown', business_domain: 'general', source_system: 'manual', table_name: 'manual', field_comment: '', sample_values: '' })
  singleResult.value = null
  singleError.value = ''
}

async function submitPipeline() {
  pipelineError.value = ''
  pipelineLoading.value = true
  runDetail.value = null
  const manualTableNames = manualTables.value.split(/[,\n]/).map(value => value.trim()).filter(Boolean)
  const tableNames = [...new Set([...selectedTables.value, ...manualTableNames])]
  try {
    const summary = await runPipeline({
      sample_limit: pipelineForm.sample_limit,
      continue_on_error: pipelineForm.continue_on_error,
      table_names: tableNames.length ? tableNames : null,
    })
    runIdInput.value = summary.run_id
    await router.replace({ query: { ...route.query, run_id: summary.run_id } })
    try {
      runDetail.value = await getRun(summary.run_id)
    } catch {
      runDetail.value = { ...summary, source_system: 'mysql', model_name: '—', knowledge_base_version: '—' }
    }
  } catch (error) {
    pipelineError.value = messageOf(error)
  } finally {
    pipelineLoading.value = false
  }
}

function viewRunResults() {
  if (!runDetail.value) return
  runIdInput.value = runDetail.value.run_id
  activeMode.value = 'results'
  void loadResults(0)
}

async function applyRunId() {
  if (!runIdInput.value) {
    resultsError.value = '请输入任务 ID'
    return
  }
  await router.replace({ query: { ...route.query, run_id: runIdInput.value } })
  await loadRunAndResults(runIdInput.value)
}

async function loadRunAndResults(runId: string) {
  resultsError.value = ''
  const [detailResult] = await Promise.allSettled([getRun(runId), loadResults(0)])
  if (detailResult.status === 'fulfilled') runDetail.value = detailResult.value
  else if (!resultsError.value) resultsError.value = messageOf(detailResult.reason)
}

async function loadResults(offset: number) {
  resultsLoading.value = true
  resultsError.value = ''
  try {
    results.value = await getResults({
      run_id: runIdInput.value || undefined,
      level: resultFilters.level ? resultFilters.level as 'L1' | 'L2' | 'L3' | 'L4' : undefined,
      need_review: parseOptionalBoolean(resultFilters.need_review),
      is_personal: parseOptionalBoolean(resultFilters.is_personal),
      limit: resultLimit,
      offset,
    })
    resultOffset.value = offset
  } catch (error) {
    results.value = []
    resultsError.value = messageOf(error)
  } finally {
    resultsLoading.value = false
  }
}

async function openEvidence(row: ClassificationResultRow) {
  selectedResult.value = row
  persistedEvidence.value = []
  evidenceError.value = ''
  evidenceLoading.value = true
  try {
    persistedEvidence.value = await getResultEvidence(row.result_id)
  } catch (error) {
    evidenceError.value = messageOf(error)
  } finally {
    evidenceLoading.value = false
  }
}

function closeEvidence() {
  selectedResult.value = null
}

async function copyRunId() {
  if (!runDetail.value) return
  await navigator.clipboard?.writeText(runDetail.value.run_id)
}

function parseOptionalBoolean(value: string) {
  return value === '' ? undefined : value === 'true'
}

function personalText(value?: boolean | null) {
  if (value === true) return '是'
  if (value === false) return '否'
  return '未知'
}

function percent(value?: number | null) {
  return value == null ? '—' : `${Math.round(value * 100)}%`
}

function levelText(level: ClassificationLevel) {
  return ({ L1: 'L1 · 公开数据', L2: 'L2 · 内部数据', L3: 'L3 · 敏感数据', L4: 'L4 · 核心敏感', UNKNOWN: '分类失败' })[level]
}

function levelClass(level: ClassificationLevel) {
  return `level-${level.toLowerCase()}`
}

function statusText(status: RunStatus) {
  return ({ RUNNING: '执行中', SUCCESS: '成功', PARTIAL_FAILED: '部分失败', FAILED: '失败' })[status]
}

function statusClass(status: RunStatus) {
  return `status-${status.toLowerCase().replace('_', '-')}`
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'medium', hour12: false }).format(date)
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : '请求失败，请稍后重试'
}
</script>

<style scoped>
.rag-page { display: flex; flex-direction: column; gap: 1rem; max-width: 1500px; margin: 0 auto; }
.hero-card { position: relative; overflow: hidden; display: flex; justify-content: space-between; gap: 2rem; padding: 1.75rem 2rem; border: 1px solid #bfdbfe; border-radius: 0.75rem; background: linear-gradient(125deg, #eff6ff 0%, #fff 56%, #eef2ff 100%); }
.hero-card::after { content: ''; position: absolute; width: 280px; height: 280px; right: -90px; top: -170px; border-radius: 50%; background: rgba(59,130,246,.09); box-shadow: 0 0 0 35px rgba(99,102,241,.04); }
.eyebrow { margin-bottom: .45rem; color: #2563eb; font-size: .72rem; font-weight: 700; letter-spacing: .12em; }
.hero-card h1 { font-size: 1.65rem; font-weight: 700; letter-spacing: -.02em; }
.hero-card p { max-width: 680px; margin-top: .5rem; color: #64748b; font-size: .875rem; }
.hero-meta { z-index: 1; display: grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); align-self: center; min-width: 480px; border: 1px solid rgba(255,255,255,.8); border-radius: .65rem; background: rgba(255,255,255,.72); box-shadow: 0 8px 28px rgba(30,64,175,.07); backdrop-filter: blur(8px); }
.hero-meta div { display: flex; flex-direction: column; gap: .3rem; padding: .9rem 1rem; border-left: 1px solid #e2e8f0; }
.hero-meta div:first-child { border-left: 0; }.hero-meta span { color: #64748b; font-size: .68rem; }.hero-meta strong { font-size: .75rem; font-weight: 600; }
.health-chip { display: flex; align-items: center; gap: .4rem; padding: .3rem .65rem; border: 1px solid var(--border); border-radius: 999px; background: var(--card); font-size: .72rem; }.health-dot { width: .45rem; height: .45rem; border-radius: 50%; background: #94a3b8; }.health-chip--online .health-dot { background: #22c55e; box-shadow: 0 0 0 3px #dcfce7; }.health-chip--offline .health-dot { background: #ef4444; box-shadow: 0 0 0 3px #fee2e2; }
.mode-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; }.mode-tab { display: flex; align-items: center; gap: .8rem; padding: .9rem 1rem; border: 1px solid var(--border); border-radius: .65rem; background: var(--card); text-align: left; transition: .15s; }.mode-tab:hover { border-color: #93c5fd; }.mode-tab.active { border-color: #3b82f6; background: #eff6ff; box-shadow: inset 0 0 0 1px #3b82f6; }.mode-tab svg { width: 1.25rem; height: 1.25rem; flex: 0 0 auto; fill: none; stroke: #64748b; stroke-width: 1.8; }.mode-tab.active svg { stroke: #2563eb; }.mode-tab span { display: flex; flex-direction: column; }.mode-tab strong { font-size: .82rem; font-weight: 600; }.mode-tab small { color: #64748b; font-size: .68rem; }
.workspace-grid { display: grid; grid-template-columns: minmax(420px, .88fr) minmax(520px, 1.12fr); gap: 1rem; align-items: start; }.workspace-grid--batch { grid-template-columns: minmax(450px, 1fr) minmax(420px, .8fr); }.panel { border: 1px solid var(--border); border-radius: .75rem; background: var(--card); box-shadow: 0 1px 2px rgba(15,23,42,.025); }.form-panel,.result-panel,.filters-panel { padding: 1.25rem; }.panel-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.1rem; }.panel-heading > div { display: flex; align-items: center; gap: .6rem; }.panel-heading h2 { font-size: .95rem; font-weight: 650; }.step { display: grid; place-items: center; width: 1.7rem; height: 1.7rem; border-radius: .45rem; background: #eff6ff; color: #2563eb; font: 700 .66rem var(--font-mono); }.panel-note { color: #64748b; font-size: .68rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .9rem; }.compact-grid { margin-top: 1rem; }.field { display: flex; flex-direction: column; gap: .38rem; min-width: 0; }.field--wide { grid-column: 1 / -1; }.field > span { color: #334155; font-size: .72rem; font-weight: 550; }.field > span small { margin-left: .3rem; color: #94a3b8; font-weight: 400; }.field input,.field textarea,.field select,.manual-tables textarea { width: 100%; border: 1px solid var(--border); border-radius: .45rem; background: var(--background); padding: .58rem .7rem; outline: none; font-size: .78rem; resize: vertical; transition: .15s; }.field select { height: 2.35rem; padding: 0 .6rem; }.field input:focus,.field textarea:focus,.field select:focus,.manual-tables textarea:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }.form-actions { display: flex; justify-content: flex-end; gap: .6rem; margin-top: 1rem; }.button { display: inline-flex; align-items: center; justify-content: center; gap: .45rem; min-height: 2.25rem; padding: 0 .9rem; border-radius: .45rem; font-size: .76rem; font-weight: 550; transition: .15s; }.button:disabled { cursor: not-allowed; opacity: .55; }.button--primary { background: #2563eb; color: #fff; }.button--primary:hover:not(:disabled) { background: #1d4ed8; }.button--ghost { color: #64748b; }.button--ghost:hover { background: #f1f5f9; }.button--outline { border: 1px solid var(--border); background: var(--card); }.button--outline:hover:not(:disabled) { background: #f8fafc; }.button--full { width: 100%; margin-top: 1rem; }
.spinner { width: .85rem; height: .85rem; border: 2px solid rgba(255,255,255,.4); border-top-color: currentColor; border-radius: 50%; animation: spin .7s linear infinite; }.spinner--dark { color: #2563eb; border-color: #bfdbfe; border-top-color: #2563eb; }@keyframes spin { to { transform: rotate(360deg); } }
.alert { margin-top: .85rem; padding: .65rem .75rem; border-radius: .45rem; font-size: .72rem; line-height: 1.5; }.alert--error { border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; }.alert--warning { border: 1px solid #fed7aa; background: #fff7ed; color: #c2410c; }.alert--info { border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.empty-state { display: flex; min-height: 420px; flex-direction: column; align-items: center; justify-content: center; text-align: center; }.empty-state.compact { min-height: 240px; }.empty-state h3 { margin-top: .9rem; font-size: .9rem; font-weight: 600; }.empty-state p { max-width: 350px; margin-top: .35rem; color: #64748b; font-size: .72rem; }.empty-icon { display: grid; place-items: center; width: 3.4rem; height: 3.4rem; border: 1px solid #bfdbfe; border-radius: 1rem; background: #eff6ff; color: #2563eb; font: 700 .75rem var(--font-mono); }.ai-orbit { position: relative; width: 3.6rem; height: 3.6rem; border: 1px solid #bfdbfe; border-radius: 50%; animation: spin 2.2s linear infinite; }.ai-orbit::after { content: 'AI'; position: absolute; inset: .65rem; display: grid; place-items: center; border-radius: 50%; background: #2563eb; color: #fff; font: 700 .65rem var(--font-mono); }.ai-orbit span { position: absolute; width: .42rem; height: .42rem; border-radius: 50%; background: #60a5fa; }.ai-orbit span:nth-child(1) { left: 50%; top: -.2rem; }.ai-orbit span:nth-child(2) { right: -.1rem; bottom: .6rem; }.ai-orbit span:nth-child(3) { left: .1rem; bottom: .3rem; }
.level-badge,.status-badge { display: inline-flex; align-items: center; white-space: nowrap; padding: .25rem .5rem; border-radius: 999px; font-size: .65rem; font-weight: 650; }.level-l1 { background: #dcfce7; color: #15803d; }.level-l2 { background: #fef9c3; color: #a16207; }.level-l3 { background: #ffedd5; color: #c2410c; }.level-l4,.level-unknown { background: #fee2e2; color: #b91c1c; }.status-success { background: #dcfce7; color: #15803d; }.status-running { background: #dbeafe; color: #1d4ed8; }.status-partial-failed { background: #ffedd5; color: #c2410c; }.status-failed { background: #fee2e2; color: #b91c1c; }
.result-summary { display: grid; grid-template-columns: repeat(3, 1fr); margin-bottom: 1rem; border: 1px solid var(--border); border-radius: .55rem; }.result-summary > div { display: flex; flex-direction: column; gap: .25rem; padding: .8rem; border-left: 1px solid var(--border); }.result-summary > div:first-child { border-left: 0; }.result-summary span,.result-summary small { color: #64748b; font-size: .64rem; }.result-summary strong { font-size: .88rem; font-weight: 650; }.confidence-track { height: .28rem; margin-top: .22rem; overflow: hidden; border-radius: 999px; background: #e2e8f0; }.confidence-track i { display: block; height: 100%; border-radius: inherit; background: #3b82f6; }
.reason-card { padding: .85rem; border-left: 3px solid #60a5fa; border-radius: 0 .45rem .45rem 0; background: #f8fafc; }.reason-card span { color: #475569; font-size: .68rem; font-weight: 650; }.reason-card p { margin-top: .35rem; color: #334155; font-size: .75rem; line-height: 1.65; }.evidence-heading { display: flex; justify-content: space-between; align-items: center; margin: 1.1rem 0 .65rem; }.evidence-heading h3 { font-size: .82rem; font-weight: 650; }.evidence-heading span { color: #64748b; font-size: .68rem; }.evidence-list { display: flex; flex-direction: column; gap: .65rem; }.evidence-card { display: grid; grid-template-columns: 1.55rem 1fr; gap: .7rem; padding: .8rem; border: 1px solid var(--border); border-radius: .55rem; }.evidence-rank { display: grid; place-items: center; width: 1.45rem; height: 1.45rem; border-radius: 50%; background: #eff6ff; color: #2563eb; font: 700 .64rem var(--font-mono); }.evidence-source { display: flex; justify-content: space-between; gap: .7rem; }.evidence-source strong { font-size: .73rem; font-weight: 650; }.evidence-source span { white-space: nowrap; color: #2563eb; font-size: .64rem; }.evidence-article { margin-top: .25rem; color: #475569; font-size: .66rem; font-weight: 550; }.evidence-card p { margin-top: .4rem; color: #475569; font-size: .7rem; line-height: 1.6; }.evidence-card code { display: inline-block; margin-top: .45rem; color: #94a3b8; font-size: .6rem; }.inline-empty,.table-state { padding: 1rem; border: 1px dashed var(--border); border-radius: .5rem; color: #64748b; text-align: center; font-size: .72rem; }.table-state { display: flex; align-items: center; justify-content: center; gap: .5rem; min-height: 180px; border: 0; }
.table-picker { display: grid; gap: .5rem; max-height: 310px; overflow: auto; padding-right: .2rem; }.table-option { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: .65rem; padding: .7rem; border: 1px solid var(--border); border-radius: .5rem; cursor: pointer; }.table-option.selected { border-color: #60a5fa; background: #eff6ff; }.table-option input { accent-color: #2563eb; }.table-option span { display: flex; min-width: 0; flex-direction: column; }.table-option strong { font-size: .73rem; }.table-option small,.table-option em { color: #64748b; font-size: .64rem; font-style: normal; }.manual-tables { display: flex; flex-direction: column; gap: .35rem; }.manual-tables small { color: #b45309; font-size: .65rem; }.switch-field { display: flex; align-items: center; gap: .6rem; align-self: end; min-height: 2.35rem; }.switch-field input { width: 1rem; height: 1rem; accent-color: #2563eb; }.switch-field span { display: flex; flex-direction: column; }.switch-field strong { font-size: .72rem; }.switch-field small { color: #64748b; font-size: .62rem; }
.preset-notice { padding: .55rem .65rem; border: 1px solid #fde68a; border-radius: .45rem; background: #fffbeb; color: #92400e; font-size: .66rem; line-height: 1.45; }
.run-id-row { display: flex; align-items: center; gap: .55rem; padding: .65rem .75rem; border-radius: .45rem; background: #f8fafc; }.run-id-row span { color: #64748b; font-size: .65rem; }.run-id-row code { min-width: 0; overflow: hidden; flex: 1; color: #334155; font-size: .64rem; text-overflow: ellipsis; }.run-id-row button { color: #2563eb; font-size: .65rem; }.metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .65rem; margin-top: .8rem; }.metric-grid > div { display: flex; flex-direction: column; gap: .2rem; padding: .75rem; border: 1px solid var(--border); border-radius: .5rem; }.metric-grid span { color: #64748b; font-size: .63rem; }.metric-grid strong { font-size: 1.25rem; font-weight: 680; }.success-text { color: #16a34a; }.warning-text { color: #ea580c; }.danger-text { color: #dc2626; }.run-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: .65rem; margin-top: .8rem; padding: .85rem; border-radius: .5rem; background: #f8fafc; }.run-details div { min-width: 0; }.run-details dt { color: #64748b; font-size: .62rem; }.run-details dd { overflow: hidden; margin-top: .18rem; font-size: .7rem; font-weight: 550; text-overflow: ellipsis; white-space: nowrap; }
.results-workspace { display: flex; flex-direction: column; gap: 1rem; }.input-action { display: flex; }.input-action input { border-radius: .45rem 0 0 .45rem; }.input-action button { min-width: 3.5rem; flex-shrink: 0; padding: 0 .9rem; border-radius: 0 .45rem .45rem 0; background: #2563eb; color: #fff; font-size: .72rem; white-space: nowrap; }.filter-row { display: grid; grid-template-columns: repeat(3, 1fr) auto; gap: .7rem; align-items: end; margin-top: .8rem; }.filter-button { height: 2.35rem; }.result-metrics { grid-template-columns: repeat(5, 1fr); margin-top: 0; }.metric-status { font-size: .85rem !important; }.results-panel { padding: 1.25rem 0 0; overflow: hidden; }.results-panel .panel-heading { padding: 0 1.25rem; }.result-table-wrap { overflow-x: auto; }.result-table { width: 100%; border-collapse: collapse; font-size: .7rem; }.result-table th { padding: .65rem .75rem; background: #f8fafc; color: #64748b; font-size: .62rem; font-weight: 600; text-align: left; white-space: nowrap; }.result-table td { padding: .72rem .75rem; border-top: 1px solid var(--border); color: #334155; white-space: nowrap; }.result-table td strong,.result-table td small { display: block; }.result-table td strong { font-weight: 600; }.result-table td small { max-width: 180px; overflow: hidden; margin-top: .15rem; color: #94a3b8; font-size: .61rem; text-overflow: ellipsis; }.score-cell { display: flex; min-width: 90px; align-items: center; gap: .4rem; }.score-cell > span { width: 2.2rem; }.score-cell i { width: 45px; height: .25rem; overflow: hidden; border-radius: 99px; background: #e2e8f0; }.score-cell b { display: block; height: 100%; background: #3b82f6; }.review-tag { padding: .2rem .4rem; border-radius: .3rem; background: #f1f5f9; color: #64748b; font-size: .61rem; }.review-tag.required { background: #fff7ed; color: #c2410c; }.text-button { color: #2563eb; font-size: .67rem; }.text-button:hover { text-decoration: underline; }.pagination { display: flex; justify-content: flex-end; align-items: center; gap: .7rem; padding: .8rem 1.25rem; border-top: 1px solid var(--border); }.pagination span { color: #64748b; font-size: .65rem; }
.drawer-layer { position: fixed; inset: 0; z-index: 50; background: rgba(15,23,42,.36); backdrop-filter: blur(2px); }.evidence-drawer { position: absolute; top: 0; right: 0; display: flex; width: min(620px, 92vw); height: 100%; flex-direction: column; background: var(--card); box-shadow: -12px 0 35px rgba(15,23,42,.12); }.evidence-drawer header { display: flex; justify-content: space-between; padding: 1.2rem 1.35rem; border-bottom: 1px solid var(--border); }.evidence-drawer header span,.evidence-drawer header p { color: #64748b; font-size: .65rem; }.evidence-drawer header h2 { margin: .2rem 0; font-size: 1.05rem; font-weight: 650; }.evidence-drawer header button { align-self: flex-start; color: #64748b; font-size: 1.5rem; line-height: 1; }.drawer-body { overflow-y: auto; flex: 1; padding: 1.2rem 1.35rem; }.drawer-summary { display: grid; grid-template-columns: auto 1fr 1fr; align-items: center; gap: .8rem; padding: .8rem; border: 1px solid var(--border); border-radius: .55rem; }.drawer-summary strong { display: flex; flex-direction: column; font-size: .78rem; }.drawer-summary small { margin-top: .15rem; color: #64748b; font-size: .61rem; font-weight: 400; }
.input-action { width: 100%; min-width: 0; }
.input-action input { width: auto; min-width: 0; flex: 1 1 auto; }
.input-action .load-button { display: inline-flex; width: 4rem; min-width: 4rem; height: 2.35rem; flex: 0 0 4rem; align-items: center; justify-content: center; padding: 0; writing-mode: horizontal-tb; }
.input-action .load-button span { display: inline-block; white-space: nowrap; writing-mode: horizontal-tb; }
@media (max-width: 1100px) { .hero-card { flex-direction: column; }.hero-meta { width: 100%; min-width: 0; }.workspace-grid,.workspace-grid--batch { grid-template-columns: 1fr; }.empty-state { min-height: 300px; } }
@media (max-width: 760px) { .hero-card { padding: 1.25rem; }.hero-meta { grid-template-columns: 1fr; }.hero-meta div { border-top: 1px solid #e2e8f0; border-left: 0; }.hero-meta div:first-child { border-top: 0; }.mode-tabs { grid-template-columns: 1fr; }.form-grid,.filter-row { grid-template-columns: 1fr; }.field--wide { grid-column: auto; }.result-summary,.metric-grid,.result-metrics,.run-details { grid-template-columns: repeat(2, 1fr); }.workspace-grid { grid-template-columns: minmax(0,1fr); }.drawer-summary { grid-template-columns: 1fr; } }
</style>
