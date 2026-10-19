<template>
  <router-view v-if="!requiresPlatformData" />
  <div v-else-if="dataLoadState.loading" class="app-state" role="status">
    <span class="loader" />
    <p>正在加载数据资产</p>
  </div>
  <div v-else-if="dataLoadState.error" class="app-state" role="alert">
    <h1>数据加载失败</h1>
    <p>{{ dataLoadState.error }}</p>
    <div class="app-state__actions">
      <button type="button" @click="loadPlatformData(true)">重新加载</button>
      <router-link to="/rag">进入 RAG 调试页</router-link>
    </div>
  </div>
  <router-view v-else />
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { dataLoadState, loadPlatformData } from '@/data'

const route = useRoute()
const requiresPlatformData = computed(() => route.meta.requiresPlatformData !== false)
let platformRequested = false

function ensurePlatformData() {
  if (platformRequested) return
  platformRequested = true
  void loadPlatformData()
}

onMounted(() => {
  if (requiresPlatformData.value) ensurePlatformData()
})

watch(requiresPlatformData, required => {
  if (required) ensurePlatformData()
})
</script>

<style scoped>
.app-state { min-height: 100vh; display: grid; place-content: center; justify-items: center; gap: 0.75rem; padding: 2rem; background: var(--background); color: var(--foreground); text-align: center; }
.app-state h1 { font-size: 1.125rem; font-weight: 600; }
.app-state p { max-width: 32rem; color: var(--muted-foreground); font-size: 0.875rem; }
.app-state__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: .625rem; }
.app-state button,.app-state a { display: inline-flex; min-height: 2.25rem; align-items: center; padding: 0 .875rem; border-radius: var(--radius); font-size: .875rem; }
.app-state button { background: var(--primary); color: var(--primary-foreground); }
.app-state a { border: 1px solid var(--border); background: var(--card); color: var(--foreground); }
.loader { width: 1.75rem; height: 1.75rem; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
