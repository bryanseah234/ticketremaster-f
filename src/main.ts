import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import './assets/main.css'
import { applyThemeVariables } from '@/config/theme'

applyThemeVariables()

createApp(App).use(router).mount('#app')

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
