<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const items = computed(() => {
  if (auth.isLoggedIn.value) {
    return [
      { to: '/events', label: 'Events', key: 'events' },
      { to: '/marketplace', label: 'Marketplace', key: 'marketplace' },
      { to: '/profile', label: 'Profile', key: 'profile' },
    ]
  }
  return [
    { to: '/', label: 'Home', key: 'home' },
    { to: '/events', label: 'Events', key: 'events' },
    { to: '/marketplace', label: 'Marketplace', key: 'marketplace' },
    { to: '/login', label: 'Login', key: 'login' },
  ]
})

const logout = () => {
  auth.clearSession()
  router.push('/login')
}
</script>

<template>
  <header class="nav-wrap">
    <div class="nav glass">
      <RouterLink to="/" class="brand">
        <img src="/logo.svg" alt="TicketRemaster logo" />
        <span>TicketRemaster</span>
      </RouterLink>

      <div class="right-cluster">
        <nav>
          <RouterLink v-for="item in items" :key="item.to" :to="item.to" :class="['nav-link', `nav-${item.key}`]">{{ item.label }}</RouterLink>
          <button v-if="auth.isLoggedIn.value" class="nav-link nav-button nav-logout" @click="logout">Logout</button>
        </nav>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav-wrap{position:sticky;top:0;z-index:80;padding:.8rem 1rem}
.nav{max-width:820px;margin:0 auto;padding:.55rem .8rem;border-radius:2rem;display:flex;align-items:center;gap:.7rem;width:100%}
.brand{display:flex;align-items:center;gap:.45rem;font-weight:800;letter-spacing:-.01em;font-size:.95rem;color:var(--accent)}
.brand img{width:20px;height:20px}
.right-cluster{margin-left:auto;display:flex;align-items:center;gap:.4rem}
nav{display:flex;gap:.28rem;justify-content:flex-end;align-items:center;flex-wrap:wrap}
.nav-link{padding:.38rem .64rem;border-radius:.7rem;color:var(--muted);font-weight:600}
.nav-link.router-link-active{background:rgba(249,115,22,.18);color:#ffd4b7}
.nav-button{border:1px solid transparent;background:transparent}
@media (max-width:1024px){
  .nav-marketplace{display:none}
}
@media (max-width:900px){
  .nav-events{display:none}
}
@media (max-width:760px){
  .nav-home{display:none}
  .nav-profile{display:none}
  .brand span{display:none}
}
@media (max-width:640px){
  .nav{padding:.5rem .65rem}
  .nav-link{padding:.32rem .5rem;font-size:.85rem}
}
@media (max-width:560px){
  .nav-login{display:none}
  .nav-logout{display:none}
  .right-cluster{display:none}
  .nav{justify-content:center}
}
</style>
