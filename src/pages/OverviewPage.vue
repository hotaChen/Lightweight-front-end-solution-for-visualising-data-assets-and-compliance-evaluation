<template>
  <AppShell :breadcrumbs="[{ label: '数据资产平台' }, { label: '数据总览' }, { label: currentViewLabel }]">
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">数据总览</h1>
        <p class="page-desc">统一查看数据资产规模、分类分级与合规风险态势</p>
      </div>

      <ViewTabs v-model="currentView" :tabs="viewTabs" aria-label="数据总览视图" />

      <div v-if="currentView === 'assets'" class="asset-overview">
        <div class="section-heading">
          <h2>资产概览</h2>
          <p>全局掌握企业数据资产分布、敏感等级与变化趋势。</p>
        </div>

        <div class="stats-grid">
          <StatCard label="数据表总数" :value="OVERVIEW_STATS.totalTables" unit="张" :accent="'var(--chart-5)'" :delta="`覆盖 ${OVERVIEW_STATS.domains} 个业务域`">
            <template #icon><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm0 0V5a2 2 0 012-2h14a2 2 0 012 2v4"/></svg></template>
          </StatCard>
          <StatCard label="字段总数" :value="OVERVIEW_STATS.totalFields" unit="个" :accent="'var(--chart-4)'" delta="已完成分类标注">
            <template #icon><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></template>
          </StatCard>
          <StatCard label="高敏感数据占比" :value="OVERVIEW_STATS.highSensitiveRatio" unit="%" :accent="'var(--chart-1)'" delta="核心 + 敏感等级">
            <template #icon><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></template>
          </StatCard>
          <StatCard label="近30天新增" :value="OVERVIEW_STATS.newLast30Days" unit="项" :accent="'var(--chart-2)'" delta="较上月 +12%">
            <template #icon><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></template>
          </StatCard>
        </div>

        <div class="charts-row">
          <div class="chart-col-1">
            <ChartCard title="数据分类分布" desc="点击扇区可下钻至对应分类目录"><CategoryPie /></ChartCard>
          </div>
          <div class="chart-col-2">
            <ChartCard title="敏感等级分布" desc="按业务域堆叠展示各等级数据表数量"><DomainLevelBar /></ChartCard>
          </div>
        </div>

        <div class="charts-row">
          <div class="chart-col-2">
            <ChartCard title="数据资产变化趋势" desc="近12个月新增与变更数量"><TrendLine /></ChartCard>
          </div>
          <div class="chart-col-1">
            <ChartCard title="重点风险数据表" desc="风险分最高的资产">
              <template #action><router-link :to="{ path: '/catalog', query: { view: 'risk' } }" class="action-link">进入风险处置</router-link></template>
              <ul class="risk-list">
                <li v-for="table in topRisk" :key="table.id">
                  <router-link :to="{ path: `/catalog/${table.id}`, query: { from: 'risk' } }" class="risk-item">
                    <div class="risk-col">
                      <span class="risk-name">{{ table.cnName }}</span>
                      <span class="risk-table-name">{{ table.name }}</span>
                    </div>
                    <div class="risk-meta">
                      <Badges badge-type="level" :level="table.level" />
                      <span class="risk-score">{{ table.riskScore }}</span>
                    </div>
                  </router-link>
                </li>
              </ul>
            </ChartCard>
          </div>
        </div>
      </div>

      <RiskOverview v-else />
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import Badges from '@/components/Badges.vue'
import ViewTabs from '@/components/ui/ViewTabs.vue'
import StatCard from '@/components/overview/StatCard.vue'
import ChartCard from '@/components/overview/ChartCard.vue'
import CategoryPie from '@/components/overview/CategoryPie.vue'
import DomainLevelBar from '@/components/overview/DomainLevelBar.vue'
import TrendLine from '@/components/overview/TrendLine.vue'
import RiskOverview from '@/components/overview/RiskOverview.vue'
import { OVERVIEW_STATS, HIGH_RISK_TABLES } from '@/data'

const route = useRoute()
const router = useRouter()
const viewTabs = [
  { value: 'assets', label: '资产概览' },
  { value: 'risk', label: '风险概览' },
]
const topRisk = computed(() => HIGH_RISK_TABLES.slice(0, 4))
const currentView = computed({
  get: () => route.path === '/risk' ? 'risk' : 'assets',
  set: value => { void router.push(value === 'risk' ? '/risk' : '/') },
})
const currentViewLabel = computed(() => currentView.value === 'risk' ? '风险概览' : '资产概览')
</script>

<style scoped>
.page { margin: 0 auto; max-width: 88rem; display: flex; flex-direction: column; gap: 1.25rem; }
.page-header, .section-heading { display: flex; flex-direction: column; gap: 0.25rem; }
.page-title { font-size: 1.25rem; font-weight: 600; }
.page-desc, .section-heading p { color: var(--muted-foreground); font-size: 0.875rem; }
.section-heading h2 { font-size: 1rem; font-weight: 600; }
.asset-overview { display: flex; flex-direction: column; gap: 1rem; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.charts-row { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.chart-col-1, .chart-col-2 { min-width: 0; }
.action-link { color: var(--primary); font-size: 0.75rem; font-weight: 500; }
.action-link:hover { text-decoration: underline; }
.risk-list { display: flex; flex-direction: column; }
.risk-list > li + li { border-top: 1px solid var(--border); }
.risk-item { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.625rem 0; color: inherit; text-decoration: none; transition: background 0.15s; }
.risk-item:hover { background: color-mix(in oklab, var(--muted) 50%, transparent); }
.risk-col { min-width: 0; display: flex; flex-direction: column; gap: 0.125rem; }
.risk-name, .risk-table-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.risk-name { font-size: 0.875rem; font-weight: 500; }
.risk-table-name { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.75rem; }
.risk-meta { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
.risk-score { color: var(--chart-1); font-family: var(--font-mono); font-size: 0.875rem; font-weight: 600; }
@media (min-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(4, 1fr); }
  .charts-row { grid-template-columns: 1fr 2fr; }
}
</style>
