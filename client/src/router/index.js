import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

import store from '@/store'

const routes = [
  { path: '/', component: HomeView },
  { path: '/explore', component: () => import('../views/Explore.vue') },
  { path: '/create', component: () => import('../views/Create.vue') },
  { path: '/u/:id', component: () => import('../views/Profile.vue') },
  { path: '/settings', component: () => import('../views/Settings.vue') },
  { path: '/login', component: Login },
  { path: '/register', component: Register },

  // direcciones anteriores
  { path: '/profile', redirect: () => `/u/${store.getters.loggedId}` },
  { path: '/upload', redirect: '/create' },
  { path: '/post/:id', redirect: to => ({ path: '/', query: { post: to.params.id } }) }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, saved) {
    // abrir o cerrar una publicacion no mueve la pagina
    if (to.path === from.path) return false
    return saved || { top: 0 }
  }
})

const protectedRoutes = ['/create', '/settings', '/profile']

router.beforeEach((to, from, next) => {
  if (protectedRoutes.includes(to.path) && !store.getters.token)
    next('/login')
  else
    next()
})

export default router
