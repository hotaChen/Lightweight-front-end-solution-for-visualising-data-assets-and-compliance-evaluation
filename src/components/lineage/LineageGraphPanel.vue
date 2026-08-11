<template>
  <div class="lineage-workspace">
    <div class="toolbar" aria-label="血缘图筛选与视图操作">
      <label class="filter-field">
        <span>业务域</span>
        <Select v-model="domainFilter" :options="domainOptions" />
      </label>
      <label class="filter-field">
        <span>敏感等级</span>
        <Select v-model="levelFilter" :options="levelOptions" />
      </label>
      <span class="filter-result">显示 {{ visibleTables.length }} / {{ DATA_TABLES.length }} 个节点</span>
      <button class="reset-button" type="button" title="恢复初始布局和缩放" @click="resetView">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v6h6" />
        </svg>
        重置视图
      </button>
    </div>

    <div class="lineage-panel">
      <div class="chart-card">
        <div v-if="visibleTables.length === 0" class="graph-empty">当前筛选条件下没有可展示的资产表</div>
        <div ref="graphContainer" class="graph-container" :class="{ 'graph-container--empty': visibleTables.length === 0 }" />
        <div class="canvas-hint">滚轮缩放 · 拖动画布 · 拖动节点调整位置</div>
      </div>

      <aside v-if="selectedNode" class="detail-panel" aria-label="选中节点详情">
        <div class="detail-header">
          <div class="detail-title-row">
            <h3 class="detail-title">{{ selectedNode.cnName }}</h3>
            <Badges badge-type="level" :level="selectedNode.level" />
          </div>
          <p class="detail-code">{{ selectedNode.name }}</p>
        </div>

        <p class="detail-desc">{{ selectedNode.desc }}</p>

        <div class="detail-meta">
          <div><span class="meta-l">业务域</span><span class="meta-v">{{ selectedNode.domain }}</span></div>
          <div><span class="meta-l">数据分类</span><span class="meta-v">{{ selectedNode.category }}</span></div>
          <div><span class="meta-l">字段数量</span><span class="meta-v">{{ selectedNode.fieldCount }} 个</span></div>
          <div><span class="meta-l">负责人</span><span class="meta-v">{{ selectedNode.owner }}</span></div>
          <div>
            <span class="meta-l">风险评分</span>
            <Badges badge-type="risk" :score="selectedNode.riskScore" />
          </div>
          <div>
            <span class="meta-l">合规状态</span>
            <Badges badge-type="compliance" :status="selectedNode.compliance" />
          </div>
        </div>

        <div class="core-fields">
          <span class="meta-l">核心及敏感字段（最多 5 项）</span>
          <ul v-if="sensitiveFields.length" class="field-list">
            <li v-for="field in sensitiveFields" :key="field.name">
              <span class="field-name">{{ field.name }}</span>
              <Badges badge-type="level" :level="field.level" />
            </li>
          </ul>
          <p v-else class="field-empty">暂无核心或敏感字段</p>
        </div>

        <hr class="sep" />

        <RelList title="上游来源" :tables="selectedUpstream" @select="selectRelated" empty="源头表（无上游）" />
        <RelList title="下游流向" :tables="selectedDownstream" @select="selectRelated" empty="末端表（无下游）" />

        <router-link :to="detailLink" class="detail-btn">
          查看完整详情
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6M10 14 21 3" />
          </svg>
        </router-link>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Graph, type EdgeData, type NodeData } from '@antv/g6'
import Badges from '@/components/Badges.vue'
import RelList from '@/components/lineage/RelList.vue'
import Select from '@/components/ui/Select.vue'
import {
  BUSINESS_DOMAINS,
  DATA_TABLES,
  getTableById,
  type DataTable,
  type SensitivityLevel,
} from '@/data'
import { cssVar } from '@/utils/color'

const route = useRoute()
const router = useRouter()
const graphContainer = ref<HTMLElement>()
const initialId = typeof route.query.id === 'string' && getTableById(route.query.id)
  ? route.query.id
  : DATA_TABLES[0].id
const selectedId = ref(initialId)
const domainFilter = ref('all')
const levelFilter = ref('all')
let graph: Graph | null = null
let resizeObserver: ResizeObserver | null = null
let highlightRevision = 0

const domainOptions = [
  { value: 'all', label: '全部业务域' },
  ...BUSINESS_DOMAINS.map(value => ({ value, label: value })),
]
const levelOptions = [
  { value: 'all', label: '全部等级' },
  ...(['核心', '敏感', '内部', '公开'] as SensitivityLevel[]).map(value => ({ value, label: value })),
]

const visibleTables = computed(() => DATA_TABLES.filter(table => {
  const matchesDomain = domainFilter.value === 'all' || table.domain === domainFilter.value
  const matchesLevel = levelFilter.value === 'all' || table.level === levelFilter.value
  return matchesDomain && matchesLevel
}))
const selectedNode = computed(() => getTableById(selectedId.value) ?? null)
const selectedUpstream = computed(() => selectedNode.value?.upstream.map(getTableById).filter(Boolean) as DataTable[] ?? [])
const selectedDownstream = computed(() => selectedNode.value?.downstream.map(getTableById).filter(Boolean) as DataTable[] ?? [])
const sensitiveFields = computed(() => selectedNode.value?.fields
  .filter(field => field.level === '核心' || field.level === '敏感')
  .slice(0, 5) ?? [])
