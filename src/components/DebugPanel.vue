<script setup lang="ts">
import { ref } from 'vue'
import * as Sentry from '@sentry/vue'
import posthog from 'posthog-js'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const isExpanded = ref(false)

const triggerSentryError = () => {
  try {
    throw new Error('Test Sentry error - this is intentional for testing')
  } catch (err) {
    Sentry.captureException(err, {
      tags: { test: true, source: 'debug-panel' },
      extra: { timestamp: new Date().toISOString() },
    })
    toast.success('Sentry test error sent! Check your Sentry dashboard.')
  }
}

const triggerSentryMessage = () => {
  Sentry.captureMessage('Test Sentry message from TicketRemaster', {
    level: 'info',
    tags: { test: true, source: 'debug-panel' },
    extra: { timestamp: new Date().toISOString() },
  })
  toast.success('Sentry test message sent!')
}

const triggerPostHogEvent = () => {
  posthog.capture('test_event', {
    source: 'debug-panel',
    timestamp: new Date().toISOString(),
    test: true,
    customProperty: 'test-value',
  })
  toast.success('PostHog test event sent! Check your PostHog dashboard.')
}

const triggerPostHogIdentify = () => {
  posthog.identify('test-user-123', {
    email: 'test@example.com',
    role: 'tester',
    isDemo: true,
  })
  toast.success('PostHog identify sent!')
}

const logToSentry = () => {
  Sentry.addBreadcrumb({
    message: 'Test breadcrumb from debug panel',
    category: 'debug',
    level: 'info',
  })
  Sentry.captureMessage('Test log with breadcrumb', { level: 'log' })
  toast.success('Sentry log sent with breadcrumb!')
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50">
    <!-- Toggle button -->
    <button
      @click="isExpanded = !isExpanded"
      class="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
      <span class="text-sm font-medium">Debug Panel</span>
    </button>

    <!-- Expanded panel -->
    <div v-if="isExpanded" class="absolute bottom-12 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-sm font-semibold text-gray-900">Observability Testing</h3>
        <button @click="isExpanded = false" class="text-gray-400 hover:text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-2">
        <div class="text-xs text-gray-500 font-medium mb-1">Sentry</div>
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="triggerSentryError"
            class="px-3 py-1.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors"
          >
            Send Error
          </button>
          <button
            @click="triggerSentryMessage"
            class="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          >
            Send Message
          </button>
          <button
            @click="logToSentry"
            class="px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors col-span-2"
          >
            Send Log + Breadcrumb
          </button>
        </div>

        <div class="text-xs text-gray-500 font-medium mb-1 mt-3">PostHog</div>
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="triggerPostHogEvent"
            class="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
          >
            Send Event
          </button>
          <button
            @click="triggerPostHogIdentify"
            class="px-3 py-1.5 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded hover:bg-orange-100 transition-colors"
          >
            Identify User
          </button>
        </div>
      </div>

      <div class="mt-3 pt-3 border-t border-gray-200">
        <p class="text-xs text-gray-400">
          Check Sentry dashboard and PostHog Live Events to verify data is being received.
        </p>
      </div>
    </div>
  </div>
</template>
