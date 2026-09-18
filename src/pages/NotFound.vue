<template>
  <AppShell :breadcrumbs="[{ label: '数据资产平台', href: '/' }, { label: '页面不存在' }]">
    <div class="status-page">
      <p class="status-code">404</p>
      <h1 class="status-title">页面不存在</h1>
      <p class="status-desc">你访问的地址不存在或已被移除，请检查链接后重试。</p>
      <router-link to="/" class="status-action">返回首页</router-link>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
</script>

<style scoped>
.status-page {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-align: center;
}
.status-code {
  font-family: var(--font-mono);
  font-size: 4rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--muted-foreground);
}
.status-title { font-size: 1.25rem; font-weight: 600; }
.status-desc { max-width: 26rem; font-size: 0.875rem; color: var(--muted-foreground); }
.status-action {
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  padding: 0 1rem;
  border-radius: var(--radius);
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: opacity 0.15s;
}
.status-action:hover { opacity: 0.9; }
</style>
