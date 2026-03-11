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
  <header class="header glass">
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
  position: sticky;
  top: 0;
  z-index: 80;
  width: 100%;
  border-radius: 0;
  border-top: none;
  border-left: none;
  border-right: none;
  padding: 0.6rem 0;
  background: rgba(11, 11, 14, 0.72);
  backdrop-filter: blur(20px);
}
.inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.brand{display:flex;align-items:center;gap:.45rem;font-weight:800;letter-spacing:-.01em;font-size:.95rem;color:var(--accent)}
.brand img{width:24px;height:24px}
.right-cluster{margin-left:auto;display:flex;align-items:center;gap:.6rem}
.nav-credit{padding:.35rem .6rem;border-radius:.7rem;border:1px solid rgba(251,146,60,.35);color:#fed7aa;font-weight:700;font-size:0.9rem}
nav{display:flex;gap:.35rem;justify-content:flex-end;align-items:center}
.nav-link{padding:.4rem .75rem;border-radius:.7rem;color:var(--muted);font-weight:600;font-size:0.925rem;transition: all 0.2s ease;}
.nav-link:hover { color: #fff; background: rgba(255,255,255,0.05); }
.nav-link.router-link-active{background:rgba(249,115,22,.15);color:#fed7aa}
.nav-button{border:none;background:transparent;cursor:pointer}
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
  .inner { padding: 0 1rem; }
  .nav-link{padding:.32rem .5rem;font-size:.85rem}
}
@media (max-width:560px){
  .nav-login{display:none}
  .nav-logout{display:none}
  .right-cluster{display:none}
  .nav{justify-content:center}
}
</style>
