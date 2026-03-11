<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import AppNavbar from '@/components/common/AppNavbar.vue'
import Footer from '@/components/layout/Footer.vue'
import ToastStack from '@/components/common/ToastStack.vue'

const offlineVisible = ref(false)
const offlineMessage = ref('Backend unavailable. Showing limited demo data.')

const handleOffline = (event: Event) => {
  const detail = (event as CustomEvent).detail
  offlineMessage.value = detail?.message || 'Backend unavailable. Showing limited demo data.'
  offlineVisible.value = true
}

const handleOnline = () => {
  offlineVisible.value = false
}

onMounted(() => {
  window.addEventListener('api:offline', handleOffline as EventListener)
  window.addEventListener('api:online', handleOnline)
})

onUnmounted(() => {
  window.removeEventListener('api:offline', handleOffline as EventListener)
  window.removeEventListener('api:online', handleOnline)
})
</script>

<template>
  <div v-if="offlineVisible" class="status-banner">
    <span>{{ offlineMessage }}</span>
    <span class="small">Demo data only. Actions are limited.</span>
  </div>
  <AppNavbar />
  <RouterView />
  <Footer />
  <ToastStack />
</template>

<style scoped>
.status-banner{position:sticky;top:0;z-index:90;padding:.6rem 1rem;background:rgba(251,146,60,.18);border-bottom:1px solid rgba(251,146,60,.45);display:flex;justify-content:center;gap:.75rem;align-items:center;color:#fed7aa;font-weight:600}
.status-banner .small{font-weight:500;color:#ffedd5}
</style>
