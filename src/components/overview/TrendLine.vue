<template>
  <div ref="chartRef" class="chart-container" />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { filterTables, computeTrendData, isFilterActive, type OverviewFilter } from '@/data'
import { cssVar } from '@/utils/color'

const props = defineProps<{ filter: OverviewFilter }>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const trendData = computed(() => computeTrendData(filterTables(props.filter)))
const filterOn = computed(() => isFilterActive(props.filter))

function render() {
  if (!chart) return
  const mutedFg = cssVar('--muted-foreground')
  const border = cssVar('--border')
  const chart4 = cssVar('--chart-4')
  const chart2 = cssVar('--chart-2')

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: filterOn.value
        ? (params: any) => {
            const lines = params.map((p: any) => `${p.marker}${p.seriesName}: ${p.value}`)
            return `${params[0].name}<br>${lines.join('<br>')}<br><span style="font-size:11px;color:${mutedFg}">按筛选范围等比估算</span>`
          }
        : undefined,
    },
    legend: {
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 12, color: mutedFg },
    },
    grid: { left: 0, right: 12, top: 8, bottom: 0, containLabel: true },
    xAxis: {
      type: 'category',
      data: trendData.value.map((d) => d.month),
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
        data: trendData.value.map((d) => d['新增']),
        smooth: true,
        lineStyle: { color: chart4, width: 2 },
        itemStyle: { color: chart4 },
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        name: '变更',
        type: 'line',
        data: trendData.value.map((d) => d['变更']),
        smooth: true,
        lineStyle: { color: chart2, width: 2 },
        itemStyle: { color: chart2 },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  }, { notMerge: true })
}

function resize() {
  chart?.resize()
}

onMounted(() => {
  if (chartRef.value) chart = echarts.init(chartRef.value)
  render()
  window.addEventListener('resize', resize)
})
onUnmounted(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
})

watch(trendData, render)
</script>

<style scoped>
.chart-container { width: 100%; height: 260px; }
</style>
