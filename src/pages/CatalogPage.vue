<template>
  <AppShell :breadcrumbs="[{ label: '数据资产平台', href: '/' }, { label: '数据资产目录' }]">
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">数据资产目录</h1>
        <p class="page-desc">检索并浏览全部数据表的分类分级标注，点击下钻至字段详情</p>
      </div>
      <CatalogTable />
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import CatalogTable from '@/components/catalog/CatalogTable.vue'
</script>

<style scoped>
.page {
  margin: 0 auto;
  max-width: 80rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.page-header { display: flex; flex-direction: column; gap: 0.25rem; }
.page-title { font-size: 1.25rem; font-weight: 600; letter-spacing: -0.025em; }
.page-desc { font-size: 0.875rem; color: var(--muted-foreground); }
</style>
