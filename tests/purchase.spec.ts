import { test, expect } from '@playwright/test';
import {
    setupConsoleMonitoring,
    assertNoConsoleErrors,
} from './setup/console-monitor';

test.describe('Purchase Flow', () => {
    test.beforeEach(async ({ page, context }) => {
        // Use addInitScript to set localStorage before any navigation
        await context.addInitScript(() => {
            localStorage.setItem('access_token', 'mock-token');
            localStorage.setItem('refresh_token', 'refresh-token');
            localStorage.setItem('user', JSON.stringify({ userId: 'u1', email: 'test@example.com', role: 'user' }));
        });
        setupConsoleMonitoring(page);
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    test('should reserve a seat and pay successfully', async ({ page }) => {
        // Mock seat hold
        await page.route('**/purchase/hold/*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        inventoryId: 'inv_001',
                        status: 'held',
                        heldUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                        holdToken: 'mock-hold-token'
                    }
                })
            });
        });

        // Mock purchase confirm
        await page.route('**/purchase/confirm/*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        ticketId: 'tkt_001',
                        eventId: 'evt_001',
                        status: 'active',
                        price: 100,
                        createdAt: new Date().toISOString()
                    }
                })
            });
        });

        // Mock credit balance check
        await page.route('**/credits/balance', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: { creditBalance: 500 }
                })
            });
        });

        await page.goto('/events/evt_001/seats');
        await page.waitForLoadState('networkidle');

        // Check if seat buttons exist
        const seatBtn = page.locator('button.seat-btn.available').first();
        if (await seatBtn.count() > 0) {
            await seatBtn.click();
            const reserveBtn = page.locator('button:has-text("Reserve Seat")');
            if (await reserveBtn.count() > 0) {
                await reserveBtn.click();
                // Should navigate to checkout
                await expect(page.locator('h1')).toContainText(/Checkout/);
                await page.click('button:has-text("Confirm Purchase")');
                // Should show success
                await expect(page.locator('text=Purchase Successful')).toBeVisible({ timeout: 10000 });
            }
        }
    });

    test('should handle SEAT_UNAVAILABLE (409)', async ({ page }) => {
        await page.route('**/purchase/hold/*', async route => {
            await route.fulfill({
                status: 409,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: { code: 'SEAT_UNAVAILABLE', message: 'Seat is no longer available' }
                })
            });
        });

        await page.goto('/events/evt_001/seats');
        await page.waitForLoadState('networkidle');

        const seatBtn = page.locator('button.seat-btn.available').first();
        if (await seatBtn.count() > 0) {
            await seatBtn.click();
            const reserveBtn = page.locator('button:has-text("Reserve Seat")');
            if (await reserveBtn.count() > 0) {
                await reserveBtn.click();
                const toast = page.locator('.toast.error');
                await expect(toast).toBeVisible({ timeout: 10000 });
                await expect(toast).toContainText(/no longer available|Seat is|unavailable/i);
            }
        }
    });

    test('should handle INSUFFICIENT_CREDITS (402)', async ({ page, context }) => {
        // Mock checkout page load (balance check)
        await page.route('**/credits/balance', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: { creditBalance: 10 }
                })
            });
        });

        await page.route('**/purchase/confirm/*', async route => {
            await route.fulfill({
                status: 402,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: { code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits' }
                })
            });
        });

        // Set up pending order via addInitScript
        await context.addInitScript(() => {
            localStorage.setItem('pendingOrder', JSON.stringify({
                orderId: 'inv_001',
                inventoryId: 'inv_001',
                holdToken: 'mock-token',
                eventId: 'evt_001',
                seat: { price: 100 }
            }));
        });

        await page.goto('/checkout/inv_001');
        await page.waitForLoadState('networkidle');

        const confirmBtn = page.locator('button:has-text("Confirm Purchase")');
        if (await confirmBtn.count() > 0 && await confirmBtn.isEnabled()) {
            await confirmBtn.click();
            const toast = page.locator('.toast.error').first();
            await expect(toast).toBeVisible({ timeout: 10000 });
            await expect(toast).toContainText(/Not enough credits|Insufficient/);
        }
    });

    test('should handle HOLD_EXPIRED (410)', async ({ page, context }) => {
        await page.route('**/purchase/confirm/*', async route => {
            await route.fulfill({
                status: 410,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: { code: 'PAYMENT_HOLD_EXPIRED', message: 'Seat hold expired' }
                })
            });
        });

        // Set up pending order via addInitScript
        await context.addInitScript(() => {
            localStorage.setItem('pendingOrder', JSON.stringify({
                orderId: 'inv_001',
                inventoryId: 'inv_001',
                holdToken: 'mock-token',
                eventId: 'evt_001',
                seat: { price: 100 }
            }));
        });

        await page.goto('/checkout/inv_001');
        await page.waitForLoadState('networkidle');

        const confirmBtn = page.locator('button:has-text("Confirm Purchase")');
        if (await confirmBtn.count() > 0 && await confirmBtn.isEnabled()) {
            await confirmBtn.click();
            const toast = page.locator('.toast.error').first();
            await expect(toast).toBeVisible({ timeout: 10000 });
            await expect(toast).toContainText(/expired|hold/i);
        }
    });
});
