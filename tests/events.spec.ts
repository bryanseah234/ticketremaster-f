import { test, expect } from '@playwright/test';

test.describe('Events Information', () => {
    test('should list events and show details', async ({ page }) => {
        // Mock event list
        await page.route('**/api/events', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    success: true,
                    data: [{
                        event_id: 'e1',
                        name: 'Taylor Swift',
                        event_date: '2026-06-15T19:00:00Z',
                        venue: { name: 'Indoor Stadium' },
                        pricing_tiers: { CAT1: 350 }
                    }],
                    pagination: { page: 1, total: 1 }
                })
            });
        });

        // Mock event detail
        await page.route('**/api/events/e1', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    success: true,
                    data: {
                        event_id: 'e1',
                        name: 'Taylor Swift',
                        event_date: '2026-06-15T19:00:00Z',
                        venue: { name: 'Indoor Stadium' },
                        hall_id: 'HALL-A',
                        pricing_tiers: { CAT1: 350 },
                        seats: [{ seat_id: 's1', row_number: 'A', seat_number: 1, status: 'AVAILABLE', price: 350 }]
                    }
                })
            });
        });

        await page.goto('/');
        await expect(page.locator('h1')).toHaveText(/Events/);
        await expect(page.locator('text=Taylor Swift')).toBeVisible();
        await page.click('button:has-text("View")');

        await expect(page).toHaveURL(/\/events\/e1/);
        await expect(page.locator('h1')).toHaveText('Taylor Swift');
        await expect(page.locator('text=HALL-A')).toBeVisible();
        await expect(page.locator('text=CAT1 · $350')).toBeVisible();
    });

    test('should handle 404 Event Not Found', async ({ page }) => {
        await page.route('**/api/events/missing', async route => {
            await route.fulfill({
                status: 404,
                body: JSON.stringify({ success: false, error_code: 'EVENT_NOT_FOUND', message: 'Event not found' })
            });
        });

        await page.goto('/events/missing');
        await expect(page.locator('text=Event not found')).toBeVisible();
    });

    test('should allow toggling favorites', async ({ page }) => {
        // Mock event list
        await page.route('**/api/events', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    success: true,
                    data: [{ event_id: 'e1', name: 'Taylor Swift', event_date: '2026-06-15T19:00:00Z', pricing_tiers: { CAT1: 350 } }],
                    pagination: { page: 1, total: 1 }
                })
            });
        });

        await page.goto('/');
        const heartBtn = page.locator('button[aria-label="toggle favorite Taylor Swift"]');
        await expect(heartBtn).toBeVisible();

        // Initial state
        await expect(heartBtn).not.toHaveClass(/active/);

        // Toggle on
        await heartBtn.click();
        await expect(heartBtn).toHaveClass(/active/);

        // Check local storage (persistence check)
        const favorites = await page.evaluate(() => localStorage.getItem('favorite_events'));
        expect(favorites).toContain('e1');
    });
});
