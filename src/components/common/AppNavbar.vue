<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/client'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const balance = ref<number | null>(null)
const balanceLoading = ref(false)
const balanceError = ref(false)
let balanceTimer: number | undefined

const items = computed(() => {
  if (auth.isLoggedIn) {
    return [
      { to: '/', label: 'Home', key: 'home' },
      { to: '/events', label: 'Events', key: 'events' },
      { to: '/marketplace', label: 'Marketplace', key: 'marketplace' },
      { to: '/tickets', label: 'My Tickets', key: 'tickets' },
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

const fetchBalance = async () => {
  if (!auth.isLoggedIn) {
    balance.value = null
    balanceError.value = false
    return
  }
  balanceLoading.value = true
  balanceError.value = false
  try {
    const { data } = await api.get('/credits/balance')
    const value = data?.data?.credit_balance ?? data?.credit_balance
    balance.value = typeof value === 'number' ? value : null
  } catch {
    balanceError.value = true
  } finally {
    balanceLoading.value = false
  }
}

const scheduleBalance = () => {
  if (balanceTimer) window.clearTimeout(balanceTimer)
  balanceTimer = window.setTimeout(fetchBalance, 250)
}

watch([() => auth.isLoggedIn, () => route.fullPath], () => {
  if (!auth.isLoggedIn) {
    balance.value = null
    balanceError.value = false
    return
  }
  scheduleBalance()
}, { immediate: true })

onMounted(() => {
  if (auth.isLoggedIn) scheduleBalance()
})

const logout = () => {
  auth.clearSession()
  router.push('/login')
}

const balanceLabel = computed(() => {
  if (!auth.isLoggedIn) return ''
  if (balanceLoading.value) return 'Credits: ...'
  if (balanceError.value) return 'Credits: --'
  if (balance.value === null) return 'Credits: --'
  return `Credits: $${balance.value}`
})
</script>

<template>
  <header class="header">
    <div class="inner">
      <RouterLink to="/" class="brand">
        <img src="/logo.svg" alt="TicketRemaster logo" />
        <span>TicketRemaster</span>
      </RouterLink>

      <div class="right-cluster">
        <RouterLink v-if="auth.isLoggedIn" to="/credits/topup" class="nav-credit">{{ balanceLabel }}</RouterLink>
        <nav>
          <RouterLink v-for="item in items" :key="item.to" :to="item.to" :class="['nav-link', `nav-${item.key}`]">{{ item.label }}</RouterLink>
          <button v-if="auth.isLoggedIn" class="nav-link nav-button nav-logout" @click="logout">Logout</button>
        </nav>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0.75rem;
  left: 0;
  right: 0;
  z-index: 100;
  pointer-events: none;
  background: transparent;
  backdrop-filter: none;
  border: none;
}
.inner {
  pointer-events: auto;
  max-width: 860px;

  margin: 0 auto;
  padding: 0.35rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(18, 18, 23, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  box-shadow: 0 8px 32px -8px rgba(0,0,0,0.5);
}
.brand{display:flex;align-items:center;gap:.45rem;font-weight:800;letter-spacing:-.01em;font-size:.95rem;color:#fff}
.brand span{background: linear-gradient(135deg, #fff 0%, #fbd4c2 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;}
.brand img{width:22px;height:22px}
.right-cluster{margin-left:auto;display:flex;align-items:center;gap:.6rem}
.nav-credit{padding:.35rem .6rem;border-radius:999px;border:1px solid rgba(251,146,60,.3);color:#fed7aa;font-weight:700;font-size:0.85rem; background: rgba(251,146,60,0.08)}
nav{display:flex;gap:.25rem;justify-content:flex-end;align-items:center}
.nav-link{padding:.4rem .85rem;border-radius:999px;color:rgba(255,255,255,0.7);font-weight:600;font-size:0.9rem;transition: all 0.2s ease;}
.nav-link:hover { color: #fff; background: rgba(255,255,255,0.08); }
.nav-link.router-link-active{background:rgba(249,115,22,0.9);color:#fff; box-shadow: 0 4px 12px rgba(249,115,22,0.3)}
.nav-button{border:none;background:transparent;cursor:pointer}
@media (max-width:1100px){
  .inner { max-width: 90%; }
}
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
  .inner { padding: 0.4rem 0.8rem; width: 94%; }
  .nav-link{padding:.35rem .6rem;font-size:.825rem}
}
@media (max-width:560px){
  .nav-login{display:none}
  .nav-logout{display:none}
  .right-cluster{display:none}
  .nav{justify-content:center}
}
</style>
