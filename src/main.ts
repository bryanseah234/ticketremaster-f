import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import './assets/main.css'
import { applyThemeVariables } from '@/config/theme'

// Apply runtime theme tokens before app mount
applyThemeVariables()

createApp(App).use(router).mount('#app')

// Register the service worker after load to keep first paint fast
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
