<template>
  <div class="chart-wrap">
    <div v-show="hasData" ref="chartRef" class="chart-container" />
    <div v-if="!hasData" class="chart-empty">当前筛选无匹配数据</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { computeCategoryDistribution, filterTables, type OverviewFilter } from '@/data'
import { cssVar } from '@/utils/color'

const props = defineProps<{ filter: OverviewFilter }>()
const emit = defineEmits<{ pick: [category: string] }>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const distribution = computed(() => computeCategoryDistribution(filterTables(props.filter)))
const hasData = computed(() => distribution.value.length > 0)

function render() {
  if (!chart) return
  const mutedFg = cssVar('--muted-foreground')
  const cardBg = cssVar('--card')

  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => `${p.name}: ${p.value} 张表 (${p.percent}%)`,
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
      data: distribution.value.map(d => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: cssVar(d.fill) },
      })),
    }],
  }, { notMerge: true })
}

function resize() {
  chart?.resize()
}

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.on('click', (params: any) => {
    if (params.name) emit('pick', params.name)
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

// 筛选变化 → 重绘（若之前无数据未初始化，补初始化）
watch(distribution, () => {
  if (!chart && hasData.value) initChart()
  else render()
})
</script>

<style scoped>
.chart-wrap { position: relative; width: 100%; height: 260px; }
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
