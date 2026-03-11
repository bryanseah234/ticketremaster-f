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
    <span>Backend unavailable. Showing limited demo data. Actions are limited.</span>
  </div>
  <AppNavbar />
  <RouterView />
  <Footer />
  <ToastStack />
</template>

<style scoped>
.status-banner{position:fixed;bottom:0;left:0;right:0;z-index:150;padding:.5rem 1rem;background:rgba(251,146,60,0.95);backdrop-filter:blur(8px);border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:center;gap:.75rem;align-items:center;color:#fff;font-size:0.85rem;font-weight:600;box-shadow:0 -4px 12px rgba(0,0,0,0.2)}
.status-banner .small{font-weight:500;color:#ffedd5}
</style>
