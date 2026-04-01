/**
 * Browser Console Monitor for Playwright Tests
 *
 * This module provides utilities for monitoring browser console errors during tests.
 * It captures console errors, page errors, and Vue warnings, failing tests if
 * unexpected errors occur.
 */

import type { Page, ConsoleMessage } from '@playwright/test'

/**
 * Console error types that should be tracked
 */
export interface ConsoleError {
  type: 'console' | 'pageerror' | 'vue-warning'
  message: string
  timestamp: number
}

/**
 * List of known/acceptable console messages that should not fail tests
 */
const ALLOWED_CONSOLE_PATTERNS = [
  /Sentry is enabled in development mode/,
  /PostHog is enabled in development mode/,
  /\[HMR\]/, // Hot module replacement messages
  /\[vue-router\]/, // Vue router debug messages in dev
  /Sentry Logger \[error\]/, // Sentry internal errors (expected when offline)
  /\[PostHog\.js\]/, // PostHog internal errors (expected when offline)
  /Failed to fetch/, // Network errors when backend is offline
  /Network Error/, // Axios network errors
  /ERR_FAILED/, // Chrome network errors
  /CORS policy/, // CORS errors when backend is unavailable
  /403/, // Forbidden errors from CDN/external resources
  /408/, // Request timeout errors
  /abort/, // Aborted requests
  /Failed to load resource/, // Resource loading failures
  /API error/, // API client error logs
  /status code/, // HTTP status code errors
]

/**
 * Check if a console message should be allowed (not fail the test)
 */
function isAllowedMessage(message: string): boolean {
  return ALLOWED_CONSOLE_PATTERNS.some(pattern => pattern.test(message))
}

/**
 * Collected errors for the current test
 */
const collectedErrors: ConsoleError[] = []

/**
 * Setup console monitoring for a page
 * Call this in beforeEach to capture errors during test execution
 */
export function setupConsoleMonitoring(page: Page | undefined): void {
  // Clear any previous errors
  collectedErrors.length = 0

  // Guard against undefined page
  if (!page) {
    console.warn('setupConsoleMonitoring: page is undefined, skipping console monitoring setup')
    return
  }

  // Monitor console messages
  page.on('console', (msg: ConsoleMessage) => {
    const text = msg.text()
    const type = msg.type()

    // Only track errors and warnings
    if (type === 'error' || type === 'warn') {
      if (!isAllowedMessage(text)) {
        collectedErrors.push({
          type: 'console',
          message: `[${type.toUpperCase()}] ${text}`,
          timestamp: Date.now(),
        })
      }
    }
  })

  // Monitor page errors (unhandled exceptions)
  page.on('pageerror', (error: Error) => {
    const message = error.message || String(error)
    if (!isAllowedMessage(message)) {
      collectedErrors.push({
        type: 'pageerror',
        message: `[PAGE ERROR] ${message}`,
        timestamp: Date.now(),
      })
    }
  })
}

/**
 * Get all collected console errors
 */
export function getCollectedErrors(): ConsoleError[] {
  return [...collectedErrors]
}

/**
 * Clear collected errors
 */
export function clearCollectedErrors(): void {
  collectedErrors.length = 0
}

/**
 * Assert that no console errors occurred during the test
 * Call this in afterEach to fail the test if there are errors
 */
export function assertNoConsoleErrors(): void {
  if (collectedErrors.length > 0) {
    const errorMessages = collectedErrors
      .map(e => `  - ${e.type}: ${e.message}`)
      .join('\n')
    throw new Error(
      `Browser console errors detected during test:\n${errorMessages}`
    )
  }
}
