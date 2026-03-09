<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const balance = ref<number | null>(null)
const balanceError = ref('')
let balanceTimer: number | undefined

const loadBalance = async () => {
  if (!auth.isLoggedIn.value) {
    balance.value = null
    return
  }
  try {
    const { data } = await api.get('/credits/balance')
    balance.value = data?.data?.credit_balance ?? 0
    balanceError.value = ''
  } catch {
    balanceError.value = 'Unable to load credits.'
  }
}

const items = computed(() => {
  const base = [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Events' },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/login', label: auth.isLoggedIn.value ? 'Account' : 'Login' },
  ]
  return auth.isLoggedIn.value
    ? [{ to: '/', label: 'Home' }, { to: '/events', label: 'Events' }, { to: '/marketplace', label: 'Marketplace' }, { to: '/tickets', label: 'My Tickets' }, { to: '/profile', label: 'Profile' }]
    : base
})

const logout = () => {
  auth.clearSession()
  router.push('/login')
}

onMounted(loadBalance)

watch(() => auth.isLoggedIn.value, (loggedIn) => {
  if (loggedIn) loadBalance()
  else balance.value = null
})

watch(() => route.fullPath, () => {
  if (!auth.isLoggedIn.value) return
  if (balanceTimer) window.clearTimeout(balanceTimer)
  balanceTimer = window.setTimeout(loadBalance, 350)
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
        <nav>
          <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="nav-link">{{ item.label }}</RouterLink>
          <RouterLink to="/design" class="nav-link">Design</RouterLink>
        </nav>
        <span v-if="auth.isLoggedIn.value && balance !== null" class="badge">Credits: {{ balance }}</span>
        <span v-if="auth.isLoggedIn.value && balanceError" class="small" style="color:#fca5a5">{{ balanceError }}</span>
        <button v-if="auth.isLoggedIn.value" class="secondary small-btn" @click="logout">Logout</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav-wrap{position:sticky;top:0;z-index:80;padding:.8rem 1rem}
.nav{max-width:820px;margin:0 auto;padding:.55rem .8rem;border-radius:2rem;display:flex;align-items:center;gap:.7rem}
.brand{display:flex;align-items:center;gap:.45rem;font-weight:800;letter-spacing:-.01em;font-size:.95rem}
.brand img{width:20px;height:20px}
.right-cluster{margin-left:auto;display:flex;align-items:center;gap:.4rem}
nav{display:flex;gap:.28rem;justify-content:flex-end}
.nav-link{padding:.38rem .64rem;border-radius:.7rem;color:var(--muted);font-weight:600}
.nav-link.router-link-active{background:rgba(249,115,22,.18);color:#ffd4b7}
.small-btn{padding:.38rem .56rem;font-size:.8rem}
@media (max-width:760px){
  .brand span{display:none}
}
</style>
