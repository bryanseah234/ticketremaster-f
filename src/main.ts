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

const analyticsEnabled = import.meta.env.PROD

// Initialize Sentry for error tracking and performance monitoring
if (analyticsEnabled && import.meta.env.VITE_SENTRY_DSN) {
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
    tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1, // 100% in dev, 10% in prod
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/yourserver\.io\/api/,
    ],
    // Session Replay
    replaysSessionSampleRate: import.meta.env.DEV ? 0.1 : 0.1, // 10% always
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions
    // Send default PII (IP, etc.)
    sendDefaultPii: true,
    // Debug mode in development
    debug: import.meta.env.DEV,
  })
  
  // Capture application start event
  Sentry.captureMessage('Application started', {
    level: 'info',
    tags: {
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
      version: import.meta.env.VITE_SENTRY_RELEASE || '1.0.0',
    },
  })
}

// Initialize PostHog for product analytics
if (analyticsEnabled && import.meta.env.VITE_POSTHOG_API_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_API_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    defaults: '2026-01-30',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    // Disable in development if desired
    disable_session_recording: import.meta.env.DEV,
    // Debug mode in development
    debug: import.meta.env.DEV,
  })
  
  // Capture application start event
  posthog.capture('application_started', {
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    version: import.meta.env.VITE_SENTRY_RELEASE || '1.0.0',
    timestamp: new Date().toISOString(),
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

// Graceful shutdown handling
window.addEventListener('beforeunload', () => {
  // Flush Sentry events on page unload
  if (analyticsEnabled && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.flush(1000) // Wait up to 1 second
  }
  
  // Flush PostHog events on page unload
  if (analyticsEnabled && import.meta.env.VITE_POSTHOG_API_KEY) {
    posthog.capture('application_terminated', {
      timestamp: new Date().toISOString(),
    })
    // Note: PostHog doesn't have a shutdown method, but capturing the event
    // before unload ensures it's queued for sending
  }
})

// Register the service worker after load to keep first paint fast
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
