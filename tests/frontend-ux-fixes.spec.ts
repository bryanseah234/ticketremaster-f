import { test, expect } from '@playwright/test'

const buyerPendingFixture = {
  transferId: 'trf-buyer-001',
  status: 'pending_buyer_otp',
  createdAt: new Date().toISOString(),
  event: {
    name: 'Neon Nights',
    date: '2026-09-20T20:00:00Z',
    venue: { name: 'Esplanade Concert Hall' },
  },
  seat: {
    section: 'A',
    rowNumber: '12',
    seatNumber: '08',
  },
}

const completionCacheItem = {
  id: 'transfer_completed:trf-complete-001',
  type: 'transfer_completed',
  title: 'Transfer Complete',
  body: 'Your transfer for Neon Nights is complete.',
  createdAt: new Date().toISOString(),
  primaryTo: '/tickets',
  transferId: 'trf-complete-001',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
}

async function seedAuthSession(
  context: any,
  userId = 'buyer-001',
  role: 'user' | 'admin' | 'staff' = 'user',
) {
  await context.addInitScript(
    ({ sessionUserId, sessionRole }) => {
      sessionStorage.removeItem('ticketremaster_demo_mode')
      sessionStorage.removeItem('demo_access_token')
      sessionStorage.removeItem('demo_user')
      sessionStorage.removeItem('demo_context')
      localStorage.setItem('access_token', 'test-access-token')
      localStorage.setItem('refresh_token', 'test-refresh-token')
      localStorage.setItem(
        'user',
        JSON.stringify({
          userId: sessionUserId,
          email: `${sessionUserId}@example.com`,
          phoneNumber: '+6512345678',
          role: sessionRole,
          isFlagged: false,
          isAdmin: sessionRole === 'admin',
        }),
      )
    },
    { sessionUserId: userId, sessionRole: role },
  )
}

async function navigateInApp(page: any, path: string) {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, '', nextPath)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

test.describe('Frontend UX Fixes Coverage', () => {
  test('buyer pending transfer is discoverable in notifications', async ({ page, context }) => {
    await seedAuthSession(context, 'buyer-001', 'user')

    await page.route('**/credits/balance*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { creditBalance: 350 } }),
      }),
    )
    await page.route('**/transfer/pending*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { transfers: [] } }),
      }),
    )
    await page.route('**/transfer/my-pending*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { transfers: [buyerPendingFixture] } }),
      }),
    )

    await page.goto('/notifications')

    await expect(page.getByRole('heading', { name: 'Buyer OTP Ready' })).toBeVisible()
    await expect(page.getByText('Neon Nights', { exact: false })).toBeVisible()
    await expect(page.locator('a[href="/transfer/trf-buyer-001"]')).toBeVisible()
  })

  test('buyer sees transfer completion notification from session cache', async ({ page, context }) => {
    await context.addInitScript(
      ({ cacheItem }) => {
        sessionStorage.removeItem('ticketremaster_demo_mode')
        sessionStorage.removeItem('demo_access_token')
        sessionStorage.removeItem('demo_user')
        sessionStorage.removeItem('demo_context')
        localStorage.setItem('access_token', 'test-access-token')
        localStorage.setItem('refresh_token', 'test-refresh-token')
        localStorage.setItem(
          'user',
          JSON.stringify({
            userId: 'buyer-001',
            email: 'buyer-001@example.com',
            phoneNumber: '+6512345678',
            role: 'user',
            isFlagged: false,
            isAdmin: false,
          }),
        )
        sessionStorage.setItem('notification_ephemeral_cache', JSON.stringify([cacheItem]))
      },
      { cacheItem: completionCacheItem },
    )

    await page.route('**/credits/balance*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { creditBalance: 350 } }),
      }),
    )
    await page.route('**/transfer/pending*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { transfers: [] } }),
      }),
    )
    await page.route('**/transfer/my-pending*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { transfers: [] } }),
      }),
    )

    await page.goto('/notifications')

    await expect(page.getByRole('heading', { name: 'Transfer Complete' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'View tickets' })).toBeVisible()
  })

  test('ticket detail page renders the reference two-column layout', async ({ page }) => {
    await page.goto('/demo-login')
    await page.click('button:has-text("Demo User")')
    await page.waitForURL(/\/events/, { timeout: 15000 })

    await navigateInApp(page, '/tickets/demo-ticket-001')

    await expect(page.locator('.ticket-shell')).toBeVisible()
    await expect(page.locator('.ticket-left')).toBeVisible()
    await expect(page.locator('.ticket-right')).toBeVisible()
    await expect(page.getByText('Electronic Ticket')).toBeVisible()
    await expect(page.getByText('Section')).toBeVisible()
    await expect(page.getByText('Row')).toBeVisible()
    await expect(page.getByText('Seat')).toBeVisible()
    await expect(page.getByText('Gate')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add to Apple Wallet' })).toBeVisible()
  })

  test('staff scanner enforces venue/event preselection before verify', async ({ page }) => {
    await page.goto('/demo-login')
    await page.click('button:has-text("Demo Staff")')
    await page.waitForURL(/\/staff\/scan/, { timeout: 15000 })

    const venueSelect = page.locator('select').first()
    const eventSelect = page.locator('select').nth(1)
    const confirmButton = page.getByRole('button', { name: /Confirm selection|Reconfirm selection/ })
    const manualInput = page.locator('input[placeholder="Ticket ID"]')

    await expect(manualInput).toBeDisabled()
    await venueSelect.selectOption({ index: 1 })
    await expect(eventSelect).toBeEnabled({ timeout: 10000 })
    await eventSelect.selectOption({ index: 1 })
    await expect(confirmButton).toBeEnabled()

    await confirmButton.click()

    await expect(page.getByText('Scanning session')).toBeVisible()
    await expect(manualInput).toBeEnabled()
  })

  test('notifications list and bell count update via HTTP fallback refresh', async ({ page, context }) => {
    await seedAuthSession(context, 'buyer-001', 'user')

    let emitPending = false

    await context.route('**/credits/balance*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { creditBalance: 350 } }),
      }),
    )
    await context.route('**/transfer/pending*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { transfers: [] } }),
      }),
    )
    await context.route('**/transfer/my-pending*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { transfers: emitPending ? [buyerPendingFixture] : [] },
        }),
      }),
    )

    await page.goto('/notifications')
    await expect(page.getByText('No pending notifications')).toBeVisible()

    emitPending = true
    await page.getByRole('button', { name: 'Refresh' }).click()

    await expect(page.getByRole('heading', { name: 'Buyer OTP Ready' })).toBeVisible()
    await expect(page.locator('.icon-count')).toContainText('1')
  })
})
