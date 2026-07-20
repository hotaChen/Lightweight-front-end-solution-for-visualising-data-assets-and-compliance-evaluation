import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'overview',
      component: () => import('@/pages/OverviewPage.vue'),
    },
    {
      path: '/risk',
      name: 'risk',
      component: () => import('@/pages/RiskPage.vue'),
    },
    {
      path: '/lineage',
      name: 'lineage',
      component: () => import('@/pages/LineagePage.vue'),
    },
    {
      path: '/catalog',
      name: 'catalog',
      component: () => import('@/pages/CatalogPage.vue'),
    },
    {
      path: '/catalog/:id',
      name: 'field-detail',
      component: () => import('@/pages/FieldDetailPage.vue'),
    },
    {
      path: '/design-system',
      name: 'nav',
      component: () => import('@/pages/NavPage.vue'),
    },
  ],
})

export default router
