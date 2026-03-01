import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import Profile from './pages/Profile.vue'
import Events from './pages/Events.vue'
import Marketplace from './pages/Marketplace.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/profile', component: Profile },
  { path: '/events', component: Events },
  { path: '/marketplace', component: Marketplace }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
