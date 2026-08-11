<template>
  <div class="donut-wrap">
    <div ref="chartRef" class="donut-chart" />
    <ul class="donut-legend">
      <li v-for="d in COMPLIANCE_STATUS_STATS" :key="d.status">
        <button type="button" class="donut-legend-item" @click="emit('select', d.status)">
          <span class="legend-swatch" :style="{ background: d.color }" />
          <span>{{ d.status }}</span>
          <span class="legend-count">{{ d.count }} / {{ total }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { COMPLIANCE_STATUS_STATS, type ComplianceStatus } from '@/data'
import { cssVar } from '@/utils/color'

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null
const emit = defineEmits<{ select: [status: ComplianceStatus] }>()

const total = COMPLIANCE_STATUS_STATS.reduce((s, d) => s + d.count, 0)

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)

  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => `${p.name}: ${p.value} / ${total}`,
    },
    series: [{
      type: 'pie',
      radius: ['55%', '78%'],
      center: ['50%', '50%'],
      itemStyle: { borderWidth: 0 },
      label: { show: false },
      data: COMPLIANCE_STATUS_STATS.map(d => ({
        name: d.status,
        value: d.count,
        itemStyle: { color: cssVar(d.color) },
      })),
    }],
  })
  chart.on('click', params => emit('select', params.name as ComplianceStatus))
  resizeObserver = new ResizeObserver(entries => {
    if (entries[0]?.contentRect.width) chart?.resize()
  })
  resizeObserver.observe(chartRef.value)
}

onMounted(() => initChart())
onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.donut-wrap { display: flex; align-items: center; gap: 1rem; }
.donut-chart { width: 50%; height: 180px; }
.donut-legend { flex: 1; display: flex; flex-direction: column; gap: 0.625rem; }
.donut-legend-item { width: 100%; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.5rem; padding: 0.25rem; border-radius: 0.25rem; font-size: 0.875rem; text-align: left; }
.donut-legend-item:hover { background: var(--muted); }
.legend-swatch { width: 0.625rem; height: 0.625rem; border-radius: 0.125rem; flex-shrink: 0; }
.legend-count { font-family: var(--font-mono); color: var(--muted-foreground); }
</style>
