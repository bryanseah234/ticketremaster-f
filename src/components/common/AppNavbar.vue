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
  if (auth.isLoggedIn.value) {
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
  if (!auth.isLoggedIn.value) {
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

watch([() => auth.isLoggedIn.value, () => route.fullPath], () => {
  if (!auth.isLoggedIn.value) {
    balance.value = null
    balanceError.value = false
    return
  }
  scheduleBalance()
}, { immediate: true })

onMounted(() => {
  if (auth.isLoggedIn.value) scheduleBalance()
})

const logout = () => {
  auth.clearSession()
  router.push('/login')
}

const balanceLabel = computed(() => {
  if (!auth.isLoggedIn.value) return ''
  if (balanceLoading.value) return 'Credits: ...'
  if (balanceError.value) return 'Credits: --'
  if (balance.value === null) return 'Credits: --'
  return `Credits: $${balance.value}`
})
</script>

<template>
  <header class="nav-wrap">
    <div class="nav glass">
      <RouterLink to="/" class="brand">
        <img src="/logo.svg" alt="TicketRemaster logo" />
        <span>TicketRemaster</span>
      </RouterLink>

      <div class="right-cluster">
        <RouterLink v-if="auth.isLoggedIn.value" to="/credits/topup" class="nav-credit">{{ balanceLabel }}</RouterLink>
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
.nav-credit{padding:.35rem .6rem;border-radius:.7rem;border:1px solid rgba(251,146,60,.35);color:#fed7aa;font-weight:700}
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
