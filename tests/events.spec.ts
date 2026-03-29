import { test, expect } from '@playwright/test';

test.describe('Events Information', () => {
    test('should list events and show details', async ({ page }) => {
        // Mock event list - actual endpoint: GET /events
        await page.route('**/events', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    data: {
                        events: [{
                            eventId: 'evt_001',
                            name: 'Taylor Swift',
                            eventDate: '2026-06-15T19:00:00Z',
                            venue: { name: 'Indoor Stadium', city: 'Singapore' },
                            pricingTiers: [{ category: 'CAT1', price: 350 }]
                        }],
                        pagination: { page: 1, totalPages: 1 }
                    }
                })
            });
        });

        // Mock event detail - actual endpoint: GET /events/{eventId}
        await page.route('**/events/evt_001', async route => {
            await route.fulfill({
                status: 200,
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
        });

        // Mock seats endpoint - actual endpoint: GET /events/{eventId}/seats
        await page.route('**/events/evt_001/seats', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    data: {
                        eventId: 'evt_001',
                        seats: [
                            { inventoryId: 'inv_001', seatId: 'seat_001', rowNumber: 'A', seatNumber: '1', status: 'AVAILABLE', price: 350 }
                        ]
                    }
                })
            });
        });

        await page.goto('/');
        await expect(page.locator('h1')).toHaveText(/Events/);
        await expect(page.locator('text=Taylor Swift')).toBeVisible();
        await page.click('text=Taylor Swift');

        await expect(page).toHaveURL(/\/events\/evt_001/);
        await expect(page.locator('h1')).toHaveText('Taylor Swift');
        await expect(page.locator('text=Indoor Stadium')).toBeVisible();
        await expect(page.locator('text=CAT1')).toBeVisible();
    });

    test('should handle 404 Event Not Found', async ({ page }) => {
        await page.route('**/events/missing', async route => {
            await route.fulfill({
                status: 404,
                body: JSON.stringify({ error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } })
            });
        });

        await page.goto('/events/missing');
        await expect(page.locator('text=Event not found')).toBeVisible();
    });

    test('should allow toggling favorites', async ({ page }) => {
        // Mock event list
        await page.route('**/events', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    data: {
                        events: [{ eventId: 'evt_001', name: 'Taylor Swift', eventDate: '2026-06-15T19:00:00Z', pricingTiers: [{ category: 'CAT1', price: 350 }] }],
                        pagination: { page: 1, totalPages: 1 }
                    }
                })
            });
        });

        await page.goto('/');
        const heartBtn = page.locator('button[aria-label="Toggle favourite"]');
        await expect(heartBtn).toBeVisible();

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
        await page.route('**/events', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    data: {
                        events: [
                            { eventId: 'evt_001', name: 'Event Today', eventDate: new Date().toISOString(), pricingTiers: [{ category: 'GA', price: 50 }] },
                            { eventId: 'evt_002', name: 'Event Tomorrow', eventDate: new Date(Date.now() + 86400000).toISOString(), pricingTiers: [{ category: 'GA', price: 75 }] }
                        ],
                        pagination: { page: 1, totalPages: 1 }
                    }
                })
            });
        });

        await page.goto('/');
        
        // Set date filter to today only
        const today = new Date().toISOString().slice(0, 10);
        await page.fill('input[type="date"][title="From"]', today);
        
        // Should only show today's event
        await expect(page.locator('text=Event Today')).toBeVisible();
    });
});
