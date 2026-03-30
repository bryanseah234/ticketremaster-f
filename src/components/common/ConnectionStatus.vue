<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { isDemoMode } from '@/services/mockData'

const isOnline = ref(true)
const isDemo = ref(false)

const handleOnline = () => {
  isOnline.value = true
  isDemo.value = isDemoMode()
}

const handleOffline = () => {
  isOnline.value = false
  isDemo.value = isDemoMode()
}

onMounted(() => {
  window.addEventListener('api:online', handleOnline)
  window.addEventListener('api:offline', handleOffline)
  isDemo.value = isDemoMode()
})

onUnmounted(() => {
  window.removeEventListener('api:online', handleOnline)
  window.removeEventListener('api:offline', handleOffline)
})
</script>

<template>
  <!-- Online/Offline Indicator -->
  <div
    v-if="!isOnline || isDemo"
    :class="[
      'fixed top-0 left-0 right-0 z-50 px-4 py-2 text-xs font-medium text-center transition-all duration-300',
      !isOnline ? 'bg-red-600 text-white' : 'bg-yellow-500 text-white'
    ]"
  >
    <span v-if="!isOnline">
      ⚠ Backend unavailable — Some features may be limited
    </span>
    <span v-else>
      🔧 Demo Mode — Showing mock data for UI development
    </span>
  </div>

  <!-- Spacer to prevent content from being hidden -->
  <div v-if="!isOnline || isDemo" class="h-10"></div>
</template>
