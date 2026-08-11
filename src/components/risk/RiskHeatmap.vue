<template>
  <div class="heatmap-wrap">
    <div class="heatmap-grid">
      <div />
      <div v-for="l in LEVELS" :key="l" class="heatmap-header">{{ l }}</div>
      <template v-for="domain in BUSINESS_DOMAINS" :key="domain">
        <div class="heatmap-label">{{ domain }}</div>
        <button
          v-for="l in LEVELS"
          :key="l"
          type="button"
          class="heatmap-cell"
          :class="{ 'heatmap-cell--empty': getValue(domain, l) === 0 }"
          :style="cellStyle(getValue(domain, l))"
          :title="`${domain} · ${l}：${getValue(domain, l)} 张资产表`"
          :disabled="getValue(domain, l) === 0"
          @click="emit('select', domain, l)"
        >
          {{ getValue(domain, l) || '' }}
        </button>
      </template>
    </div>
    <div class="heatmap-legend">
      <span>低</span>
      <span v-for="o in [0.2, 0.4, 0.6, 0.8, 1]" :key="o" class="legend-swatch" :style="{ background: `color-mix(in oklab, var(--chart-1) ${o * 100}%, var(--card))` }" />
      <span>高</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RISK_HEATMAP, BUSINESS_DOMAINS, type BusinessDomain, type SensitivityLevel } from '@/data'

const emit = defineEmits<{ select: [domain: BusinessDomain, level: SensitivityLevel] }>()

const LEVELS = ['核心', '敏感', '内部', '公开'] as const

const max = Math.max(...RISK_HEATMAP.flatMap(r => LEVELS.map(l => (r as any)[l])))

function getValue(domain: string, level: string): number {
  const row = RISK_HEATMAP.find(r => r.domain === domain) as any
  return row?.[level] ?? 0
}

function cellStyle(value: number) {
  if (value === 0) return { background: 'var(--muted)', color: 'var(--muted-foreground)' }
  const t = value / max
  const opacity = 0.15 + t * 0.75
  return {
    background: `color-mix(in oklab, var(--chart-1) ${Math.round(opacity * 100)}%, var(--card))`,
    color: t > 0.55 ? 'var(--primary-foreground)' : 'var(--foreground)',
  }
}
</script>

<style scoped>
.heatmap-wrap {
  overflow-x: auto;
}
.heatmap-grid {
  display: grid;
  grid-template-columns: 120px repeat(4, 1fr);
  gap: 0.375rem;
  min-width: 480px;
}
.heatmap-header {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--muted-foreground);
  padding-bottom: 0.25rem;
}
.heatmap-label {
  display: flex;
  align-items: center;
  padding-right: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--muted-foreground);
  justify-content: flex-end;
}
.heatmap-cell {
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  border: 1px solid transparent;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}
.heatmap-cell:not(:disabled):hover { border-color: var(--foreground); transform: translateY(-1px); }
.heatmap-cell--empty { cursor: default; }
.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
.legend-swatch {
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 0.125rem;
}
@media (max-width: 640px) {
  .heatmap-grid {
    grid-template-columns: 4.5rem repeat(4, minmax(2.75rem, 1fr));
    gap: 0.25rem;
    min-width: 0;
  }
  .heatmap-label { padding-right: 0.25rem; font-size: 0.6875rem; }
  .heatmap-header { font-size: 0.6875rem; }
  .heatmap-cell { height: 2.75rem; }
  .heatmap-legend { gap: 0.35rem; }
}
</style>
