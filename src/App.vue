<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppNavbar from '@/components/common/AppNavbar.vue'
import Footer from '@/components/layout/Footer.vue'
import ToastStack from '@/components/common/ToastStack.vue'
import ConnectionStatus from '@/components/common/ConnectionStatus.vue'
import DebugPanel from '@/components/DebugPanel.vue'
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
