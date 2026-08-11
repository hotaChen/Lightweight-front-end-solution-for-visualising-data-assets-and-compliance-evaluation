<template>
  <AppShell
    :breadcrumbs="[
      { label: '数据资产平台', href: '/' },
      { label: sourceLabel, href: sourcePath },
      { label: table?.cnName ?? '' },
    ]"
  >
    <div v-if="!table" class="empty">数据表未找到</div>
    <div v-else class="page">
      <!-- 返回 + 标题区 -->
      <div class="detail-header">
        <router-link :to="sourcePath" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
          返回{{ sourceLabel }}
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
        <router-link :to="{ path: '/lineage', query: { id: table.id, from: sourceKey } }" class="lineage-link">查看完整血缘关系图 →</router-link>
      </div>

      <section class="field-section">
        <div class="field-section-header">
          <div>
            <h2 class="section-title">字段分类分级与详情</h2>
            <p>选择字段查看分类分级、合规依据和跨资产同名字段位置。</p>
          </div>
          <span>{{ table.fields.length }} 条已展开字段</span>
        </div>

        <div class="field-workspace">
          <FieldTable
            :fields="table.fields"
            :selected-name="selectedField?.name"
            @select="selectField"
          />

          <aside v-if="selectedField" class="field-inspector" aria-label="字段详情">
            <div class="inspector-header">
              <div>
                <span class="inspector-label">当前字段</span>
                <h3>{{ selectedField.name }}</h3>
              </div>
              <Badges badge-type="level" :level="selectedField.level" />
            </div>

            <p class="field-description">{{ selectedField.desc }}</p>

            <dl class="field-meta">
              <div><dt>数据类型</dt><dd class="mono">{{ selectedField.type }}</dd></div>
              <div><dt>数据分类</dt><dd>{{ selectedField.category }}</dd></div>
              <div><dt>敏感等级</dt><dd>{{ selectedField.level }}</dd></div>
              <div><dt>依据法规</dt><dd>{{ selectedField.regulation }}</dd></div>
            </dl>

            <div class="context-section">
              <h4>所属资产与治理上下文</h4>
              <dl class="context-list">
                <div><dt>所属资产</dt><dd>{{ table.cnName }}</dd></div>
                <div><dt>数据负责人</dt><dd>{{ table.owner }}</dd></div>
                <div><dt>资产风险分</dt><dd><Badges badge-type="risk" :score="table.riskScore" /></dd></div>
                <div><dt>合规状态</dt><dd><Badges badge-type="compliance" :status="table.compliance" /></dd></div>
              </dl>
            </div>

            <div class="context-section">
              <h4>其他资产中的同名字段</h4>
              <ul v-if="sameNameLocations.length" class="same-name-list">
                <li v-for="location in sameNameLocations" :key="location.table.id">
                  <router-link :to="{ path: `/catalog/${location.table.id}`, query: { from: 'catalog', field: selectedField.name } }">
                    <span>{{ location.table.cnName }}</span>
                    <span class="mono">{{ location.table.name }}</span>
                  </router-link>
                </li>
              </ul>
              <p v-else class="same-name-empty">其他资产中未发现同名字段</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import Badges from '@/components/Badges.vue'
import FieldTable from '@/components/catalog/FieldTable.vue'
import LineageColumn from '@/components/catalog/LineageColumn.vue'
import MetaItem from '@/components/catalog/MetaItem.vue'
import { DATA_TABLES, getTableById, type DataTable, type FieldInfo } from '@/data'

const route = useRoute()
const router = useRouter()
const table = computed(() => getTableById(route.params.id as string))
const sourceKey = computed(() => route.query.from === 'risk' ? 'risk' : route.query.from === 'lineage' ? 'lineage' : 'catalog')
const sourceLabel = computed(() => sourceKey.value === 'risk' ? '风险处置' : sourceKey.value === 'lineage' ? '数据血缘关系图' : '数据资产目录')
const sourcePath = computed(() => sourceKey.value === 'risk'
  ? '/catalog?view=risk'
  : sourceKey.value === 'lineage'
    ? `/lineage?id=${table.value?.id ?? ''}`
    : '/catalog')

const upstream = computed(() => table.value?.upstream.map(getTableById).filter(Boolean) as DataTable[] ?? [])
const downstream = computed(() => table.value?.downstream.map(getTableById).filter(Boolean) as DataTable[] ?? [])
const selectedField = computed(() => {
  const fields = table.value?.fields ?? []
  const requestedName = typeof route.query.field === 'string' ? route.query.field : ''
  return fields.find(field => field.name === requestedName)
    ?? fields.find(field => field.level === '核心' || field.level === '敏感')
    ?? fields[0]
})
const sameNameLocations = computed(() => {
  if (!selectedField.value || !table.value) return []
  return DATA_TABLES.flatMap(candidate => candidate.id === table.value?.id
    ? []
    : candidate.fields.some(field => field.name === selectedField.value?.name)
      ? [{ table: candidate }]
      : [])
})

function selectField(field: FieldInfo) {
  void router.replace({ query: { ...route.query, field: field.name } })
}
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
.field-section { display: flex; flex-direction: column; gap: 0.75rem; min-width: 0; }
.field-section-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; }
.field-section-header p, .field-section-header > span { margin-top: 0.2rem; color: var(--muted-foreground); font-size: 0.75rem; }
.field-section-header > span { flex: 0 0 auto; }
.field-workspace { display: grid; grid-template-columns: minmax(0, 2fr) minmax(18rem, 0.85fr); gap: 1rem; align-items: start; }
.field-inspector { min-width: 0; display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--card); }
.inspector-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
.inspector-label { color: var(--muted-foreground); font-size: 0.75rem; }
.inspector-header h3 { margin-top: 0.15rem; font-family: var(--font-mono); font-size: 1rem; font-weight: 600; overflow-wrap: anywhere; }
.field-description { color: var(--muted-foreground); font-size: 0.8125rem; line-height: 1.55; }
.field-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding: 0.875rem 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.field-meta div, .context-list div { min-width: 0; }
.field-meta dt, .context-list dt { color: var(--muted-foreground); font-size: 0.6875rem; }
.field-meta dd, .context-list dd { margin-top: 0.2rem; font-size: 0.8125rem; font-weight: 500; overflow-wrap: anywhere; }
.mono { font-family: var(--font-mono); }
.context-section { display: flex; flex-direction: column; gap: 0.5rem; }
.context-section h4 { font-size: 0.8125rem; font-weight: 600; }
.context-list { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.same-name-list { display: flex; flex-direction: column; gap: 0.35rem; }
.same-name-list a { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.5rem 0.625rem; border: 1px solid var(--border); border-radius: var(--radius); color: inherit; font-size: 0.75rem; }
.same-name-list a:hover { border-color: var(--primary); color: var(--primary); }
.same-name-list .mono { color: var(--muted-foreground); font-size: 0.6875rem; }
.same-name-empty { padding: 0.75rem; border: 1px dashed var(--border); color: var(--muted-foreground); font-size: 0.75rem; text-align: center; }
@media (max-width: 1180px) { .field-workspace { grid-template-columns: 1fr; } }
@media (max-width: 640px) {
  .field-section-header { align-items: flex-start; flex-direction: column; }
  .field-meta, .context-list { grid-template-columns: 1fr; }
}
</style>
