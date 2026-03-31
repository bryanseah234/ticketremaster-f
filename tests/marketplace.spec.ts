import { test, expect } from '@playwright/test';
import {
    setupConsoleMonitoring,
    assertNoConsoleErrors,
} from './setup/console-monitor';

test.describe('Marketplace Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('access_token', 'mock-token');
            localStorage.setItem('refresh_token', 'refresh-token');
            localStorage.setItem('user', JSON.stringify({ userId: 'usr_001', email: 'test@example.com', role: 'user' }));
        });
        setupConsoleMonitoring(page);
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    test('should show active listings', async ({ page }) => {
        // Mock marketplace listings - actual endpoint: GET /marketplace
        await page.route('**/marketplace', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    data: {
                        listings: [{
                            listingId: 'lst_001',
                            ticketId: 'tkt_001',
                            sellerId: 'usr_002',
                            sellerName: 'seller',
                            price: 500,
                            status: 'ACTIVE',
                            createdAt: new Date().toISOString(),
                            event: { name: 'Taylor Swift', date: '2026-06-15T19:00:00Z' },
                            seat: { rowNumber: 'A', seatNumber: 12 }
                        }],
                        pagination: { page: 1, totalPages: 1 }
                    }
                })
            });
        });

        await page.goto('/marketplace');
        await expect(page.locator('text=Taylor Swift')).toBeVisible();
        await expect(page.locator('text=$500')).toBeVisible();
        await expect(page.locator('text=Row A')).toBeVisible();
    });

    test('should allow buying a listing', async ({ page }) => {
        // Mock transfer initiate - actual endpoint: POST /transfer/initiate
        await page.route('**/transfer/initiate', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    data: {
                        transferId: 'txr_001',
                        status: 'pending_seller_acceptance',
                        message: 'Request sent to seller'
                    }
                })
            });
        });

        await page.goto('/marketplace');
        await page.click('button:has-text("Buy Now")');

        // Should navigate to transfer page
        await expect(page).toHaveURL(/\/transfer\/txr_/);
        await expect(page.locator('text=Ticket Transfer')).toBeVisible();
    });

    test('should handle buying with insufficient credits (402)', async ({ page }) => {
        await page.route('**/transfer/initiate', async route => {
            await route.fulfill({
                status: 402,
                body: JSON.stringify({
                    error: { code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits' }
                })
            });
        });

        await page.goto('/marketplace');
        await page.click('button:has-text("Buy Now")');

        const toast = page.locator('.Vue-Toastification__toast--error');
        await expect(toast).toContainText(/Not enough credits|Insufficient/);
    });

    test('should filter listings by search', async ({ page }) => {
        await page.route('**/marketplace', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    data: {
                        listings: [
                            { listingId: 'lst_001', ticketId: 'tkt_001', price: 500, status: 'ACTIVE', event: { name: 'Taylor Swift', date: '2026-06-15' } },
                            { listingId: 'lst_002', ticketId: 'tkt_002', price: 300, status: 'ACTIVE', event: { name: 'Ed Sheeran', date: '2026-07-20' } }
                        ],
                        pagination: { page: 1, totalPages: 1 }
                    }
                })
            });
        });

        await page.goto('/marketplace');
        
        // Search for Taylor Swift
        await page.fill('input[placeholder*="Search"]', 'Taylor Swift');
        
        // Should only show Taylor Swift listing
        await expect(page.locator('text=Taylor Swift')).toBeVisible();
        await expect(page.locator('text=Ed Sheeran')).not.toBeVisible();
    });

    test('should sort listings by price', async ({ page }) => {
        await page.route('**/marketplace', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    data: {
                        listings: [
                            { listingId: 'lst_001', ticketId: 'tkt_001', price: 500, status: 'ACTIVE', event: { name: 'Event A', date: '2026-06-15' } },
                            { listingId: 'lst_002', ticketId: 'tkt_002', price: 200, status: 'ACTIVE', event: { name: 'Event B', date: '2026-07-20' } },
                            { listingId: 'lst_003', ticketId: 'tkt_003', price: 350, status: 'ACTIVE', event: { name: 'Event C', date: '2026-08-10' } }
                        ],
                        pagination: { page: 1, totalPages: 1 }
                    }
                })
            });
        });

        await page.goto('/marketplace');
        
        // Click price sort button
        await page.click('button:has-text("Price")');
        
        // Should sort ascending (200, 350, 500)
        const prices = await page.locator('.price-pill').allTextContents();
        expect(prices).toEqual(['$200', '$350', '$500']);
    });
});
