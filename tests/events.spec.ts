import { test, expect } from '@playwright/test';
import {
    setupConsoleMonitoring,
    assertNoConsoleErrors,
} from './setup/console-monitor';

const API_HOST = 'ticketremasterapi.hong-yi.me';

test.describe('Events Information', () => {
    test.beforeEach(async ({ page }) => {
        setupConsoleMonitoring(page);
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    test('should list events and show details', async ({ page }) => {
        const mockEvents = [{
            eventId: 'evt_001',
            name: 'Taylor Swift',
            eventDate: '2026-06-15T19:00:00Z',
            venue: { name: 'Indoor Stadium', city: 'Singapore' },
            pricingTiers: [{ category: 'CAT1', price: 350 }]
        }];

        // Intercept API calls only (not frontend routes)
        await page.route(`**${API_HOST}/events**`, async route => {
            const url = route.request().url();
            // Serve event detail for /events/evt_001
            if (url.includes('/events/evt_001') && !url.includes('/seats')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        data: {
                            eventId: 'evt_001',
                            name: 'Taylor Swift',
                            eventDate: '2026-06-15T19:00:00Z',
                            venue: { name: 'Indoor Stadium', address: '2 Stadium Walk' },
                            type: 'concert',
                            pricingTiers: { CAT1: 350 }
                        }
                    })
                });
            } else {
                // Serve event list
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        data: {
                            events: mockEvents,
                            pagination: { page: 1, totalPages: 1 }
                        }
                    })
                });
            }
        });

        await page.goto('/events');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('text=Taylor Swift')).toBeVisible({ timeout: 10000 });
        await page.click('text=Taylor Swift');

        await expect(page).toHaveURL(/\/events\/evt_001/, { timeout: 5000 });
        await expect(page.locator('h1')).toContainText('Taylor Swift');
        await expect(page.locator('text=Indoor Stadium')).toBeVisible();
    });

    test('should handle 404 Event Not Found', async ({ page }) => {
        await page.route(`**${API_HOST}/events/missing`, async route => {
            await route.fulfill({
                status: 404,
                contentType: 'application/json',
                body: JSON.stringify({ error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } })
            });
        });

        await page.goto('/events/missing');
        await expect(page.locator('text=Event not found')).toBeVisible();
    });

    test('should allow toggling favorites', async ({ page }) => {
        // Mock event list — only intercept API calls
        await page.route(`**${API_HOST}/events**`, async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        events: [{ eventId: 'evt_001', name: 'Taylor Swift', eventDate: '2026-06-15T19:00:00Z', pricingTiers: [{ category: 'CAT1', price: 350 }] }],
                        pagination: { page: 1, totalPages: 1 }
                    }
                })
            });
        });

        await page.goto('/events');
        await page.waitForLoadState('networkidle');
        // The fav button uses aria-label="Toggle favourite" (British spelling)
        const heartBtn = page.locator('.fav-btn').first();
        await expect(heartBtn).toBeVisible({ timeout: 10000 });

        // Initial state
        await expect(heartBtn).not.toHaveClass(/fav-active/);

        // Toggle on
        await heartBtn.click();
        await expect(heartBtn).toHaveClass(/fav-active/);

        // Check local storage (persistence check)
        const favorites = await page.evaluate(() => localStorage.getItem('favoriteEvents'));
        expect(favorites).toContain('evt_001');
    });

    test('should filter events by date range', async ({ page }) => {
        const today = new Date().toISOString().slice(0, 10);
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

        await page.route(`**${API_HOST}/events**`, async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        events: [
                            { eventId: 'evt_001', name: 'Event Today', eventDate: `${today}T10:00:00Z`, pricingTiers: [{ category: 'GA', price: 50 }] },
                            { eventId: 'evt_002', name: 'Event Tomorrow', eventDate: `${tomorrow}T10:00:00Z`, pricingTiers: [{ category: 'GA', price: 75 }] }
                        ],
                        pagination: { page: 1, totalPages: 1 }
                    }
                })
            });
        });

        await page.goto('/events');
        await page.waitForLoadState('networkidle');

        // Verify events loaded
        await expect(page.locator('text=Event Today')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Event Tomorrow')).toBeVisible({ timeout: 10000 });

        // Set date filter to today only
        await page.fill('input[type="date"][title="From"]', today);
        await page.fill('input[type="date"][title="To"]', today);

        // Should only show today's event
        await expect(page.locator('text=Event Today')).toBeVisible();
        await expect(page.locator('text=Event Tomorrow')).not.toBeVisible();
    });
});
