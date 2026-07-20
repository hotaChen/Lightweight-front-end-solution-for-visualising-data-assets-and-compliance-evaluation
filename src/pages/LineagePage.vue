<template>
  <AppShell :breadcrumbs="[{ label: '数据资产平台', href: '/' }, { label: '数据血缘关系图' }]">
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">数据血缘关系图</h1>
        <p class="page-desc">可视化数据表之间的流转关系，点击节点查看上下游与详情</p>
      </div>

      <!-- 图例 -->
      <div class="legend">
        <span>敏感等级：</span>
        <span v-for="l in LEVELS" :key="l" class="legend-item">
          <span class="legend-swatch" :style="{ background: colorMap[l] }" />
          {{ l }}
        </span>
        <span class="legend-sep" />
        <span>连线方向表示数据从上游流向下游</span>
      </div>

      <LineageGraphPanel />
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import LineageGraphPanel from '@/components/lineage/LineageGraphPanel.vue'

const LEVELS = ['核心', '敏感', '内部', '公开'] as const
const colorMap: Record<string, string> = {
  '核心': 'var(--chart-1)',
  '敏感': 'var(--chart-2)',
  '内部': 'var(--chart-3)',
  '公开': 'var(--chart-4)',
}
</script>

<style scoped>
.page {
  margin: 0 auto;
  max-width: 80rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.page-header { display: flex; flex-direction: column; gap: 0.25rem; }
.page-title { font-size: 1.25rem; font-weight: 600; letter-spacing: -0.025em; }
.page-desc { font-size: 0.875rem; color: var(--muted-foreground); }

.legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.legend-swatch {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 0.125rem;
}
.legend-sep {
  width: 1px;
  height: 1rem;
  background: var(--border);
}
</style>
