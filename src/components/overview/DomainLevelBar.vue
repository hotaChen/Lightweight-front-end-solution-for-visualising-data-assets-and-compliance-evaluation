<template>
  <div class="chart-wrap">
    <div v-show="hasData" ref="chartRef" class="chart-container" />
    <div v-if="!hasData" class="chart-empty">当前筛选无匹配数据</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import {
  computeDomainLevelDistribution,
  filterTables,
  SENSITIVITY_META,
  type OverviewFilter,
  type BusinessDomain,
} from '@/data'
import { cssVar } from '@/utils/color'

const props = defineProps<{ filter: OverviewFilter }>()
const emit = defineEmits<{ pickDomain: [domain: BusinessDomain] }>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const LEVELS = ['核心', '敏感', '内部', '公开'] as const

const distribution = computed(() => computeDomainLevelDistribution(filterTables(props.filter)))
const hasData = computed(() => distribution.value.length > 0)

function render() {
  if (!chart) return
  const mutedFg = cssVar('--muted-foreground')
  const border = cssVar('--border')
  const dist = distribution.value

  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      bottom: 0,
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 12, color: mutedFg },
    },
    grid: { left: 0, right: 8, top: 8, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: dist.map(d => d.domain),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 11, color: mutedFg },
      triggerEvent: true,
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: border, type: 'dashed' } },
      axisLabel: { fontSize: 11, color: mutedFg },
    },
    series: LEVELS.map(level => ({
      name: level,
      type: 'bar',
      stack: 'total',
      barMaxWidth: 42,
      cursor: 'pointer',
      itemStyle: {
        color: cssVar(SENSITIVITY_META[level].color),
        borderRadius: level === '公开' ? [3, 3, 0, 0] : 0,
      },
      data: dist.map(d => (d as any)[level]),
    })),
  }, { notMerge: true })
}

function resize() {
  chart?.resize()
}

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  // 点击柱体或 X 轴标签 → 联动到该业务域
  chart.on('click', (params: any) => {
    const domain = (params.name || params.value) as BusinessDomain
    if (domain) emit('pickDomain', domain)
  })
  render()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', resize)
})
onUnmounted(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
})

watch(distribution, () => {
  if (!chart && hasData.value) initChart()
  else render()
})
</script>

<style scoped>
.chart-wrap { position: relative; width: 100%; height: 300px; }
.chart-container { width: 100%; height: 100%; }
.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  color: var(--muted-foreground);
}
</style>
