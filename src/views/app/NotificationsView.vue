<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSellerNotifications } from '@/composables/useSellerNotifications'

const { notifications, checkNotifications, dismiss } = useSellerNotifications()

onMounted(() => {
  checkNotifications()
})
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

    <article v-if="notifications.length === 0" class="glass empty-state">
      <span class="badge">All clear</span>
      <h2>No pending notifications</h2>
      <p class="small muted">You’ll see transfer requests and seller-related activity appear here.</p>
    </article>

    <div v-else class="notification-list">
      <article v-for="item in notifications" :key="item.transferId" class="glass notification-card">
        <div class="notification-main">
          <span class="badge">Transfer request</span>
          <h2>Buyer wants your ticket</h2>
          <p class="small muted">Transfer ID: {{ item.transferId }}</p>
          <p class="small muted">Credits involved: ${{ item.creditAmount }}</p>
          <p class="small muted">{{ new Date(item.createdAt).toLocaleString() }}</p>
        </div>
        <div class="notification-actions">
          <RouterLink :to="`/transfer/${item.transferId}`"><button>Open transfer</button></RouterLink>
          <button class="secondary" @click="dismiss(item.transferId)">Dismiss</button>
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

.empty-state,
.notification-card {
  padding: 1.4rem;
  display: grid;
  gap: 0.8rem;
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
