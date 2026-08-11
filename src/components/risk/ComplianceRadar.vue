<template>
  <div ref="chartRef" class="chart-container" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { COMPLIANCE_RADAR } from '@/data'
import { cssVar } from '@/utils/color'

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)

  const mutedFg = cssVar('--muted-foreground')
  const border = cssVar('--border')
  const primary = cssVar('--primary')

  const compact = chartRef.value.clientWidth < 420
  chart.setOption({
    radar: {
      center: ['50%', '50%'],
      radius: compact ? '55%' : '70%',
      indicator: COMPLIANCE_RADAR.map(d => ({ name: d.dimension, max: 100 })),
      axisName: { fontSize: compact ? 10 : 11, color: mutedFg },
      splitArea: { show: false },
      splitLine: { lineStyle: { color: border } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: COMPLIANCE_RADAR.map(d => d.score),
        name: '合规评分',
      }],
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: { color: primary, width: 2 },
      areaStyle: { color: primary, opacity: 0.25 },
      itemStyle: { color: primary },
    }],
  })

  resizeObserver = new ResizeObserver(entries => {
    const width = entries[0]?.contentRect.width ?? 0
    if (!chart || width <= 0) return
    chart.resize()
    chart.setOption({ radar: { radius: width < 420 ? '55%' : '70%' } })
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
.chart-container { width: 100%; height: 280px; }
</style>
