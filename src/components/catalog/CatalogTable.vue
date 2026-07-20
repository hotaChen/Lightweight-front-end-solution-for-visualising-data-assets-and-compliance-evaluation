<template>
  <div class="catalog-wrap">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          v-model="query"
          placeholder="搜索表名 / 中文名 / 负责人"
          class="filter-input"
        />
      </div>
      <div class="filter-selects">
        <select v-model="domain" class="filter-select">
          <option value="all">全部业务域</option>
          <option v-for="d in BUSINESS_DOMAINS" :key="d" :value="d">{{ d }}</option>
        </select>
        <select v-model="category" class="filter-select">
          <option value="all">全部分类</option>
          <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="level" class="filter-select">
          <option value="all">全部等级</option>
          <option v-for="l in LEVELS" :key="l" :value="l">{{ l }}</option>
        </select>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-card">
      <table class="catalog-table">
        <thead>
          <tr>
            <th class="pl-4">数据表</th>
            <th>业务域</th>
            <th>分类</th>
            <th>等级</th>
            <th>字段数</th>
            <th>负责人</th>
            <th>合规状态</th>
            <th>
              <button class="sort-btn" @click="sortDesc = !sortDesc">
                风险分
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
              </button>
            </th>
            <th class="w-10" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in rows" :key="t.id" class="table-row group">
            <td class="pl-4">
              <router-link :to="`/catalog/${t.id}`" class="table-link">
                <span class="table-name">{{ t.cnName }}</span>
                <span class="table-code">{{ t.name }}</span>
              </router-link>
            </td>
            <td class="text-muted">{{ t.domain }}</td>
            <td>{{ t.category }}</td>
            <td><Badges badge-type="level" :level="t.level" /></td>
            <td class="font-mono tabular-nums">{{ t.fieldCount }}</td>
            <td class="text-muted">{{ t.owner }}</td>
            <td><Badges badge-type="compliance" :status="t.compliance" /></td>
            <td>
              <span class="risk-cell" :style="{ color: riskColor(t.riskScore) }">{{ t.riskScore }}</span>
            </td>
            <td>
              <router-link :to="`/catalog/${t.id}`" class="chevron-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              </router-link>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="9" class="empty-cell">未找到匹配的数据表</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="table-footer">共 {{ rows.length }} 张数据表 · 点击任意行查看字段详情</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Badges from '@/components/Badges.vue'
import { DATA_TABLES, BUSINESS_DOMAINS, type SensitivityLevel, type DataCategory } from '@/data'

const LEVELS: SensitivityLevel[] = ['核心', '敏感', '内部', '公开']
const CATEGORIES: DataCategory[] = ['个人信息', '财务数据', '业务数据', '公开数据']

const route = useRoute()
const query = ref('')
const domain = ref('all')
const level = ref('all')
const category = ref('all')
const sortDesc = ref(true)

onMounted(() => {
  if (route.query.category) {
    category.value = route.query.category as string
  }
})

const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  let filtered = DATA_TABLES.filter(t => {
    const matchQ = !q || t.cnName.includes(query.value) || t.name.toLowerCase().includes(q) || t.owner.includes(query.value)
    const matchD = domain.value === 'all' || t.domain === domain.value
    const matchL = level.value === 'all' || t.level === level.value
    const matchC = category.value === 'all' || t.category === category.value
    return matchQ && matchD && matchL && matchC
  })
  return filtered.sort((a, b) => sortDesc.value ? b.riskScore - a.riskScore : a.riskScore - b.riskScore)
})

function riskColor(score: number) {
  return score >= 80 ? 'var(--chart-1)' : score >= 60 ? 'var(--chart-2)' : 'var(--chart-4)'
}
</script>

<style scoped>
.catalog-wrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Filter bar */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.625rem;
  border: 1px solid var(--border);
  background: var(--card);
}
@media (min-width: 768px) {
  .filter-bar { flex-direction: row; align-items: center; }
}
.search-box {
  position: relative;
  flex: 1;
}
.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted-foreground);
  width: 1rem;
  height: 1rem;
}
.filter-input {
  height: 2.25rem;
  width: 100%;
  padding: 0 0.75rem 0 2.25rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--background);
  font-size: 0.875rem;
  outline: none;
}
.filter-input:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--ring) 25%, transparent);
}
.filter-selects {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.filter-select {
  height: 2.25rem;
  padding: 0 1.5rem 0 0.75rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--background);
  font-size: 0.875rem;
  color: var(--foreground);
  outline: none;
  appearance: none;
  cursor: pointer;
  min-width: 0;
}
.filter-select:focus {
  border-color: var(--ring);
}

/* Table */
.table-card {
  border-radius: 0.625rem;
  border: 1px solid var(--border);
  overflow: hidden;
}
.catalog-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.catalog-table th {
  height: 2.5rem;
  padding: 0 0.75rem;
  text-align: left;
  font-weight: 500;
  color: var(--muted-foreground);
  white-space: nowrap;
}
.catalog-table thead tr {
  background: color-mix(in oklab, var(--muted) 40%, transparent);
}
.catalog-table tbody tr {
  border-bottom: 1px solid var(--border);
}
.catalog-table tbody tr:last-child {
  border-bottom: none;
}
.catalog-table tbody tr:hover {
  background: color-mix(in oklab, var(--muted) 30%, transparent);
}
.catalog-table td {
  padding: 0.75rem;
  vertical-align: middle;
}
.pl-4 { padding-left: 1rem; }
.w-10 { width: 2.5rem; }
.text-muted { color: var(--muted-foreground); }
.font-mono { font-family: var(--font-mono); }

.table-link {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
}
.table-name { font-weight: 500; }
.table-code { font-family: var(--font-mono); font-size: 0.75rem; color: var(--muted-foreground); }

.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--muted-foreground);
}
.sort-btn:hover { color: var(--foreground); }

.risk-cell {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
}

.chevron-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius);
  color: var(--muted-foreground);
  opacity: 0;
  transition: all 0.15s;
}
tr:hover .chevron-link { opacity: 1; }
.chevron-link:hover { background: var(--muted); color: var(--foreground); }

.empty-cell {
  height: 6rem;
  text-align: center;
  color: var(--muted-foreground);
}

.table-footer {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
</style>
