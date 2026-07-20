<template>
  <AppShell
    :breadcrumbs="[
      { label: '数据资产平台', href: '/' },
      { label: '数据资产目录', href: '/catalog' },
      { label: table?.cnName ?? '' },
    ]"
  >
    <div v-if="!table" class="empty">数据表未找到</div>
    <div v-else class="page">
      <!-- 返回 + 标题区 -->
      <div class="detail-header">
        <router-link to="/catalog" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
          返回目录
        </router-link>
        <div class="title-row">
          <div class="title-col">
            <div class="title-tags">
              <h1 class="detail-title">{{ table.cnName }}</h1>
              <Badges badge-type="level" :level="table.level" />
              <Badges badge-type="compliance" :status="table.compliance" />
            </div>
            <p class="table-code">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              {{ table.name }}
            </p>
          </div>
          <div class="risk-card">
            <div class="risk-card-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--chart-1)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <div>
                <p class="risk-label">风险评分</p>
                <Badges badge-type="risk" :score="table.riskScore" />
              </div>
            </div>
          </div>
        </div>
        <p class="detail-desc">{{ table.desc }}</p>
      </div>

      <!-- 元信息网格 -->
      <div class="meta-grid">
        <MetaItem icon="layers" label="业务域" :value="table.domain" />
        <MetaItem icon="file" label="数据分类" :value="table.category" />
        <MetaItem icon="database" label="字段数量" :value="`${table.fieldCount} 个`" />
        <MetaItem icon="user" label="数据负责人" :value="table.owner" />
        <MetaItem icon="calendar" label="更新时间" :value="table.updatedAt" />
      </div>

      <!-- 血缘关系简图 -->
      <div class="lineage-card">
        <h3 class="section-title">数据血缘关系</h3>
        <div class="lineage-flow">
          <LineageColumn title="上游来源" :tables="upstream" dir="from" />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" stroke-width="2" class="arrow-icon"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          <div class="current-node">
            <span class="current-tag">当前表</span>
            <span class="current-name">{{ table.cnName }}</span>
            <Badges badge-type="level" :level="table.level" />
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" stroke-width="2" class="arrow-icon"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          <LineageColumn title="下游流向" :tables="downstream" dir="to" />
        </div>
        <hr class="sep" />
        <router-link to="/lineage" class="lineage-link">查看完整血缘关系图 →</router-link>
      </div>

      <!-- 字段清单 -->
      <div>
        <h2 class="section-title" style="margin-bottom: 0.75rem;">字段分类分级清单</h2>
        <FieldTable :fields="table.fields" />
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import Badges from '@/components/Badges.vue'
import FieldTable from '@/components/catalog/FieldTable.vue'
import LineageColumn from '@/components/catalog/LineageColumn.vue'
import MetaItem from '@/components/catalog/MetaItem.vue'
import { getTableById, type DataTable } from '@/data'

const route = useRoute()
const table = computed(() => getTableById(route.params.id as string))

const upstream = computed(() => table.value?.upstream.map(getTableById).filter(Boolean) as DataTable[] ?? [])
const downstream = computed(() => table.value?.downstream.map(getTableById).filter(Boolean) as DataTable[] ?? [])
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.empty { text-align: center; color: var(--muted-foreground); padding: 3rem 0; }

.detail-header { display: flex; flex-direction: column; gap: 1rem; }
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--muted-foreground);
  width: fit-content;
  transition: color 0.15s;
}
.back-link:hover { color: var(--foreground); }

.title-row { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.title-col { display: flex; flex-direction: column; gap: 0.375rem; }
.title-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
.detail-title { font-size: 1.5rem; font-weight: 600; letter-spacing: -0.025em; }
.table-code {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

.risk-card {
  border-radius: 0.625rem;
  border: 1px solid var(--border);
  min-width: 11rem;
}
.risk-card-inner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
}
.risk-label { font-size: 0.75rem; color: var(--muted-foreground); }

.detail-desc {
  max-width: 48rem;
  font-size: 0.875rem;
  line-height: 1.625;
  color: var(--muted-foreground);
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}
@media (min-width: 640px) { .meta-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1024px) { .meta-grid { grid-template-columns: repeat(5, 1fr); } }

.section-title { font-size: 1rem; font-weight: 600; }

.lineage-card {
  border-radius: 0.625rem;
  border: 1px solid var(--border);
  background: var(--card);
  padding: 1.25rem;
}
.lineage-flow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
}
@media (min-width: 1024px) {
  .lineage-flow { flex-direction: row; justify-content: center; }
}
.current-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  border: 2px solid var(--primary);
  background: color-mix(in oklab, var(--primary) 5%, transparent);
  padding: 1rem 1.25rem;
  text-align: center;
}
.current-tag { font-size: 0.75rem; color: var(--muted-foreground); }
.current-name { font-weight: 500; }
.arrow-icon { flex-shrink: 0; }
@media (max-width: 1023px) {
  .arrow-icon { transform: rotate(90deg); }
}

.sep {
  border: none;
  border-top: 1px solid var(--border);
  margin: 1rem 0;
}
.lineage-link {
  font-size: 0.875rem;
  color: var(--primary);
}
.lineage-link:hover { text-decoration: underline; }
</style>
