<template>
  <div class="lineage-panel">
    <div class="lineage-chart-col">
      <div class="chart-card">
        <div ref="graphContainer" class="graph-container" />
      </div>
    </div>

    <!-- 节点详情面板 -->
    <div class="detail-panel" v-if="selectedNode">
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
        <div><span class="meta-l">负责人</span><span class="meta-v">{{ selectedNode.owner }}</span></div>
        <div>
          <span class="meta-l">风险评分</span>
          <Badges badge-type="risk" :score="selectedNode.riskScore" />
        </div>
      </div>

      <div class="detail-compliance">
        <span class="meta-l">合规状态</span>
        <Badges badge-type="compliance" :status="selectedNode.compliance" />
      </div>

      <hr class="sep" />

      <RelList title="上游来源" :tables="selectedUpstream" @select="(id: string) => selectedId = id" empty="源头表（无上游）" />
      <RelList title="下游流向" :tables="selectedDownstream" @select="(id: string) => selectedId = id" empty="末端表（无下游）" />

      <router-link :to="`/catalog/${selectedNode.id}`" class="detail-btn">
        查看字段详情
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Graph } from '@antv/g6'
import Badges from '@/components/Badges.vue'
import RelList from '@/components/lineage/RelList.vue'
import { DATA_TABLES, getTableById, type DataTable } from '@/data'

const graphContainer = ref<HTMLElement>()
const selectedId = ref<string>('t_user_account')
let graph: Graph | null = null

const selectedNode = computed(() => getTableById(selectedId.value) ?? null)

const selectedUpstream = computed(() => {
  if (!selectedNode.value) return []
  return selectedNode.value.upstream.map(getTableById).filter(Boolean) as DataTable[]
})

const selectedDownstream = computed(() => {
  if (!selectedNode.value) return []
  return selectedNode.value.downstream.map(getTableById).filter(Boolean) as DataTable[]
})

const levelColors: Record<string, string> = {
  '核心': '#ef4444',
  '敏感': '#f97316',
  '内部': '#6366f1',
  '公开': '#22c55e',
}

function buildGraph() {
  if (!graphContainer.value) return

  const nodes = DATA_TABLES.map(t => ({
    id: t.id,
    data: {
      label: t.cnName,
      tableName: t.name,
      level: t.level,
    },
    style: {
      fill: '#ffffff',
      stroke: levelColors[t.level] || '#22c55e',
      lineWidth: 2,
      radius: 6,
      labelFill: '#0f172a',
      labelFontSize: 12,
      labelFontWeight: 600,
      labelPlacement: 'center',
      size: [150, 56],
    },
  }))

  const edges: { source: string; target: string; id: string }[] = []
  DATA_TABLES.forEach(t => {
    t.downstream.forEach(d => {
      edges.push({ source: t.id, target: d, id: `${t.id}->${d}` })
    })
  })

  const width = graphContainer.value.clientWidth || 800
  const height = 520

  graph = new Graph({
    container: graphContainer.value,
    width,
    height,
    data: { nodes, edges },
    layout: {
      type: 'dagre',
      rankdir: 'LR',
      nodesep: 30,
      ranksep: 160,
    },
    node: {
      type: 'rect',
      style: { size: [150, 56], radius: 6 },
    },
    edge: {
      type: 'polyline',
      style: {
        stroke: '#cbd5e1',
        lineWidth: 1.5,
        endArrow: true,
      },
    },
    behaviors: ['drag-canvas', 'zoom-canvas'],
    autoFit: 'view',
  })

  graph.on('node:click', (evt: any) => {
    const id = evt.target?.id
    if (id) selectedId.value = id
  })

  graph.render()
}

onMounted(() => {
  setTimeout(buildGraph, 50)
})

onUnmounted(() => {
  graph?.destroy()
  graph = null
})
</script>

<style scoped>
.lineage-panel {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 1024px) {
  .lineage-panel { grid-template-columns: 2fr 1fr; }
}

.chart-card {
  border-radius: 0.625rem;
  border: 1px solid var(--border);
  overflow: hidden;
  background: color-mix(in oklab, var(--muted) 30%, transparent);
}
.graph-container {
  width: 100%;
  height: 520px;
}

/* Detail panel */
.detail-panel {
  border-radius: 0.625rem;
  border: 1px solid var(--border);
  background: var(--card);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.detail-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.detail-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.detail-title { font-size: 1rem; font-weight: 600; }
.detail-code {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
.detail-desc {
  font-size: 0.875rem;
  line-height: 1.625;
  color: var(--muted-foreground);
}
.detail-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  font-size: 0.875rem;
}
.detail-compliance {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.meta-l { font-size: 0.75rem; color: var(--muted-foreground); display: block; }
.meta-v { font-weight: 500; }
.sep { border: none; border-top: 1px solid var(--border); }

.detail-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: opacity 0.15s;
  margin-top: 0.25rem;
}
.detail-btn:hover { opacity: 0.9; }
</style>
