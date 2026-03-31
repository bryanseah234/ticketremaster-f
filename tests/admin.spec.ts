import { test, expect } from '@playwright/test';
import {
    setupConsoleMonitoring,
    assertNoConsoleErrors,
} from './setup/console-monitor';

test.describe('Admin Operations', () => {
    test.beforeEach(async ({ page }) => {
        setupConsoleMonitoring(page);
        await page.addInitScript(() => {
            window.localStorage.setItem('access_token', 'admin-token');
            window.localStorage.setItem('refresh_token', 'refresh-token');
            window.localStorage.setItem('user', JSON.stringify({
                user_id: 'a1',
                email: 'admin@example.com',
                is_admin: true
            }));
        });
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    test('should show event dashboard with stats', async ({ page }) => {
        // Mock dashboard response
        await page.route('**/api/admin/events/e1/dashboard', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        event_id: 'e1',
                        name: 'Taylor Swift',
                        stats: { total_seats: 500, seats_sold: 150, revenue: 30000 },
                        attendees: [{ user_id: 'u1', email: 'customer@example.com', seat_id: 's1', row_number: 'A', seat_number: 1 }]
                    }
                })
            });
        });

        await page.goto('/admin/events/e1/dashboard');
        await expect(page.locator('h1')).toContainText('Inventory Overview');
        await expect(page.locator('h3:has-text("150")')).toBeVisible(); // Seats sold
        await expect(page.locator('text=customer@example.com')).toBeVisible();
    });

    test('should allow creating a new event', async ({ page }) => {
        await page.route('**/api/admin/events', async route => {
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, data: { event_id: 'new-e', seats_created: 500 } })
            });
        });

        await page.goto('/admin/events/new');
        await page.fill('input[placeholder*="Neon"]', 'New Year Concert');
        await page.fill('input[type="datetime-local"]', '2026-12-31T20:00');
        await page.fill('input[placeholder*="Arena"]', 'National Stadium');
        await page.fill('input[type="number"][min="1"]', '1'); // Total halls
        await page.locator('input:below(label:has-text("Total seats"))').first().fill('500');
        await page.click('button:has-text("Create event")');

        await expect(page.locator('text=Created new-e with 500 seats.')).toBeVisible();
    });

    test('should handle FORBIDDEN (403) for non-admins', async ({ page }) => {
        // Override session for this specific test
        await page.addInitScript(() => {
            window.localStorage.setItem('access_token', 'user-token');
            window.localStorage.setItem('user', JSON.stringify({
                user_id: 'u1',
                email: 'user@example.com',
                is_admin: false
            }));
        });

        await page.route('**/api/admin/events/e1/dashboard', async route => {
            await route.fulfill({
                status: 403,
                contentType: 'application/json',
                body: JSON.stringify({ success: false, error_code: 'FORBIDDEN', message: 'Admin access required' })
            });
        });

        await page.goto('/admin/events/e1/dashboard');
        // It might redirect to /events because of the router guard, or show a toast if it hits the API.
        // If the guard runs first, it goes to /events.
        if (await page.url().endsWith('/events')) {
            await expect(page).toHaveURL(/\/events/);
        } else {
            await expect(page.locator('.Vue-Toastification__toast--error')).toContainText(/Admin access|denied|forbidden/i);
        }
    });
});
