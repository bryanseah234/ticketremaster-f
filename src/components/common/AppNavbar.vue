<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/client'
import { useSellerNotifications } from '@/composables/useSellerNotifications'
import { isDemoMode } from '@/services/mockData'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { notifications, checkNotifications } = useSellerNotifications()

const balance = ref<number | null>(null)
const balanceLoading = ref(false)
const mobileMenuOpen = ref(false)
let balanceTimer: number | undefined

const items = computed(() => {
  if (auth.isStaff) {
    return [
      { to: '/staff/scan', label: 'Scanner' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/profile', label: 'Profile' },
    ]
  }
  if (auth.isAdmin) {
    return [
      { to: '/', label: 'Home' },
      { to: '/events', label: 'Events' },
      { to: '/help', label: 'Support' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/admin/events/new', label: 'Create Event' },
      { to: '/admin/events/demo-event-001/dashboard', label: 'Dashboard' },
      { to: '/profile', label: 'Profile' },
    ]
  }
  if (auth.isLoggedIn) {
    return [
      { to: '/', label: 'Home' },
      { to: '/events', label: 'Events' },
      { to: '/marketplace', label: 'Marketplace' },
      { to: '/tickets', label: 'My Tickets' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/profile', label: 'Profile' },
    ]
  }
  return [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Events' },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/help', label: 'Support' },
    { to: '/login', label: 'Login' },
  ]
})

const fetchBalance = async () => {
  if (!auth.isLoggedIn || auth.isStaff || auth.isAdmin) {
    balance.value = null
    return
  }
  balanceLoading.value = true
  try {
    if (isDemoMode()) {
      const stored = sessionStorage.getItem('demo_balance')
      balance.value = stored !== null ? parseFloat(stored) : 500
      return
    }
    const { data } = await api.get('/credits/balance')
    const value = data?.data?.creditBalance ?? data?.creditBalance
    balance.value = typeof value === 'number' ? value : null
  } catch {
    balance.value = null
  } finally {
    balanceLoading.value = false
  }
}

const scheduleBalance = () => {
  if (balanceTimer) clearTimeout(balanceTimer)
  balanceTimer = window.setTimeout(fetchBalance, 250)
}

const balanceLabel = computed(() => {
  if (!auth.isLoggedIn || auth.isStaff || auth.isAdmin) return null
  if (balanceLoading.value) return 'Credits ...'
  if (balance.value === null) return 'Credits --'
  return `Credits $${balance.value}`
})

watch(() => auth.isLoggedIn, () => {
  if (auth.isLoggedIn) {
    scheduleBalance()
    checkNotifications()
  }
})

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
})

onMounted(() => {
  if (auth.isLoggedIn) {
    scheduleBalance()
    checkNotifications()
  }
})

const logout = () => {
  auth.clearSession()
  router.push('/login')
}
</script>

<template>
  <header class="header">
    <div class="shell">
      <RouterLink to="/" class="brand">
        <img src="/logo.svg" alt="TicketRemaster logo" />
        <div>
          <strong>TicketRemaster</strong>
          <span>Verified resale, elevated live experiences.</span>
        </div>
      </RouterLink>

      <button class="menu-toggle mobile-only" :class="{ active: mobileMenuOpen }" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Toggle navigation">
        <span></span>
        <span></span>
      </button>

      <div class="nav-cluster desktop-only">
        <RouterLink v-if="balanceLabel" to="/credits/topup" class="credit-pill">{{ balanceLabel }}</RouterLink>
        <RouterLink v-if="auth.isLoggedIn" to="/notifications" class="notify-pill">
          Notifications
          <span v-if="notifications.length">{{ notifications.length }}</span>
        </RouterLink>
        <span v-if="isDemoMode()" class="badge">Demo</span>
        <nav class="nav-list">
          <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="nav-link">{{ item.label }}</RouterLink>
          <button v-if="auth.isLoggedIn" class="ghost nav-logout" @click="logout">Logout</button>
        </nav>
      </div>
    </div>

    <nav v-if="mobileMenuOpen" class="mobile-menu glass">
      <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="mobile-link">{{ item.label }}</RouterLink>
      <RouterLink v-if="balanceLabel" to="/credits/topup" class="mobile-link">{{ balanceLabel }}</RouterLink>
      <RouterLink v-if="auth.isLoggedIn" to="/notifications" class="mobile-link">
        Notifications<span v-if="notifications.length"> ({{ notifications.length }})</span>
      </RouterLink>
      <button v-if="auth.isLoggedIn" class="ghost mobile-logout" @click="logout">Logout</button>
    </nav>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0.9rem 0.75rem 0;
}

.shell {
  width: min(1240px, 100%);
  margin: 0 auto;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--outlineSoft);
  border-radius: var(--radius-pill);
  background: rgba(60, 51, 49, 0.58);
  backdrop-filter: blur(14px);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.brand img {
  width: 2rem;
  height: 2rem;
}

.brand strong {
  display: block;
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: 0.95rem;
  color: var(--text);
}

.brand span {
  display: block;
  font-size: 0.72rem;
  color: var(--textMuted);
}

.nav-cluster {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-left: auto;
}

.credit-pill,
.notify-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--outlineSoft);
  background: rgba(60, 51, 49, 0.72);
  color: var(--textMuted);
  font-size: 0.82rem;
}

.notify-pill span {
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(249, 115, 22, 0.18);
  color: var(--primarySoft);
  font-size: 0.7rem;
  font-weight: 700;
}

.nav-list {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.nav-link {
  padding: 0.55rem 0.9rem;
  border-radius: var(--radius-pill);
  color: var(--textMuted);
  font-size: 0.88rem;
  font-weight: 600;
}

.nav-link.router-link-active {
  background: rgba(249, 115, 22, 0.14);
  color: var(--primarySoft);
}

.nav-logout {
  padding-inline: 0.9rem;
}

.menu-toggle {
  display: none;
  width: 2.75rem;
  height: 2.75rem;
  margin-left: auto;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--outlineSoft);
  background: rgba(60, 51, 49, 0.72);
  position: relative;
}

.menu-toggle span {
  position: absolute;
  left: 0.8rem;
  right: 0.8rem;
  height: 2px;
  background: var(--text);
}

.menu-toggle span:first-child {
  top: 1rem;
}

.menu-toggle span:last-child {
  top: 1.5rem;
}

.mobile-menu {
  width: min(1240px, calc(100% - 1.5rem));
  margin: 0.6rem auto 0;
  padding: 0.8rem;
  display: grid;
  gap: 0.45rem;
}

.mobile-link,
.mobile-logout {
  padding: 0.75rem 0.9rem;
  border-radius: var(--radius-md);
}

.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

@media (max-width: 1080px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: inline-flex;
  }

  .brand span {
    display: none;
  }
}
</style>
