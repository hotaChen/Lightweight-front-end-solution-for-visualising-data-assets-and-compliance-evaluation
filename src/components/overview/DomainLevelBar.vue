<template>
  <div ref="chartRef" class="chart-container" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { DOMAIN_LEVEL_DISTRIBUTION, SENSITIVITY_META } from '@/data'
import { cssVar } from '@/utils/color'

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const LEVELS = ['核心', '敏感', '内部', '公开'] as const

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)

  const mutedFg = cssVar('--muted-foreground')
  const border = cssVar('--border')

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      bottom: 0,
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 12, color: mutedFg },
    },
    grid: { left: 0, right: 8, top: 8, bottom: 40 },
    xAxis: {
      type: 'category',
      data: DOMAIN_LEVEL_DISTRIBUTION.map(d => d.domain),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 11, color: mutedFg },
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
      itemStyle: {
        color: cssVar(SENSITIVITY_META[level].color),
        borderRadius: level === '公开' ? [3, 3, 0, 0] : 0,
      },
      data: DOMAIN_LEVEL_DISTRIBUTION.map(d => (d as any)[level]),
    })),
  })
}

onMounted(() => initChart())
onUnmounted(() => chart?.dispose())
</script>

<style scoped>
.chart-container { width: 100%; height: 300px; }
</style>
