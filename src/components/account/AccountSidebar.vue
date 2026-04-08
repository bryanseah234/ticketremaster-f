<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'
import {
  CreditCardIcon,
  PlusIcon,
  QrCodeIcon,
  Squares2X2Icon,
  TicketIcon,
  UserCircleIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useLogout } from '@/composables/useLogout'

const props = defineProps<{
  activeKey: string
  dashboardTo?: string | null
  createTo?: string | null
}>()

const auth = useAuthStore()
const { logout } = useLogout()
const route = useRoute()

const ADMIN_LAST_EVENT_KEY = 'adminLastEventId'

const routeEventId = computed(() => {
  const paramId = typeof route.params.eventId === 'string' ? route.params.eventId : null
  if (paramId) return paramId

  const queryId = typeof route.query.eventId === 'string' ? route.query.eventId : null
  return queryId || null
})

// Persist the most recent eventId so the Dashboard link survives navigation
// to non-event-scoped pages (e.g. /profile)
watch(routeEventId, (id) => {
  if (id) sessionStorage.setItem(ADMIN_LAST_EVENT_KEY, id)
}, { immediate: true })

const resolvedAdminEventId = computed(() => routeEventId.value || sessionStorage.getItem(ADMIN_LAST_EVENT_KEY))

const resolvedProfileTo = computed(() => {
  if (auth.isAdmin && resolvedAdminEventId.value) {
    return `/profile?eventId=${encodeURIComponent(resolvedAdminEventId.value)}`
  }
  return '/profile'
})

const resolvedCreateTo = computed(() => {
  if (!auth.isAdmin) return null
  return props.createTo || '/admin/events/new'
})

const resolvedDashboardTo = computed(() => {
  if (props.dashboardTo) return props.dashboardTo
  const id = resolvedAdminEventId.value
  return id ? `/admin/events/${id}/dashboard` : null
})

const links = computed(() => {
  if (auth.isStaff) {
    return [
      { key: 'profile', to: resolvedProfileTo.value, label: 'Profile', icon: UserCircleIcon },
      { key: 'scanner', to: '/staff/scan', label: 'Scanner', icon: QrCodeIcon },
    ]
  }

  if (auth.isAdmin) {
    return [
      { key: 'profile', to: resolvedProfileTo.value, label: 'Profile', icon: UserCircleIcon },
      ...(resolvedCreateTo.value
        ? [{ key: 'create', to: resolvedCreateTo.value, label: 'Create', icon: PlusIcon }]
        : []),
      ...(resolvedDashboardTo.value
        ? [{ key: 'dashboard', to: resolvedDashboardTo.value, label: 'Dashboard', icon: Squares2X2Icon }]
        : []),
    ]
  }

  return [
    { key: 'profile', to: resolvedProfileTo.value, label: 'Profile', icon: UserCircleIcon },
    { key: 'credits', to: '/credits/topup', label: 'Credits', icon: CreditCardIcon },
    { key: 'tickets', to: '/tickets', label: 'Tickets', icon: TicketIcon },
  ]
})

</script>

<template>
  <aside class="glass account-sidebar">
    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in links"
        :key="item.key"
        :to="item.to"
        class="side-link"
        :class="{ active: item.key === activeKey }"
      >
        <component :is="item.icon" class="side-icon" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <button class="sidebar-logout" type="button" @click="logout">Log Out</button>
  </aside>
</template>

<style scoped>
.account-sidebar {
  position: sticky;
  top: 6.8rem;
  display: grid;
  gap: 1rem;
  padding: 0.7rem;
  border-radius: 1.65rem;
  background: rgba(38, 38, 38, 0.72);
  border-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
}

.sidebar-nav {
  display: grid;
  gap: 0.3rem;
}

.side-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.35rem;
  padding: 0.95rem 1.05rem;
  border-radius: 1.05rem;
  color: var(--textMuted);
  font-weight: 600;
  border: 1px solid transparent;
}

.side-link.active {
  background: rgba(249, 115, 22, 0.14);
  color: var(--primarySoft);
  border: 1px solid rgba(249, 115, 22, 0.18);
  box-shadow: 0 0 22px rgba(249, 115, 22, 0.08);
}

.side-icon {
  width: 1rem;
  height: 1rem;
}

.sidebar-logout {
  width: 100%;
  min-height: 3.35rem;
  background: transparent;
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--text);
  border-radius: 1.05rem;
  font-weight: 700;
}

@media (max-width: 980px) {
  .account-sidebar {
    position: static;
  }
}
</style>
