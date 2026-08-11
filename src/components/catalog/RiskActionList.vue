<template>
  <section class="risk-list-card">
    <div class="risk-list-header">
      <div>
        <h2 class="card-title">风险资产处置清单</h2>
        <span class="card-desc">集中检索、筛选和定位资产，共 {{ filteredRows.length }} 条结果</span>
      </div>
      <button v-if="hasFilters" type="button" class="clear-button" @click="clearFilters">清除筛选</button>
    </div>

    <div class="filter-bar">
      <label class="search-field">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <Input v-model="query" placeholder="搜索表名或中文名" />
      </label>
      <Select v-model="statusFilter" :options="statusOptions" />
      <Select v-model="levelFilter" :options="levelOptions" />
      <Select v-model="domainFilter" :options="domainOptions" />
    </div>

    <div class="table-wrap">
      <table class="risk-table">
        <thead>
          <tr>
            <th>数据资产</th>
            <th>业务域</th>
            <th>
              <button type="button" class="sort-button" @click="toggleSort('level')">
                敏感等级 <span>{{ sortMark('level') }}</span>
              </button>
            </th>
            <th>
              <button type="button" class="sort-button" @click="toggleSort('risk')">
                风险分 <span>{{ sortMark('risk') }}</span>
              </button>
            </th>
            <th class="issue-column">主要问题</th>
            <th>合规状态</th>
            <th class="action-column">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="table in pageRows" :key="table.id">
            <td>
              <span class="table-cn-name">{{ table.cnName }}</span>
              <span class="table-en-name">{{ table.name }}</span>
            </td>
            <td class="muted-cell">{{ table.domain }}</td>
            <td><Badges badge-type="level" :level="table.level" /></td>
            <td><Badges badge-type="risk" :score="table.riskScore" /></td>
            <td class="issue-cell" :title="table.riskIssue">{{ table.riskIssue }}</td>
            <td><Badges badge-type="compliance" :status="table.compliance" /></td>
            <td>
              <div class="row-actions">
                <router-link :to="{ path: `/catalog/${table.id}`, query: { from: 'risk' } }" class="action-link">详情</router-link>
                <router-link :to="{ path: '/lineage', query: { id: table.id, from: 'risk' } }" class="action-link action-link--secondary">血缘</router-link>
              </div>
            </td>
          </tr>
          <tr v-if="pageRows.length === 0">
            <td colspan="7" class="empty-cell">没有符合当前条件的数据资产</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <span>第 {{ currentPage }} / {{ totalPages }} 页 · 每页 {{ pageSize }} 条</span>
      <div class="pagination-actions">
        <button type="button" title="上一页" :disabled="currentPage === 1" @click="currentPage--">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <button type="button" title="下一页" :disabled="currentPage === totalPages" @click="currentPage++">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Badges from '@/components/Badges.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import {
  BUSINESS_DOMAINS,
  DATA_TABLES,
  type ComplianceStatus,
  type SensitivityLevel,
} from '@/data'

type SortKey = 'risk' | 'level'
type SortDirection = 'asc' | 'desc'

const route = useRoute()
const router = useRouter()
const statuses: ComplianceStatus[] = ['已合规', '待整改', '超期整改']
const levels: SensitivityLevel[] = ['核心', '敏感', '内部', '公开']
const query = ref('')
const statusFilter = ref('all')
const levelFilter = ref('all')
const domainFilter = ref('all')
const sortKey = ref<SortKey>('risk')
const sortDirection = ref<SortDirection>('desc')
const currentPage = ref(1)
const pageSize = 10
const levelRank: Record<SensitivityLevel, number> = { 核心: 4, 敏感: 3, 内部: 2, 公开: 1 }

const statusOptions = [
  { value: 'all', label: '全部合规状态' },
  ...statuses.map(value => ({ value, label: value })),
]
const levelOptions = [
  { value: 'all', label: '全部敏感等级' },
  ...levels.map(value => ({ value, label: value })),
]
const domainOptions = [
  { value: 'all', label: '全部业务域' },
  ...BUSINESS_DOMAINS.map(value => ({ value, label: value })),
]

const hasFilters = computed(() => Boolean(query.value.trim())
  || statusFilter.value !== 'all'
  || levelFilter.value !== 'all'
  || domainFilter.value !== 'all')

const filteredRows = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return DATA_TABLES
    .filter(table => {
      const matchesQuery = !keyword || table.name.toLowerCase().includes(keyword) || table.cnName.toLowerCase().includes(keyword)
      const matchesStatus = statusFilter.value === 'all' || table.compliance === statusFilter.value
      const matchesLevel = levelFilter.value === 'all' || table.level === levelFilter.value
      const matchesDomain = domainFilter.value === 'all' || table.domain === domainFilter.value
      return matchesQuery && matchesStatus && matchesLevel && matchesDomain
    })
    .sort((a, b) => {
      const difference = sortKey.value === 'risk'
        ? a.riskScore - b.riskScore
        : levelRank[a.level] - levelRank[b.level]
      return sortDirection.value === 'asc' ? difference : -difference
    })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)))
const pageRows = computed(() => filteredRows.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))

watch([query, statusFilter, levelFilter, domainFilter, sortKey, sortDirection], () => {
  currentPage.value = 1
})
watch(totalPages, pages => {
  if (currentPage.value > pages) currentPage.value = pages
})
watch(() => route.query, applyRouteFilters, { immediate: true })

function queryValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function applyRouteFilters() {
  const status = queryValue(route.query.status)
  const level = queryValue(route.query.level)
  const domain = queryValue(route.query.domain)
  const keyword = queryValue(route.query.q)
  statusFilter.value = status && statuses.includes(status as ComplianceStatus) ? status : 'all'
  levelFilter.value = level && levels.includes(level as SensitivityLevel) ? level : 'all'
  domainFilter.value = domain && BUSINESS_DOMAINS.includes(domain) ? domain : 'all'
  query.value = keyword ?? ''
}

function clearFilters() {
  query.value = ''
  statusFilter.value = 'all'
  levelFilter.value = 'all'
  domainFilter.value = 'all'
  const { status: _status, level: _level, domain: _domain, q: _query, ...retainedQuery } = route.query
  void router.replace({ path: '/catalog', query: { ...retainedQuery, view: 'risk' } })
}

function toggleSort(key: SortKey) {
  if (sortKey.value === key) sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc'
  else {
    sortKey.value = key
    sortDirection.value = 'desc'
  }
}

function sortMark(key: SortKey) {
  if (sortKey.value !== key) return '↕'
  return sortDirection.value === 'desc' ? '↓' : '↑'
}
</script>

<style scoped>
.risk-list-card { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius); background: var(--card); }
.risk-list-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem 1.25rem 0.75rem; }
.card-title { font-size: 1rem; font-weight: 600; }
.card-desc { display: block; margin-top: 0.125rem; color: var(--muted-foreground); font-size: 0.75rem; }
.clear-button { flex: 0 0 auto; min-height: 2rem; padding: 0 0.625rem; border: 1px solid var(--border); border-radius: var(--radius); color: var(--primary); font-size: 0.75rem; }
.clear-button:hover { border-color: var(--primary); }
.filter-bar { display: grid; grid-template-columns: minmax(13rem, 1fr) repeat(3, auto); gap: 0.5rem; padding: 0 1.25rem 1rem; }
.search-field { position: relative; min-width: 0; }
.search-field > svg { position: absolute; z-index: 1; left: 0.65rem; top: 50%; transform: translateY(-50%); color: var(--muted-foreground); pointer-events: none; }
.search-field :deep(input) { padding-left: 2rem; }
.table-wrap { overflow-x: auto; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.risk-table { width: 100%; min-width: 880px; border-collapse: collapse; table-layout: fixed; font-size: 0.8125rem; }
.risk-table th { padding: 0.65rem 0.75rem; background: color-mix(in oklab, var(--muted) 55%, transparent); color: var(--muted-foreground); font-weight: 500; text-align: left; white-space: nowrap; }
.risk-table th:nth-child(1) { width: 9.5rem; }
.risk-table th:nth-child(2) { width: 6.5rem; }
.risk-table th:nth-child(3) { width: 6.5rem; }
.risk-table th:nth-child(4) { width: 5.5rem; }
.risk-table th:nth-child(6) { width: 7rem; }
.risk-table th:nth-child(7) { width: 7.5rem; }
.risk-table td { padding: 0.7rem 0.75rem; border-top: 1px solid var(--border); vertical-align: middle; }
.risk-table tbody tr:first-child td { border-top: none; }
.risk-table tbody tr:hover { background: color-mix(in oklab, var(--muted) 45%, transparent); }
.table-cn-name, .table-en-name { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.table-cn-name { font-weight: 600; }
.table-en-name { color: var(--muted-foreground); font-family: var(--font-mono); font-size: 0.6875rem; }
.muted-cell { color: var(--muted-foreground); }
.issue-cell { color: var(--muted-foreground); line-height: 1.45; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sort-button { display: inline-flex; align-items: center; gap: 0.25rem; color: inherit; font-size: inherit; }
.sort-button:hover { color: var(--foreground); }
.row-actions { display: flex; align-items: center; gap: 0.35rem; }
.action-link { min-height: 1.75rem; display: inline-flex; align-items: center; justify-content: center; padding: 0 0.45rem; border-radius: 0.25rem; background: var(--primary); color: var(--primary-foreground); font-size: 0.75rem; }
.action-link--secondary { border: 1px solid var(--border); background: transparent; color: var(--foreground); }
.action-link:hover { opacity: 0.85; }
.empty-cell { height: 8rem; text-align: center; color: var(--muted-foreground); }
.pagination { min-height: 3.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.625rem 1.25rem; color: var(--muted-foreground); font-size: 0.75rem; }
.pagination-actions { display: flex; gap: 0.35rem; }
.pagination-actions button { width: 2rem; height: 2rem; display: grid; place-items: center; border: 1px solid var(--border); border-radius: var(--radius); }
.pagination-actions button:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.pagination-actions button:disabled { opacity: 0.4; cursor: not-allowed; }
@media (max-width: 820px) {
  .filter-bar { grid-template-columns: 1fr 1fr; }
  .search-field { grid-column: 1 / -1; }
  .filter-bar :deep(.select-root), .filter-bar :deep(.select-trigger) { width: 100%; }
}
@media (max-width: 560px) {
  .filter-bar { grid-template-columns: 1fr; }
  .search-field { grid-column: auto; }
  .risk-list-header, .pagination { align-items: flex-start; }
}
</style>
