<script setup lang="ts">
import { onMounted, isRef, computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  BellIcon,
  CheckCircleIcon,
  TagIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'
import { useSellerNotifications } from '@/composables/useSellerNotifications'

const { notifications, checkNotifications, dismiss } = useSellerNotifications()

// Normalize notifications: handle both real Vue computed refs and plain mock objects
const notifList = computed<any[]>(() => {
  if (isRef(notifications)) return (notifications as any).value
  const n = notifications as any
  if (Array.isArray(n?.value)) return n.value
  if (Array.isArray(n)) return n
  return []
})

onMounted(() => {
  checkNotifications()
})

type NotificationType = 'transfer_request' | 'topup_success' | 'ticket_sold' | 'hold_expiring'

interface NotificationMeta {
  icon: typeof BellIcon
  colorClass: string
  label: string
}

function getNotificationMeta(type: NotificationType | string): NotificationMeta {
  switch (type) {
    case 'topup_success':
      return { icon: CheckCircleIcon, colorClass: 'color-green', label: 'Top-up Success' }
    case 'ticket_sold':
      return { icon: TagIcon, colorClass: 'color-primary', label: 'Ticket Sold' }
    case 'hold_expiring':
      return { icon: ClockIcon, colorClass: 'color-amber', label: 'Hold Expiring' }
    case 'transfer_request':
    default:
      return { icon: BellIcon, colorClass: 'color-primary', label: 'Transfer Request' }
  }
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
</script>

<template>
  <section class="page notifications-page">
    <div class="page-head">
      <div>
        <span class="badge">Notifications</span>
        <h1 class="section-title">Stay on top of transfer requests and account activity.</h1>
        <p class="section-subtitle">Review pending seller actions and jump directly into the related transfer flow.</p>
      </div>
      <button class="secondary" @click="checkNotifications">Refresh</button>
    </div>

    <article v-if="notifList.length === 0" class="glass empty-state">
      <span class="badge">All clear</span>
      <h2>No pending notifications</h2>
      <p class="small muted">You'll see transfer requests and seller-related activity appear here.</p>
    </article>

    <div v-else class="notification-list">
      <article
        v-for="item in notifList"
        :key="item.transferId"
        class="glass notification-card"
      >
        <!-- Clause 1.16: left-edge accent bar -->
        <div class="notification-accent-bar" aria-hidden="true"></div>

        <!-- Clause 1.18: icon avatar shell -->
        <div class="icon-avatar-shell">
          <component
            :is="getNotificationMeta((item as any).type).icon"
            class="notif-icon"
            :style="{ color: getNotificationMeta((item as any).type).colorClass === 'color-green' ? '#37d080' : getNotificationMeta((item as any).type).colorClass === 'color-amber' ? '#f6b15d' : 'var(--primary, #f97316)' }"
          />
        </div>

        <div class="notification-body">
          <!-- Clause 1.19: notification-header with timestamp -->
          <div class="notification-header">
            <!-- Clause 1.17: type-aware badge label -->
            <span class="badge">{{ getNotificationMeta((item as any).type).label }}</span>
            <span class="notification-timestamp">{{ formatRelativeTime(item.createdAt) }}</span>
          </div>

          <div class="notification-main">
            <h2>{{ getNotificationMeta((item as any).type).label }}</h2>
            <p class="small muted">Transfer ID: {{ item.transferId }}</p>
            <p class="small muted">Credits involved: ${{ item.creditAmount }}</p>
          </div>

          <div class="notification-actions">
            <RouterLink :to="`/transfer/${item.transferId}`"><button>Open transfer</button></RouterLink>
            <button class="secondary" @click="dismiss(item.transferId)">Dismiss</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.notifications-page {
  display: grid;
  gap: 1.25rem;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.empty-state {
  padding: 1.4rem;
  display: grid;
  gap: 0.8rem;
}

/* Clause 1.16: position relative + overflow hidden for accent bar */
/* Clause 1.18: flex layout for icon avatar shell */
.notification-card {
  padding: 1.4rem 1.4rem 1.4rem 1.8rem;
  position: relative;
  overflow: hidden;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

/* Clause 1.16: left-edge accent bar */
.notification-accent-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0.25rem;
  background: linear-gradient(to bottom, var(--primary, #f97316), rgba(249, 115, 22, 0.3));
  border-radius: 999px 0 0 999px;
}

/* Clause 1.18: icon avatar shell */
.icon-avatar-shell {
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.10);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notif-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.notification-body {
  flex: 1;
  display: grid;
  gap: 0.8rem;
  min-width: 0;
}

/* Clause 1.19: notification header with timestamp */
.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

/* Clause 1.19: styled timestamp label */
.notification-timestamp {
  font-size: 0.68rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-left: auto;
  white-space: nowrap;
}

.notification-list {
  display: grid;
  gap: 1rem;
}

.notification-main {
  display: grid;
  gap: 0.55rem;
}

.notification-main h2 {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: 1.3rem;
}

.notification-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>
