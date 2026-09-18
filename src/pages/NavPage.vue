<template>
  <AppShell :breadcrumbs="[{ label: '数据资产平台', href: '/' }, { label: '导航菜单' }]">
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">数据资产分类分级与合规风险管理平台</h1>
        <p class="page-desc">选择下方任一模块进入对应原型页面。</p>
      </div>

      <section class="about-section">
        <h2 class="about-title">系统说明</h2>
        <p class="about-desc">
          本平台面向企业数据资产的分类分级与合规风险管理，覆盖数据资产总览、数据血缘追踪、合规风险看板与资产目录下钻四大模块。
        </p>
        <dl class="about-grid">
          <div><dt>平台定位</dt><dd>企业数据资产分类分级、血缘追踪与合规风险管理的可视化原型。</dd></div>
          <div><dt>数据来源</dt><dd>演示数据来自本地 SQLite / Mock 接口（GET /api/platform），可在部署配置中切换。</dd></div>
          <div><dt>技术栈</dt><dd>Vue 3 + TypeScript + Vite，ECharts 图表，AntV G6 血缘图。</dd></div>
        </dl>
      </section>

      <div class="nav-grid">
        <router-link
          v-for="p in pages"
          :key="p.code"
          :to="p.href"
          class="nav-card"
        >
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="p.iconPath" />
          </span>
          <div class="nav-info">
            <div class="nav-title-row">
              <span class="nav-code">{{ p.code }}</span>
              <span class="nav-name">{{ p.name }}</span>
              <span :class="['nav-level', p.level === 'P0' ? 'nav-level--p0' : '']">{{ p.level }}</span>
            </div>
            <p class="nav-desc">{{ p.desc }}</p>
          </div>
          <svg class="nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </router-link>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'

const pages = [
  {
    code: 'F1',
    name: '数据总览',
    href: '/',
    level: 'P0',
    desc: '资产概览与风险概览双视图，集中观察平台态势',
    iconPath: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  },
  {
    code: 'F2',
    name: '数据血缘关系图',
    href: '/lineage',
    level: 'P1',
    desc: '分层 DAG，上下游链路高亮与节点溯源',
    iconPath: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>',
  },
  {
    code: 'F3',
    name: '风险看板',
    href: '/risk',
    level: 'P0',
    desc: '综合评分、风险热力图、合规雷达与整改清单，集中呈现合规风险态势',
    iconPath: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  },
  {
    code: 'F4',
    name: '数据资产',
    href: '/catalog',
    level: 'P1',
    desc: '资产目录与风险处置双视图，下钻字段级详情',
    iconPath: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  },
]
</script>

<style scoped>
.page {
  margin: 0 auto;
  max-width: 64rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 600;
}
.page-desc {
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

.about-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 1px solid var(--border);
  border-radius: 0.625rem;
  background: var(--card);
}
.about-title { font-size: 1rem; font-weight: 600; }
.about-desc { font-size: 0.875rem; color: var(--muted-foreground); line-height: 1.625; }
.about-grid { display: grid; gap: 0.75rem; margin: 0; }
@media (min-width: 640px) { .about-grid { grid-template-columns: 1fr 1fr 1fr; } }
.about-grid div { display: flex; flex-direction: column; gap: 0.2rem; }
.about-grid dt { font-size: 0.75rem; font-weight: 500; color: var(--foreground); }
.about-grid dd { margin: 0; font-size: 0.8125rem; color: var(--muted-foreground); line-height: 1.55; }

.nav-grid {
  display: grid;
  gap: 1rem;
}
@media (min-width: 640px) {
  .nav-grid { grid-template-columns: 1fr 1fr; }
}

.nav-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 0.625rem;
  border: 1px solid var(--border);
  background: var(--card);
  text-decoration: none;
  color: inherit;
  transition: all 0.15s;
}
.nav-card:hover {
  border-color: color-mix(in oklab, var(--primary) 40%, transparent);
  background: color-mix(in oklab, var(--accent) 40%, transparent);
}
.nav-icon {
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  background: color-mix(in oklab, var(--primary) 10%, transparent);
  color: var(--primary);
  flex-shrink: 0;
}
.nav-info {
  flex: 1;
  min-width: 0;
}
.nav-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.nav-code {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
}
.nav-name { font-size: 1rem; font-weight: 500; }
.nav-level {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid var(--border);
  padding: 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--muted-foreground);
}
.nav-level--p0 {
  border-color: color-mix(in oklab, var(--chart-1) 40%, transparent);
  color: var(--chart-1);
}
.nav-desc {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--muted-foreground);
}
.nav-arrow {
  margin-top: 0.25rem;
  color: var(--muted-foreground);
  flex-shrink: 0;
  transition: transform 0.15s;
}
.nav-card:hover .nav-arrow {
  transform: translateX(2px);
  color: var(--foreground);
}
</style>
