import { test, expect } from '@playwright/test';
import {
    setupConsoleMonitoring,
    assertNoConsoleErrors,
} from './setup/console-monitor';

test.describe('Admin Operations', () => {
    test.beforeEach(async ({ page, context }) => {
        setupConsoleMonitoring(page);
        await context.addInitScript(() => {
            window.localStorage.setItem('access_token', 'admin-token');
            window.localStorage.setItem('refresh_token', 'refresh-token');
            // Auth store expects 'role' field, not 'is_admin'
            window.localStorage.setItem('user', JSON.stringify({
                userId: 'a1',
                email: 'admin@example.com',
                role: 'admin'
            }));
        });
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    test('should show event dashboard with stats', async ({ page }) => {
        // Mock dashboard response - only intercept API calls (not frontend route)
        await page.route('**ticketremasterapi.hong-yi.me/admin/events/e1/dashboard', async route => {
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
        // Verify we navigated to the right page
        await expect(page).toHaveURL('/admin/events/e1/dashboard');
        // Wait for page to load and data to render
        await page.waitForLoadState('networkidle');
        // h1 contains "Inventory Overview — e1"
        await expect(page.locator('h1')).toContainText('Inventory Overview', { timeout: 15000 });
        // Check for seats sold metric
        await expect(page.locator('h3:has-text("150")')).toBeVisible();
        // Check for attendee email in table
        await expect(page.locator('text=customer@example.com')).toBeVisible();
    });

    test('should allow creating a new event', async ({ page }) => {
        // Mock the POST to /admin/events (no /api/ prefix)
        await page.route('**/admin/events', async route => {
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, data: { eventId: 'new-e', seatsCreated: 500 } })
            });
        });

        await page.goto('/admin/events/new');
        await page.waitForLoadState('networkidle');
        // Fill form using actual placeholders from AdminEventCreateView
        await page.fill('input[placeholder*="Neon Skyline"]', 'New Year Concert');
        await page.fill('input[type="datetime-local"]:first-of-type', '2026-12-31T20:00');
        await page.fill('input[type="datetime-local"]:last-of-type', '2026-12-31T23:00');
        await page.fill('input[type="number"][min="1"]', '500');
        await page.fill('input[type="number"][min="1"]:last-of-type', '100');
        await page.click('button:has-text("Create event")');

        // Check for success message
        await expect(page.locator('text=Created new-e with 500 seats')).toBeVisible();
    });

    test('should handle FORBIDDEN (403) for non-admins', async ({ page, context }) => {
        // Override session for this specific test - use fresh context
        await context.addInitScript(() => {
            window.localStorage.setItem('access_token', 'user-token');
            window.localStorage.setItem('user', JSON.stringify({
                userId: 'u1',
                email: 'user@example.com',
                role: 'user'
            }));
        });

        await page.route('**/admin/events/e1/dashboard', async route => {
            await route.fulfill({
                status: 403,
                contentType: 'application/json',
                body: JSON.stringify({ success: false, error_code: 'FORBIDDEN', message: 'Admin access required' })
            });
        });

        await page.goto('/admin/events/e1/dashboard');
        // The router guard should redirect non-admin to /events
        await expect(page).toHaveURL(/\/events/);
    });
});
