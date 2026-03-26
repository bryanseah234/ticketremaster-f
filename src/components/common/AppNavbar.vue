<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/client'
import { useSellerNotifications } from '@/composables/useSellerNotifications'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { notifications, dismiss } = useSellerNotifications()
const bellOpen = ref(false)
const balance = ref<number | null>(null)
const balanceLoading = ref(false)
const balanceError = ref(false)
const mobileMenuOpen = ref(false)
let balanceTimer: number | undefined

const items = computed(() => {
  if (auth.isStaff) {
    return [
      { to: '/staff/scan', label: 'Scanner', key: 'scan' },
      { to: '/profile', label: 'Profile', key: 'profile' },
    ]
  }
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
  if (!auth.isLoggedIn || auth.isStaff) {
    balance.value = null
    balanceError.value = false
    return
  }
  balanceLoading.value = true
  balanceError.value = false
  try {
    const { data } = await api.get('/credits/balance')
    const value = data?.data?.creditBalance ?? data?.creditBalance
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

watch(() => auth.isLoggedIn, (loggedIn, wasLoggedIn) => {
  if (loggedIn && !wasLoggedIn) scheduleBalance()
  if (!loggedIn) {
    balance.value = null
    balanceError.value = false
  }
})

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
  if (auth.isLoggedIn) scheduleBalance()
})

const goToTransfer = (transferId: string) => {
  dismiss(transferId)
  bellOpen.value = false
  router.push(`/transfer/${transferId}`)
}

onMounted(() => {
  if (auth.isLoggedIn) scheduleBalance()
})


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

      <!-- Desktop Navigation -->
      <div class="right-cluster desktop-only">
        <RouterLink v-if="auth.isLoggedIn && !auth.isStaff" to="/credits/topup" class="nav-credit">{{ balanceLabel }}</RouterLink>

        <!-- Notification Bell -->
        <div v-if="auth.isLoggedIn" class="bell-wrap">
          <button class="bell-btn" :class="{ 'bell-active': notifications.length }" @click="bellOpen = !bellOpen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span v-if="notifications.length" class="bell-badge">{{ notifications.length }}</span>
          </button>
          <Transition name="dropdown">
            <div v-if="bellOpen" class="bell-dropdown">
              <p v-if="!notifications.length" class="bell-empty">No pending requests</p>
              <button
                v-for="n in notifications"
                :key="n.transferId"
                class="bell-item"
                @click="goToTransfer(n.transferId)"
              >
                <span class="bell-dot" />
                <div>
                  <p class="bell-title">Buyer wants your ticket</p>
                  <p class="bell-sub">${{ n.creditAmount }} · {{ new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</p>
                </div>
              </button>
            </div>
          </Transition>
        </div>

        <nav>
          <RouterLink v-for="item in items" :key="item.to" :to="item.to" :class="['nav-link', `nav-${item.key}`]">{{ item.label }}</RouterLink>
        </nav>
      </div>

      <!-- Mobile Menu Button -->
      <button 
        class="mobile-menu-btn mobile-only" 
        :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
        :class="{ active: mobileMenuOpen }"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- Mobile Navigation Menu -->
    <nav v-if="mobileMenuOpen" class="mobile-menu">
      <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="mobile-nav-link">{{ item.label }}</RouterLink>
      <RouterLink v-if="auth.isLoggedIn" to="/credits/topup" class="mobile-nav-link mobile-credit">{{ balanceLabel }}</RouterLink>
    </nav>
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
  box-shadow: 0 8px 32px -8px rgba(0, 0, 0, 0.5);
  position: relative;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  font-size: 0.95rem;
  color: #fff;
  text-decoration: none;
  white-space: nowrap;
}

.brand span {
  background: linear-gradient(135deg, #fff 0%, #fbd4c2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand img {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.right-cluster {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.nav-credit {
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(251, 146, 60, 0.3);
  color: #fed7aa;
  font-weight: 700;
  font-size: 0.85rem;
  background: rgba(251, 146, 60, 0.08);
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-credit:hover {
  background: rgba(251, 146, 60, 0.15);
  border-color: rgba(251, 146, 60, 0.5);
}

nav {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
}

.nav-link {
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
  display: inline-block;
}

.nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.nav-link.router-link-active {
  background: rgba(249, 115, 22, 0.9);
  color: #fff;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

.nav-button {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.nav-button:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

/* Utility classes */
.desktop-only {
  display: flex !important;
}

.mobile-only {
  display: none !important;
}

/* Mobile Menu Button */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  gap: 0.375rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  margin-left: auto;
  z-index: 1001;
}

.mobile-menu-btn span {
  display: block;
  width: 24px;
  height: 2px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 1px;
  transition: all 0.3s ease;
}

.mobile-menu-btn.active span:nth-child(1) {
  transform: rotate(45deg) translate(8px, 8px);
}

.mobile-menu-btn.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-btn.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
}

/* Mobile Menu */
.mobile-menu {
  position: absolute;
  top: calc(100% + 0.65rem);
  right: 0;
  background: rgba(18, 18, 23, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  display: none;
  flex-direction: column;
  padding: 0.5rem 0;
  pointer-events: auto;
  min-width: 200px;
  box-shadow: 0 8px 32px -8px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.mobile-nav-link {
  padding: 0.6rem 1.25rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  display: block;
  width: 100%;
}

.mobile-nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.mobile-nav-link.router-link-active {
  background: rgba(249, 115, 22, 0.9);
  color: #fff;
}

.mobile-credit {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: #fed7aa;
}

/* Bell */
.bell-wrap {
  position: relative;
}

.bell-btn {
  position: relative;
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 999px;
  padding: .35rem .45rem;
  cursor: pointer;
  color: rgba(255,255,255,.7);
  display: flex;
  align-items: center;
  transition: background .15s;
}
.bell-btn:hover { background: rgba(255,255,255,.12); color: #fff; }
.bell-btn.bell-active { color: #fb923c; border-color: rgba(251,146,60,.4); }

.bell-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: #fff;
  font-size: .6rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
}

.bell-dropdown {
  position: absolute;
  top: calc(100% + .6rem);
  right: 0;
  background: rgba(18,18,23,.97);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: .75rem;
  min-width: 240px;
  padding: .4rem 0;
  box-shadow: 0 16px 40px rgba(0,0,0,.5);
  z-index: 200;
}

.bell-empty {
  padding: .6rem 1rem;
  font-size: .82rem;
  color: rgba(255,255,255,.4);
}

.bell-item {
  width: 100%;
  background: none;
  border: none;
  padding: .6rem 1rem;
  display: flex;
  align-items: flex-start;
  gap: .6rem;
  cursor: pointer;
  text-align: left;
  transition: background .15s;
}
.bell-item:hover { background: rgba(255,255,255,.06); }

.bell-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fb923c;
  flex-shrink: 0;
  margin-top: .3rem;
}

.bell-title {
  font-size: .84rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.bell-sub {
  font-size: .74rem;
  color: rgba(255,255,255,.45);
  margin: .1rem 0 0;
}

.dropdown-enter-active, .dropdown-leave-active { transition: opacity .15s, transform .15s; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }


/* Desktop breakpoint - 1025px and above */
@media (min-width: 1025px) {
  /* Show all desktop navigation */
  .nav-link {
    display: inline-block;
  }
  
  .desktop-only {
    display: flex !important;
  }
  
  .mobile-only {
    display: none !important;
  }
  
  .mobile-menu {
    display: none !important;
  }
  
  .inner {
    max-width: 860px;
  }
}

/* Below desktop - show hamburger menu */
@media (max-width: 1024px) {
  /* Hide desktop navigation */
  .desktop-only {
    display: none !important;
  }
  
  /* Show mobile hamburger and dropdown */
  .mobile-only {
    display: flex !important;
  }
  
  .mobile-menu {
    display: flex;
  }
  
  .nav-link {
    display: none !important;
  }
  
  .inner {
    max-width: 90%;
  }
  
  .brand span {
    display: inline;
  }
}

@media (max-width: 640px) {
  .inner {
    padding: 0.3rem 0.6rem;
    width: calc(100% - 1.2rem);
    margin: 0.75rem 0.6rem;
  }
  
  .brand {
    font-size: 0.85rem;
    gap: 0.3rem;
  }
  
  .brand img {
    width: 20px;
    height: 20px;
  }
  
  .mobile-menu {
    max-width: calc(100vw - 1.2rem);
  }
  
  .mobile-nav-link {
    padding: 0.55rem 1rem;
    font-size: 0.9rem;
  }
  
  .mobile-menu-btn {
    padding: 0.35rem;
  }
  
  .mobile-menu-btn span {
    width: 20px;
    height: 2px;
  }
}

@media (max-width: 480px) {
  .inner {
    padding: 0.25rem 0.5rem;
    width: calc(100% - 1rem);
    margin: 0.75rem 0.5rem;
  }
  
  .brand {
    font-size: 0.8rem;
    gap: 0.25rem;
  }
  
  .brand img {
    width: 18px;
    height: 18px;
  }
  
  .mobile-menu {
    max-width: calc(100vw - 1rem);
  }
  
  .mobile-nav-link {
    padding: 0.5rem 0.9rem;
    font-size: 0.85rem;
  }
}
</style>
