import { test, expect } from '@playwright/test';

test.describe('Marketplace Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('access_token', 'mock-token');
            localStorage.setItem('refresh_token', 'refresh-token');
            localStorage.setItem('user', JSON.stringify({ user_id: 'u1', email: 'test@example.com', credit_balance: 1000 }));
        });
    });

    test('should show active listings', async ({ page }) => {
        // Mock marketplace listings
        await page.route('**/api/marketplace/listings', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    success: true,
                    data: [{
                        listing_id: 'l1',
                        seat_id: 's1',
                        asking_price: 500,
                        status: 'ACTIVE',
                        event: { name: 'Taylor Swift', event_date: '2026-06-15' },
                        seat: { row_number: 'A', seat_number: 12 }
                    }]
                })
            });
        });

        await page.goto('/marketplace');
        await expect(page.locator('text=Taylor Swift')).toBeVisible();
        await expect(page.locator('text=$500')).toBeVisible();
        await expect(page.locator('text=Row A, Seat 12')).toBeVisible();
    });

    test('should allow buying a listing', async ({ page }) => {
        await page.route('**/api/marketplace/buy', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({ success: true, data: { listing_id: 'l1', status: 'PENDING_TRANSFER' } })
            });
        });

        await page.goto('/marketplace');
        await page.click('button:has-text("Buy")');
        await expect(page.locator('text=Payment successful. Awaiting seller approval.')).toBeVisible();
    });

    test('should handle buying with insufficient credits (402)', async ({ page }) => {
        await page.route('**/api/marketplace/buy', async route => {
            await route.fulfill({
                status: 402,
                body: JSON.stringify({ success: false, error_code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits' })
            });
        });

        await page.goto('/marketplace');
        await page.click('button:has-text("Buy")');
        await expect(page.locator('.Vue-Toastification__toast--error')).toContainText('Not enough credits');
    });
});
