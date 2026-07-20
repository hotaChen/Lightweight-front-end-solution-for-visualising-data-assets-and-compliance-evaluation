<template>
  <div ref="chartRef" class="chart-container" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { CATEGORY_DISTRIBUTION } from '@/data'
import { cssVar } from '@/utils/color'

const router = useRouter()
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)

  const mutedFg = cssVar('--muted-foreground')
  const cardBg = cssVar('--card')

  chart.on('click', (params: any) => {
    if (params.name) {
      router.push(`/catalog?category=${encodeURIComponent(params.name)}`)
    }
  })

  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => `${p.name}: ${p.value} 张表`,
    },
    legend: {
      bottom: 0,
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 12,
      textStyle: { fontSize: 12, color: mutedFg },
    },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['50%', '48%'],
      itemStyle: { borderColor: cardBg, borderWidth: 2 },
      label: { show: false },
      emphasis: { scaleSize: 6 },
      data: CATEGORY_DISTRIBUTION.map(d => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: cssVar(d.fill) },
      })),
    }],
  })
}

onMounted(() => initChart())
onUnmounted(() => chart?.dispose())
</script>

<style scoped>
.chart-container { width: 100%; height: 260px; }
</style>
