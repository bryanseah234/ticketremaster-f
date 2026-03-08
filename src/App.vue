<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppNavbar from '@/components/common/AppNavbar.vue'
import Footer from '@/components/layout/Footer.vue'
import ToastStack from '@/components/common/ToastStack.vue'
</script>

<template>
  <AppNavbar />
  <RouterView />
  <Footer />
  <ToastStack />
</template>
