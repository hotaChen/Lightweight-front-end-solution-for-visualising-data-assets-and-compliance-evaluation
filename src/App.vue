<template>
  <div v-if="dataLoadState.loading" class="app-state" role="status">
    <span class="loader" />
    <p>正在加载数据资产</p>
  </div>
  <div v-else-if="dataLoadState.error" class="app-state" role="alert">
    <h1>数据加载失败</h1>
    <p>{{ dataLoadState.error }}</p>
    <button type="button" @click="loadPlatformData(true)">重新加载</button>
  </div>
  <router-view v-else />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { dataLoadState, loadPlatformData } from '@/data'

onMounted(() => loadPlatformData())
</script>

<style scoped>
.app-state { min-height: 100vh; display: grid; place-content: center; justify-items: center; gap: 0.75rem; padding: 2rem; background: var(--background); color: var(--foreground); text-align: center; }
.app-state h1 { font-size: 1.125rem; font-weight: 600; }
.app-state p { max-width: 32rem; color: var(--muted-foreground); font-size: 0.875rem; }
.app-state button { min-height: 2.25rem; padding: 0 0.875rem; border-radius: var(--radius); background: var(--primary); color: var(--primary-foreground); font-size: 0.875rem; }
.loader { width: 1.75rem; height: 1.75rem; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
