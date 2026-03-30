import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as Sentry from '@sentry/vue'
import posthog from 'posthog-js'
import i18n from './i18n'
import App from './App.vue'
import router from '@/router/index'
import './assets/main.css'
import { applyThemeVariables } from '@/config/theme'

// Apply runtime theme tokens before app mount
applyThemeVariables()

// Initialize Sentry for error tracking and performance monitoring
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    release: import.meta.env.VITE_SENTRY_RELEASE || '1.0.0',
    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of transactions in development
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/yourserver\.io\/api/,
    ],
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% in production
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions
    // Send default PII (IP, etc.)
    sendDefaultPii: true,
  })
}

// Initialize PostHog for product analytics
if (import.meta.env.VITE_POSTHOG_API_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_API_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    defaults: '2026-01-30',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    // Disable in development if desired
    disable_session_recording: import.meta.env.DEV,
  })
}

const app = createApp(App)

// Use i18n for internationalization
app.use(i18n)

// Use Pinia for state management
app.use(createPinia())

// Use Vue Router
app.use(router)

// Mount the application
app.mount('#app')

// Register the service worker after load to keep first paint fast
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
