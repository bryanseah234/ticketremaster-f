<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import AppNavbar from '@/components/common/AppNavbar.vue'
import Footer from '@/components/layout/Footer.vue'
import ToastStack from '@/components/common/ToastStack.vue'
import ConnectionStatus from '@/components/common/ConnectionStatus.vue'
import DebugPanel from '@/components/DebugPanel.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const handleOffline = () => {
  if (auth.isLoggedIn && !auth.isDemoSession) {
    auth.downgradeToDemo()
    toast.warning('Backend unavailable. Switched to offline demo mode.', 4200)
  }
}

const handleOnline = () => {
  if (auth.restoreFromOfflineFallback()) {
    toast.info('Connection restored. Please sign in again to continue online.', 4200)
    router.push('/login')
  }
}

onMounted(() => {
  window.addEventListener('api:offline', handleOffline)
  window.addEventListener('api:online', handleOnline)
})

onUnmounted(() => {
  window.removeEventListener('api:offline', handleOffline)
  window.removeEventListener('api:online', handleOnline)
})
</script>

<template>
  <ConnectionStatus />
  <AppNavbar />
  <RouterView />
  <Footer />
  <ToastStack />
  <DebugPanel />
</template>

<style scoped>
</style>