const detailLink = computed(() => ({
  path: `/catalog/${selectedId.value}`,
  query: { from: 'lineage' },
}))

function graphData(): { nodes: NodeData[]; edges: EdgeData[] } {
  const visibleIds = new Set(visibleTables.value.map(table => table.id))
  const nodes: NodeData[] = visibleTables.value.map(table => ({
    id: table.id,
    data: { level: table.level },
    style: {
      size: [164, 64],
      fill: cssVar('--card'),
      stroke: levelColor(table.level),
      lineWidth: 2,
      radius: 6,
      labelText: table.cnName,
      labelFill: cssVar('--foreground'),
      labelFontSize: 13,
      labelFontWeight: 600,
      labelPlacement: 'center',
      cursor: 'grab',
    },
  }))
  const edges: EdgeData[] = []
  visibleTables.value.forEach(table => {
    table.downstream.forEach(target => {
      if (visibleIds.has(target)) edges.push({ id: `${table.id}->${target}`, source: table.id, target })
    })
  })
  return { nodes, edges }
}

function levelColor(level: SensitivityLevel): string {
  const colors: Record<SensitivityLevel, string> = {
    核心: cssVar('--chart-1'),
    敏感: cssVar('--chart-2'),
    内部: cssVar('--chart-3'),
    公开: cssVar('--chart-4'),
  }
  return colors[level]
}

async function renderGraph(fit = true) {
  if (!graph) return
  const data = graphData()
  graph.setData(data)
  await graph.render()
  if (fit && data.nodes.length) await graph.fitView({ when: 'always', direction: 'both' }, false)
  await highlightSelection()
}

async function highlightSelection(focus = false) {
  if (!graph) return
  const revision = ++highlightRevision
  const nodeIds = new Set(graph.getNodeData().map(node => String(node.id)))
  const edgeData = graph.getEdgeData()
  const clearedStates: Record<string, string[]> = {}
  nodeIds.forEach(id => { clearedStates[id] = [] })
  edgeData.forEach(edge => { clearedStates[String(edge.id)] = [] })
  await graph.setElementState(clearedStates, false)
  if (revision !== highlightRevision || !visibleTables.value.some(table => table.id === selectedId.value)) return

  const relatedIds = new Set<string>([selectedId.value])
  const relatedEdgeIds = new Set<string>()
  edgeData.forEach(edge => {
    const source = String(edge.source)
    const target = String(edge.target)
    if (source === selectedId.value || target === selectedId.value) {
      relatedIds.add(source)
      relatedIds.add(target)
      relatedEdgeIds.add(String(edge.id))
    }
  })
  const stateMap: Record<string, string[]> = {}
  nodeIds.forEach(id => {
    stateMap[id] = id === selectedId.value ? ['selected'] : relatedIds.has(id) ? ['related'] : ['dimmed']
  })
  edgeData.forEach(edge => {
    stateMap[String(edge.id)] = relatedEdgeIds.has(String(edge.id)) ? ['related'] : ['dimmed']
  })
  await graph.setElementState(stateMap, false)
  if (revision !== highlightRevision) return
  if (focus) await graph.focusElement(selectedId.value, { duration: 250 })
}

function ensureVisible(id: string) {
  const table = getTableById(id)
  if (!table) return
  if (domainFilter.value !== 'all' && domainFilter.value !== table.domain) domainFilter.value = 'all'
  if (levelFilter.value !== 'all' && levelFilter.value !== table.level) levelFilter.value = 'all'
}

async function selectNode(id: string, focus = false) {
  if (!getTableById(id)) return
  ensureVisible(id)
  selectedId.value = id
  await nextTick()
  await highlightSelection(focus)
}

function selectRelated(id: string) {
  void selectNode(id, true)
}

async function resetView() {
  domainFilter.value = 'all'
  levelFilter.value = 'all'
  await nextTick()
  await renderGraph(true)
}

