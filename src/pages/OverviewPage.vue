<template>
  <AppShell :breadcrumbs="[{ label: '数据资产平台' }, { label: '数据资产总览' }]">
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">数据资产总览</h1>
        <p class="page-desc">全局掌握企业数据资产分布、敏感等级与变化趋势</p>
      </div>

      <!-- 顶部筛选器：联动统计卡片与全部图表 -->
      <OverviewFilter v-model="filter" />

      <!-- 统计卡片 F1.1 —— 随筛选实时计算 -->
      <div class="stats-grid">
        <StatCard label="数据表总数" :value="stats.totalTables" unit="张" :accent="'var(--chart-5)'" :delta="`覆盖 ${stats.domains} 个业务域`">
          <template #icon>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm0 0V5a2 2 0 012-2h14a2 2 0 012 2v4"/></svg>
          </template>
        </StatCard>
        <StatCard label="字段总数" :value="stats.totalFields" unit="个" :accent="'var(--chart-4)'" delta="已完成分类标注">
          <template #icon>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </template>
        </StatCard>
        <StatCard label="高敏感数据占比" :value="stats.highSensitiveRatio" unit="%" :accent="'var(--chart-1)'" delta="核心 + 敏感等级">
          <template #icon>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </template>
        </StatCard>
        <StatCard :label="filterActive ? '当前筛选命中' : '近30天新增'" :value="filterActive ? stats.totalTables : OVERVIEW_STATS.newLast30Days" :unit="filterActive ? '张' : '项'" :accent="'var(--chart-2)'" :delta="filterActive ? '匹配当前条件' : '较上月 +12%'">
          <template #icon>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </template>
        </StatCard>
      </div>

      <!-- 图表区 -->
      <div class="charts-row">
        <div class="chart-col-1">
          <ChartCard title="数据分类分布" desc="点击扇区可按该分类联动筛选">
            <CategoryPie :filter="filter" @pick="onPickCategory" />
          </ChartCard>
        </div>
        <div class="chart-col-2">
          <ChartCard title="敏感等级分布" desc="点击柱体可按该业务域联动筛选">
            <DomainLevelBar :filter="filter" @pick-domain="onPickDomain" />
          </ChartCard>
        </div>
      </div>

      <div class="charts-row">
        <div class="chart-col-2">
          <ChartCard title="数据资产变化趋势" desc="近12个月新增与变更数量">
            <TrendLine />
          </ChartCard>
        </div>

        <!-- 重点风险快览 -->
        <div class="chart-col-1">
          <ChartCard title="重点风险数据表" desc="风险分最高的资产">
            <template #action>
              <router-link to="/risk" class="action-link">查看看板</router-link>
            </template>
            <ul v-if="topRisk.length" class="risk-list">
              <li v-for="t in topRisk" :key="t.id">
                <router-link :to="`/catalog/${t.id}`" class="risk-item">
                  <div class="risk-col">
                    <span class="risk-name">{{ t.cnName }}</span>
                    <span class="risk-table-name">{{ t.name }}</span>
                  </div>
                  <div class="risk-meta">
                    <Badges badge-type="level" :level="t.level" />
                    <span class="risk-score">{{ t.riskScore }}</span>
                  </div>
                </router-link>
              </li>
            </ul>
            <div v-else class="risk-empty">当前筛选无匹配数据</div>
          </ChartCard>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import Badges from '@/components/Badges.vue'
import StatCard from '@/components/overview/StatCard.vue'
import ChartCard from '@/components/overview/ChartCard.vue'
import OverviewFilter from '@/components/overview/OverviewFilter.vue'
import CategoryPie from '@/components/overview/CategoryPie.vue'
import DomainLevelBar from '@/components/overview/DomainLevelBar.vue'
import TrendLine from '@/components/overview/TrendLine.vue'
import {
  OVERVIEW_STATS,
  emptyFilter,
  isFilterActive,
  filterTables,
  computeStats,
  computeHighRiskTables,
  type OverviewFilter as OverviewFilterState,
  type BusinessDomain,
  type DataCategory,
} from '@/data'

const filter = ref<OverviewFilterState>(emptyFilter())

const filterActive = computed(() => isFilterActive(filter.value))
const filteredTables = computed(() => filterTables(filter.value))
const stats = computed(() => computeStats(filteredTables.value))
const topRisk = computed(() => computeHighRiskTables(filteredTables.value).slice(0, 4))

// 饼图分类 → 该分类涉及的业务域联动（分类无直接筛选维度，映射到其业务域集合）
function onPickCategory(category: string) {
  const domains = Array.from(
    new Set(filterTables(filter.value).filter((t) => t.category === (category as DataCategory)).map((t) => t.domain)),
  ) as BusinessDomain[]
  if (!domains.length) return
  filter.value = { ...filter.value, domains }
}

// 柱状图业务域 → 切换该业务域筛选
function onPickDomain(domain: BusinessDomain) {
  const has = filter.value.domains.includes(domain)
  filter.value = {
    ...filter.value,
    domains: has ? filter.value.domains.filter((d) => d !== domain) : [...filter.value.domains, domain],
  }
}
</script>

<style scoped>
.page {
  margin: 0 auto;
  max-width: 80rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.025em;
}
.page-desc {
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
@media (min-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(4, 1fr); }
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 1024px) {
  .charts-row { grid-template-columns: 1fr 2fr; }
}
.chart-col-1 { min-width: 0; }
.chart-col-2 { min-width: 0; }

.action-link {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--primary);
}
.action-link:hover {
  text-decoration: underline;
}

.risk-list {
  display: flex;
  flex-direction: column;
}
.risk-list > li + li {
  border-top: 1px solid var(--border);
}
.risk-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.625rem 0;
  transition: background 0.15s;
  text-decoration: none;
  color: inherit;
}
.risk-item:hover {
  background: color-mix(in oklab, var(--muted) 50%, transparent);
}
.risk-col {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}
.risk-name {
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.risk-table-name {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.risk-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.risk-score {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--chart-1);
}
.risk-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 8rem;
  font-size: 0.8125rem;
  color: var(--muted-foreground);
}
</style>
