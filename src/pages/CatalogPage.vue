<template>
  <AppShell :breadcrumbs="[{ label: '数据资产平台', href: '/' }, { label: '数据资产' }, { label: currentViewLabel }]">
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">数据资产</h1>
        <p class="page-desc">在统一资产空间中完成目录检索、字段下钻和风险处置</p>
      </div>

      <ViewTabs v-model="currentView" :tabs="viewTabs" aria-label="数据资产视图" />

      <section v-if="currentView === 'catalog'" class="view-section">
        <div class="section-heading">
          <h2>资产目录</h2>
          <p>检索全部数据表的分类分级标注，点击资产进入字段详情。</p>
        </div>
        <CatalogTable />
      </section>

      <section v-else class="view-section">
        <div class="section-heading">
          <h2>风险处置</h2>
          <p>承接风险概览的定位结果，集中筛选、排序并进入资产详情或血缘关系。</p>
        </div>
        <RiskActionList />
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import ViewTabs from '@/components/ui/ViewTabs.vue'
import CatalogTable from '@/components/catalog/CatalogTable.vue'
import RiskActionList from '@/components/catalog/RiskActionList.vue'
import { DATA_TABLES } from '@/data'

const route = useRoute()
const router = useRouter()
const viewTabs = computed(() => [
  { value: 'catalog', label: '资产目录', count: DATA_TABLES.length },
  { value: 'risk', label: '风险处置', count: DATA_TABLES.filter(table => table.compliance !== '已合规').length },
])
const currentView = computed({
  get: () => route.query.view === 'risk' ? 'risk' : 'catalog',
  set: value => {
    const query = { ...route.query }
    if (value === 'risk') query.view = 'risk'
    else delete query.view
    void router.push({ path: '/catalog', query })
  },
})
const currentViewLabel = computed(() => currentView.value === 'risk' ? '风险处置' : '资产目录')
</script>

<style scoped>
.page { margin: 0 auto; max-width: 88rem; display: flex; flex-direction: column; gap: 1.25rem; }
.page-header, .section-heading { display: flex; flex-direction: column; gap: 0.25rem; }
.page-title { font-size: 1.25rem; font-weight: 600; }
.page-desc, .section-heading p { color: var(--muted-foreground); font-size: 0.875rem; }
.section-heading h2 { font-size: 1rem; font-weight: 600; }
.view-section { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
</style>
