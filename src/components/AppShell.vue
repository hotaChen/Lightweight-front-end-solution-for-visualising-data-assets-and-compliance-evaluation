<template>
  <div class="app-layout">
    <aside class="app-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        </div>
        <div class="sidebar-brand">
          <span class="sidebar-title">数据资产平台</span>
          <span class="sidebar-subtitle">分类分级 · 合规管理</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <span class="nav-label">功能模块</span>
        <router-link
          v-for="item in navItems"
          :key="item.href"
          :to="item.href"
          :class="['nav-item', { 'nav-item--active': isActive(item.href) }]"
        >
          <component :is="item.icon" class="nav-icon" />
          <span>{{ item.title }}</span>
          <span class="nav-code">{{ item.code }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-avatar">合规</div>
        <div class="sidebar-user">
          <span class="user-name">合规审计员</span>
          <span class="user-email">demo@datagov.cn</span>
        </div>
      </div>
    </aside>

    <div class="app-main">
      <header class="app-header">
        <button class="header-trigger" @click="sidebarOpen = !sidebarOpen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
        </button>
        <span class="header-sep" />
        <nav class="header-breadcrumb">
          <template v-for="(b, i) in breadcrumbs" :key="i">
            <svg v-if="i > 0" class="breadcrumb-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            <router-link v-if="b.href" :to="b.href" class="breadcrumb-link">{{ b.label }}</router-link>
            <span v-else :class="['breadcrumb-current', { 'breadcrumb-last': i === breadcrumbs.length - 1 }]">{{ b.label }}</span>
          </template>
        </nav>
        <span class="header-clock">{{ now }}</span>
        <div v-if="$slots.actions" class="header-actions">
          <slot name="actions" />
        </div>
      </header>
      <main class="app-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { useRoute } from 'vue-router'
import { useClock } from '@/utils/clock'

export interface Breadcrumb {
  label: string
  href?: string
}

defineProps<{ breadcrumbs: Breadcrumb[] }>()

const route = useRoute()
const sidebarOpen = ref(true)
const { now } = useClock()

const navItems = [
  { title: '导航菜单', href: '/design-system', code: 'F0', icon: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', innerHTML: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>' }) },
  { title: '数据资产总览', href: '/', code: 'F1', icon: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', innerHTML: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>' }) },
  { title: '合规风险看板', href: '/risk', code: 'F3', icon: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', innerHTML: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' }) },
  { title: '数据血缘关系图', href: '/lineage', code: 'F2', icon: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', innerHTML: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>' }) },
  { title: '数据资产目录', href: '/catalog', code: 'F5', icon: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', innerHTML: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>' }) },
]

function isActive(href: string) {
  if (href === '/') return route.path === '/'
  return route.path.startsWith(href)
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.app-sidebar {
  width: 16rem;
  min-width: 16rem;
  height: 100vh;
  position: sticky;
  top: 0;
  background: var(--sidebar-background);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
}
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--sidebar-border);
}
.sidebar-logo {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  background: var(--sidebar-primary);
  color: var(--sidebar-primary-foreground);
  flex-shrink: 0;
}
.sidebar-brand {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.sidebar-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--sidebar-foreground);
}
.sidebar-subtitle {
  font-size: 0.75rem;
  color: color-mix(in oklab, var(--sidebar-foreground) 60%, transparent);
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  overflow: auto;
}
.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: color-mix(in oklab, var(--sidebar-foreground) 50%, transparent);
  padding: 0.25rem 0.5rem;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  color: var(--sidebar-foreground);
  transition: background 0.15s;
  text-decoration: none;
}
.nav-item:hover {
  background: var(--sidebar-accent);
}
.nav-item--active {
  background: var(--sidebar-accent);
  color: var(--sidebar-accent-foreground);
  font-weight: 500;
}
.nav-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
.nav-code {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: color-mix(in oklab, var(--sidebar-foreground) 40%, transparent);
}

/* Footer */
.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.375rem 0.5rem;
  border-top: 1px solid var(--sidebar-border);
}
.sidebar-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius);
  background: var(--sidebar-accent);
  color: var(--sidebar-accent-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
}
.sidebar-user {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.user-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--sidebar-foreground);
}
.user-email {
  font-size: 0.6875rem;
  color: color-mix(in oklab, var(--sidebar-foreground) 50%, transparent);
}

/* Main */
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Header */
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 3.5rem;
  padding: 0 1rem;
  background: color-mix(in oklab, var(--background) 80%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}
.header-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius);
  color: var(--muted-foreground);
}
.header-trigger:hover {
  background: var(--accent);
  color: var(--foreground);
}
.header-sep {
  width: 1px;
  height: 1rem;
  background: var(--border);
  margin: 0 0.25rem;
}
.header-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
}
.breadcrumb-link {
  color: var(--muted-foreground);
  transition: color 0.15s;
}
.breadcrumb-link:hover {
  color: var(--foreground);
}
.breadcrumb-current {
  color: var(--foreground);
}
.breadcrumb-last {
  font-weight: 500;
}
.breadcrumb-chevron {
  color: var(--muted-foreground);
  flex-shrink: 0;
}
.header-clock {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted-foreground);
  margin-left: auto;
  white-space: nowrap;
}
.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Content */
.app-content {
  flex: 1;
  overflow: auto;
  background: var(--background);
  padding: 1rem;
}
@media (min-width: 768px) {
  .app-content {
    padding: 1.5rem;
  }
}
</style>
