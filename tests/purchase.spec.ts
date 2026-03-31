import { test, expect } from '@playwright/test';
import {
    setupConsoleMonitoring,
    assertNoConsoleErrors,
} from './setup/console-monitor';

test.describe('Purchase Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Mock user login session for all tests
        await page.goto('/');
        await page.evaluate(() => {
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
        // Mock seat hold - actual endpoint: POST /purchase/hold/{inventoryId}
        await page.route('**/purchase/hold/*', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({
                data: {
                    inventoryId: 'inv_001',
                    status: 'held',
                    heldUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                    holdToken: 'mock-hold-token'
                }
            }) });
        });

        // Mock purchase confirm - actual endpoint: POST /purchase/confirm/{inventoryId}
        await page.route('**/purchase/confirm/*', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({
                data: {
                    ticketId: 'tkt_001',
                    eventId: 'evt_001',
                    status: 'active',
                    price: 100,
                    createdAt: new Date().toISOString()
                }
            }) });
        });

        // Mock credit balance check
        await page.route('**/credits/balance', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({
                data: { creditBalance: 500 }
            }) });
        });

        await page.goto('/events/evt_001/seats');
        await page.click('button.seat-btn.available');
        await page.click('button:has-text("Reserve Seat")');

        // Should navigate to checkout
        await expect(page.locator('h1')).toHaveText(/Checkout/);
        await page.click('button:has-text("Confirm Purchase")');

        // Should show success
        await expect(page.locator('text=Purchase Successful')).toBeVisible();
    });

    test('should handle SEAT_UNAVAILABLE (409)', async ({ page }) => {
        await page.route('**/purchase/hold/*', async route => {
            await route.fulfill({
                status: 409,
                body: JSON.stringify({
                    error: { code: 'SEAT_UNAVAILABLE', message: 'Seat is no longer available' }
                })
            });
        });

        await page.goto('/events/evt_001/seats');
        await page.click('button.seat-btn.available');
        await page.click('button:has-text("Reserve Seat")');

        const toast = page.locator('.Vue-Toastification__toast--error');
        await expect(toast).toContainText(/no longer available|Seat is/);
    });

    test('should handle INSUFFICIENT_CREDITS (402)', async ({ page }) => {
        // Mock checkout page load (balance check)
        await page.route('**/credits/balance', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({
                data: { creditBalance: 10 }
            }) });
        });

        await page.route('**/purchase/confirm/*', async route => {
            await route.fulfill({
                status: 402,
                body: JSON.stringify({
                    error: { code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits' }
                })
            });
        });

        // Set up pending order in localStorage
        await page.evaluate(() => {
            localStorage.setItem('pendingOrder', JSON.stringify({
                orderId: 'inv_001',
                inventoryId: 'inv_001',
                holdToken: 'mock-token',
                eventId: 'evt_001',
                seat: { price: 100 }
            }));
        });

        await page.goto('/checkout/inv_001');
        await page.click('button:has-text("Confirm Purchase")');

        const toast = page.locator('.Vue-Toastification__toast--error');
        await expect(toast).toContainText(/Not enough credits|Insufficient/);
    });

    test('should handle HOLD_EXPIRED (410)', async ({ page }) => {
        await page.route('**/purchase/confirm/*', async route => {
            await route.fulfill({
                status: 410,
                body: JSON.stringify({
                    error: { code: 'PAYMENT_HOLD_EXPIRED', message: 'Seat hold expired' }
                })
            });
        });

        // Set up pending order in localStorage
        await page.evaluate(() => {
            localStorage.setItem('pendingOrder', JSON.stringify({
                orderId: 'inv_001',
                inventoryId: 'inv_001',
                holdToken: 'mock-token',
                eventId: 'evt_001',
                seat: { price: 100 }
            }));
        });

        await page.goto('/checkout/inv_001');
        await page.click('button:has-text("Confirm Purchase")');

        const toast = page.locator('.Vue-Toastification__toast--error');
        await expect(toast).toContainText(/expired|hold/);
    });
});
