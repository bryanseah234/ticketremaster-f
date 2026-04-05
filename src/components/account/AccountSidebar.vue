<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'
import {
  CreditCardIcon,
  LifebuoyIcon,
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

const routeEventId = computed(() => {
  const paramId = typeof route.params.eventId === 'string' ? route.params.eventId : null
  if (paramId) return paramId

  const queryId = typeof route.query.eventId === 'string' ? route.query.eventId : null
  return queryId || null
})

const resolvedDashboardTo = computed(() => props.dashboardTo || (routeEventId.value ? `/admin/events/${routeEventId.value}/dashboard` : null))

const links = computed(() => {
  if (auth.isStaff) {
    return [
      { key: 'profile', to: '/profile', label: 'Profile', icon: UserCircleIcon },
      { key: 'scanner', to: '/staff/scan', label: 'Scanner', icon: QrCodeIcon },
      { key: 'support', to: '/help', label: 'Support', icon: LifebuoyIcon },
    ]
  }

  if (auth.isAdmin) {
    return [
      { key: 'profile', to: '/profile', label: 'Profile', icon: UserCircleIcon },
      ...(props.createTo
        ? [{ key: 'create', to: props.createTo, label: 'Create', icon: PlusIcon }]
        : []),
      ...(resolvedDashboardTo.value
        ? [{ key: 'dashboard', to: resolvedDashboardTo.value, label: 'Dashboard', icon: Squares2X2Icon }]
        : []),
    ]
  }

  return [
    { key: 'profile', to: '/profile', label: 'Profile', icon: UserCircleIcon },
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
  padding: 0.85rem;
  border-radius: 1.35rem;
  background: rgba(34, 31, 30, 0.84);
}

.sidebar-nav {
  display: grid;
  gap: 0.35rem;
}

.side-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 0.95rem;
  border-radius: 1rem;
  color: var(--textMuted);
  font-weight: 600;
}

.side-link.active {
  background: rgba(249, 115, 22, 0.16);
  color: var(--primarySoft);
  border: 1px solid rgba(249, 115, 22, 0.22);
}

.side-icon {
  width: 1rem;
  height: 1rem;
}

.sidebar-logout {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--text);
}

@media (max-width: 980px) {
  .account-sidebar {
    position: static;
  }
}
</style>
