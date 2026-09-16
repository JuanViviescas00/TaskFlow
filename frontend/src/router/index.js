import { createRouter, createWebHistory } from 'vue-router'

// Rutas (doc §3.6)
const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
  { path: '/solicitudes', name: 'solicitudes', component: () => import('../views/RequestsView.vue') },
  { path: '/solicitudes/nueva', name: 'nueva', component: () => import('../views/NewRequestView.vue') },
  { path: '/solicitudes/:id', name: 'detalle', component: () => import('../views/RequestDetailView.vue') },
  { path: '/monitor', name: 'monitor', component: () => import('../views/MonitorView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
