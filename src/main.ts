import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('./views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/',
      name: 'home',
      component: () => import('./views/HomeView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// 创建Pinia实例
const pinia = createPinia()
const app = createApp(App)

// 注册Pinia
app.use(pinia)

// 路由守卫（在Pinia注册后设置）
router.beforeEach(async (to, from, next) => {
  // 动态导入authStore以避免循环依赖
  const { useAuthStore } = await import('@/stores/authStore')
  const authStore = useAuthStore()
  
  // 初始化认证状态
  authStore.initialize()
  
  const isAuthenticated = authStore.isAuthenticated && authStore.isSessionValid
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  
  if (requiresAuth && !isAuthenticated) {
    // 需要登录但未登录，跳转到登录页
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (requiresGuest && isAuthenticated) {
    // 需要访客状态但已登录，跳转到首页
    next({ name: 'home' })
  } else {
    // 正常访问
    next()
  }
})

// 注册路由
app.use(router)
app.mount('#app')
