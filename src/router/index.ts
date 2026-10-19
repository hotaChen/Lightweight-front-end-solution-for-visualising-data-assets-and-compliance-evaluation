import { createRouter, createWebHistory } from 'vue-router'
import { dataLoadState, getTableById } from '@/data'
import { currentRole, type Role } from '@/router/role'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'overview',
      component: () => import('@/pages/OverviewPage.vue'),
      meta: { title: '数据资产总览' },
    },
    {
      path: '/risk',
      name: 'risk',
      component: () => import('@/pages/RiskPage.vue'),
      meta: { title: '合规风险看板' },
    },
    {
      path: '/lineage',
      name: 'lineage',
      component: () => import('@/pages/LineagePage.vue'),
      meta: { title: '数据血缘关系图' },
    },
    {
      path: '/catalog',
      name: 'catalog',
      component: () => import('@/pages/CatalogPage.vue'),
      meta: { title: '数据资产目录' },
    },
    {
      path: '/catalog/:id',
      name: 'field-detail',
      component: () => import('@/pages/FieldDetailPage.vue'),
      meta: { title: '字段详情' },
    },
    {
      path: '/design-system',
      name: 'nav',
      component: () => import('@/pages/NavPage.vue'),
      meta: { title: '导航菜单' },
    },
    {
      path: '/rag',
      name: 'rag',
      component: () => import('@/pages/RagPage.vue'),
      meta: { title: 'RAG 智能分类', requiresPlatformData: false },
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/pages/Forbidden.vue'),
      meta: { title: '无权访问' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFound.vue'),
      meta: { title: '页面不存在' },
    },
  ],
})

router.beforeEach((to) => {
  if (to.name === 'field-detail' && !dataLoadState.loading) {
    if (!getTableById(to.params.id as string)) return { name: 'catalog' }
  }
  const roles = to.meta.roles as Role[] | undefined
  if (roles && roles.length > 0 && !roles.includes(currentRole())) return { name: 'forbidden' }
  document.title = typeof to.meta.title === 'string' ? `${to.meta.title} · 数据资产平台` : '数据资产平台'
})

export default router
