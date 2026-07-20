<template>
  <div ref="chartRef" class="chart-container" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { TREND_DATA } from '@/data'
import { cssVar } from '@/utils/color'

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)

  const mutedFg = cssVar('--muted-foreground')
  const border = cssVar('--border')
  const chart4 = cssVar('--chart-4')
  const chart2 = cssVar('--chart-2')

  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: {
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 12, color: mutedFg },
    },
    grid: { left: 0, right: 12, top: 8, bottom: 0 },
    xAxis: {
      type: 'category',
      data: TREND_DATA.map(d => d.month),
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
    series: [
      {
        name: '新增',
        type: 'line',
        data: TREND_DATA.map(d => d['新增']),
        smooth: true,
        lineStyle: { color: chart4, width: 2 },
        itemStyle: { color: chart4 },
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        name: '变更',
        type: 'line',
        data: TREND_DATA.map(d => d['变更']),
        smooth: true,
        lineStyle: { color: chart2, width: 2 },
        itemStyle: { color: chart2 },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  })
}

onMounted(() => initChart())
onUnmounted(() => chart?.dispose())
</script>

<style scoped>
.chart-container { width: 100%; height: 260px; }
</style>