function createGraph() {
  if (!graphContainer.value) return
  graph = new Graph({
    container: graphContainer.value,
    width: graphContainer.value.clientWidth || 800,
    height: graphContainer.value.clientHeight || 540,
    data: graphData(),
    layout: { type: 'dagre', rankdir: 'LR', nodesep: 38, ranksep: 92 },
    node: {
      type: 'rect',
      style: { size: [164, 64], radius: 6 },
      state: {
        selected: { lineWidth: 4, shadowColor: cssVar('--primary'), shadowBlur: 16, opacity: 1 },
        related: { lineWidth: 3, opacity: 1 },
        dimmed: { opacity: 0.25, labelOpacity: 0.35 },
      },
    },
    edge: {
      type: 'polyline',
      style: { stroke: cssVar('--muted-foreground'), lineWidth: 1.5, opacity: 0.65, endArrow: true },
      state: {
        related: { stroke: cssVar('--primary'), lineWidth: 3, opacity: 1 },
        dimmed: { opacity: 0.12 },
      },
    },
    behaviors: [
      'drag-canvas',
      { type: 'drag-element', animation: false },
      { type: 'zoom-canvas', sensitivity: 0.8 },
    ],
    zoomRange: [0.2, 2],
    padding: 48,
    animation: false,
  })

  graph.on('node:click', (event: any) => {
    const id = String(event.target?.id ?? '')
    if (id) void selectNode(id)
  })
  void renderGraph(true)

  resizeObserver = new ResizeObserver(entries => {
    const entry = entries[0]
    if (!graph || !entry) return
    const { width, height } = entry.contentRect
    if (width > 0 && height > 0) graph.setSize(width, height)
  })
  resizeObserver.observe(graphContainer.value)
}

watch([domainFilter, levelFilter], async () => {
  if (!visibleTables.value.some(table => table.id === selectedId.value) && visibleTables.value[0]) {
    selectedId.value = visibleTables.value[0].id
  }
  await renderGraph(true)
})

watch(selectedId, id => {
  if (route.query.id === id) return
  void router.replace({ query: { ...route.query, id } })
})

watch(() => route.query.id, value => {
  if (typeof value === 'string' && value !== selectedId.value && getTableById(value)) void selectNode(value, true)
})

onMounted(async () => {
  await nextTick()
  createGraph()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  graph?.destroy()
  graph = null
})
</script>

<style scoped>
.lineage-workspace { display: flex; flex-direction: column; gap: 1rem; }
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.75rem;
  padding: 0.875rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
}
.filter-field { display: flex; flex-direction: column; gap: 0.25rem; }
.filter-field > span { font-size: 0.75rem; color: var(--muted-foreground); }
.filter-result { margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--muted-foreground); }
.reset-button {
  margin-left: auto;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--background);
  font-size: 0.875rem;
}
.reset-button:hover { border-color: var(--primary); color: var(--primary); }
.lineage-panel { display: grid; grid-template-columns: minmax(0, 2fr) minmax(18rem, 1fr); gap: 1rem; align-items: stretch; }
.chart-card { position: relative; min-width: 0; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; background: color-mix(in oklab, var(--muted) 30%, transparent); }
.graph-container { width: 100%; height: 560px; }
.graph-container--empty { visibility: hidden; }
.graph-empty { position: absolute; inset: 0; display: grid; place-items: center; color: var(--muted-foreground); font-size: 0.875rem; }
.canvas-hint { position: absolute; left: 0.75rem; bottom: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 0.25rem; background: color-mix(in oklab, var(--card) 88%, transparent); color: var(--muted-foreground); font-size: 0.6875rem; pointer-events: none; }
.detail-panel { min-width: 0; border: 1px solid var(--border); border-radius: var(--radius); background: var(--card); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
.detail-header { display: flex; flex-direction: column; gap: 0.25rem; }
.detail-title-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.detail-title { min-width: 0; font-size: 1rem; font-weight: 600; overflow-wrap: anywhere; }
.detail-code, .field-name { font-family: var(--font-mono); }
.detail-code { font-size: 0.75rem; color: var(--muted-foreground); overflow-wrap: anywhere; }
.detail-desc { font-size: 0.8125rem; line-height: 1.6; color: var(--muted-foreground); }
.detail-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.875rem; }
.detail-meta > div { min-width: 0; }
.meta-l { display: block; margin-bottom: 0.15rem; font-size: 0.75rem; color: var(--muted-foreground); }
.meta-v { font-weight: 500; overflow-wrap: anywhere; }
.core-fields { display: flex; flex-direction: column; gap: 0.35rem; }
.field-list { display: flex; flex-direction: column; gap: 0.25rem; }
.field-list li { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.35rem 0.5rem; border-radius: 0.25rem; background: var(--muted); font-size: 0.75rem; }
.field-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.field-empty { padding: 0.5rem; border: 1px dashed var(--border); color: var(--muted-foreground); font-size: 0.75rem; }
.sep { border: none; border-top: 1px solid var(--border); }
.detail-btn { margin-top: auto; min-height: 2.25rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.375rem; padding: 0.5rem 0.75rem; border-radius: var(--radius); background: var(--primary); color: var(--primary-foreground); font-size: 0.875rem; font-weight: 500; text-decoration: none; }
.detail-btn:hover { opacity: 0.9; }
@media (max-width: 1023px) {
  .lineage-panel { grid-template-columns: 1fr; }
  .graph-container { height: 500px; }
  .reset-button { margin-left: 0; }
}
@media (max-width: 640px) {
  .toolbar { align-items: stretch; }
  .filter-field { flex: 1 1 100%; }
  .filter-field :deep(.select-root), .filter-field :deep(.select-trigger) { width: 100%; }
  .filter-result { margin: 0; }
  .reset-button { width: 100%; }
  .graph-container { height: 420px; }
  .detail-meta { grid-template-columns: 1fr 1fr; }
}
</style>
