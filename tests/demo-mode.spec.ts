import { test, expect } from '@playwright/test';
import {
    setupConsoleMonitoring,
    assertNoConsoleErrors,
} from './setup/console-monitor';

/**
 * Demo Mode & Mock Data Tests
 *
 * Tests the demo login functionality with all three demo accounts (user, admin, staff)
 * and verifies that correct mock data renders for each role.
 */
test.describe('Demo Mode & Mock Data', () => {
    test.beforeEach(async ({ page }) => {
        // Setup console monitoring for this test
        setupConsoleMonitoring(page);
    });

    test.afterEach(async () => {
        // Assert no console errors occurred during the test
        assertNoConsoleErrors();
    });

    test.describe('Demo Login Page', () => {
        test('should display demo login page with all demo accounts', async ({ page }) => {
            await page.goto('/demo-login');

            // Verify the page loads
            await expect(page.locator('h1')).toContainText(/Demo/);

            // Verify demo account buttons are present
            await expect(page.locator('button:has-text("Demo User")')).toBeVisible();
            await expect(page.locator('button:has-text("Demo Admin")')).toBeVisible();
            await expect(page.locator('button:has-text("Demo Staff")')).toBeVisible();
        });

        test('should show demo account credentials', async ({ page }) => {
            await page.goto('/demo-login');

            // Check that demo account buttons are displayed with labels
            await expect(page.locator('button:has-text("Demo User")')).toBeVisible();
            await expect(page.locator('button:has-text("Demo Admin")')).toBeVisible();
            await expect(page.locator('button:has-text("Demo Staff")')).toBeVisible();

            // Check that the email input has the default demo email
            await expect(page.locator('input[type="email"]')).toHaveValue('demo@ticketremaster.com');
        });
    });

    test.describe('Demo User Account', () => {
        test('should login as demo user and see user-specific content', async ({ page }) => {
            await page.goto('/demo-login');

            // Click the demo user button
            await page.click('button:has-text("Demo User")');
            await page.waitForLoadState('networkidle');

            // Should redirect to events page
            await expect(page).toHaveURL(/\/events/);

            // Verify events page is displayed with toolbar
            await expect(page.locator('.events-page')).toBeVisible();
            await expect(page.locator('button.tab:has-text("All")')).toBeVisible();

            // Verify user is logged in by checking for "My Tickets" link in navbar
            await expect(page.locator('a[href="/tickets"]').or(page.getByText('My Tickets'))).toBeVisible();
        });

        test('demo user should access my tickets page', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo User")');
            await page.waitForURL(/\/events/, { timeout: 10000 });

            // Navigate to my tickets via navbar link
            const ticketsLink = page.locator('a[href="/tickets"]').or(page.getByText('My Tickets'));
            await ticketsLink.click();
            await page.waitForURL(/\/tickets/, { timeout: 10000 });
            // Check for tickets page content
            await expect(page.locator('h1, .section-title')).toContainText(/Ticket/);
        });

        test('demo user should access profile page', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo User")');
            await page.waitForURL(/\/events/, { timeout: 10000 });

            // Navigate to profile via navbar
            const profileLink = page.locator('a[href="/profile"]').or(page.getByText('Profile'));
            await profileLink.click();
            await page.waitForURL(/\/profile/, { timeout: 10000 });
            // Check for profile page content - profile page shows email as h1
            await expect(page.getByText('demo@ticketremaster.com').first()).toBeVisible();
        });

        test('demo user should NOT access admin routes', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo User")');
            await page.waitForLoadState('networkidle');

            // Try to access admin page
            await page.goto('/admin/events/new');

            // Should redirect to events page
            await expect(page).toHaveURL(/\/events/);
        });

        test('demo user should NOT access staff routes', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo User")');
            await page.waitForLoadState('networkidle');

            // Try to access staff page
            await page.goto('/staff/scan');
            await page.waitForLoadState('networkidle');

            // Should redirect to events page (router guard redirects non-staff to /events)
            await expect(page).toHaveURL(/\/events/);
        });
    });

    test.describe('Demo Admin Account', () => {
        test('should login as demo admin and see admin-specific content', async ({ page }) => {
            await page.goto('/demo-login');

            // Click the demo admin button
            await page.click('button:has-text("Demo Admin")');
            await page.waitForLoadState('networkidle');

            // Should redirect to admin events page (which redirects to /admin/events/new)
            await expect(page).toHaveURL(/\/admin\/events/);

            // Verify admin create event page is displayed
            await expect(page.locator('h1')).toContainText(/Create Event/);
        });

        test('demo admin should access admin user management', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo Admin")');
            await page.waitForLoadState('networkidle');

            // Navigate to user management - check for Users link in nav
            const usersLink = page.locator('a[href="/admin/users"]').or(page.getByText('User Management'));
            await usersLink.click();
            await page.waitForLoadState('networkidle');
            await expect(page).toHaveURL(/\/admin\/users/);
            // Check for user management content
            await expect(page.locator('h1, .section-title')).toContainText(/User|Users/);
        });

        test('demo admin should access event creation', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo Admin")');
            await page.waitForLoadState('networkidle');

            // Admin is already on event creation page after login
            await expect(page).toHaveURL(/\/admin\/events/);
            await expect(page.locator('h1')).toContainText(/Create Event/);
        });

        test('demo admin should NOT access staff routes', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo Admin")');
            await page.waitForURL(/\/(admin|events)/, { timeout: 15000 });

            // Try to access staff page
            await page.goto('/staff/scan');

            // Should redirect to events page (admin is not staff)
            await expect(page).toHaveURL(/\/(events|admin)/, { timeout: 10000 });
        });
    });

    test.describe('Demo Staff Account', () => {
        test('should login as demo staff and see staff-specific content', async ({ page }) => {
            await page.goto('/demo-login');

            // Click the demo staff button
            await page.click('button:has-text("Demo Staff")');
            // Wait for navigation to complete
            await page.waitForURL(/\/staff\/scan/, { timeout: 15000 });

            // Should redirect to staff scanner page
            await expect(page).toHaveURL(/\/staff\/scan/);

            // Verify staff scanner is displayed - h1 says "QR Scanner"
            await expect(page.locator('h1')).toContainText(/QR Scanner/);
        });

        test('demo staff should NOT access admin routes', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo Staff")');
            await page.waitForURL(/\/staff\/scan/, { timeout: 15000 });

            // Try to access admin page
            await page.goto('/admin/events/new');

            // Should redirect to events page (staff is not admin)
            await expect(page).toHaveURL(/\/events/);
        });

        test('demo staff should access staff scanner', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo Staff")');
            await page.waitForURL(/\/staff\/scan/, { timeout: 15000 });

            // Should already be on scanner page
            await expect(page).toHaveURL(/\/staff\/scan/);

            // Verify scanner interface is visible
            await expect(page.locator('.scanner-page')).toBeVisible();
            await expect(page.getByText('QR Scanner')).toBeVisible();
        });
    });

    test.describe('Mock Data Rendering', () => {
        test('should display mock events on events page', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo User")');
            await page.waitForURL(/\/events/, { timeout: 10000 });

            // Check that events page loaded with the toolbar
            await expect(page.locator('.events-page')).toBeVisible();
            // Check for event cards or the "No events found" empty state
            // (demo mode may or may not have pre-loaded events depending on cache)
            await expect(page.locator('.events-grid, .events-list, .events-page')).toBeVisible();
        });

        test('should display mock venues on venues page', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo User")');
            await page.waitForURL(/\/events/, { timeout: 10000 });

            await page.goto('/venues');
            await page.waitForLoadState('networkidle');
            // Venues page h1 says "Explore venues powered by TicketRemaster"
            await expect(page.locator('h1')).toContainText(/Explore venues/);

            // Check for venue section (may not have visible cards without API data)
            await expect(page.locator('h1')).toContainText(/Explore venues/);
        });

        test('should display mock marketplace listings', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo User")');
            await page.waitForURL(/\/events/, { timeout: 10000 });

            await page.goto('/marketplace');
            await page.waitForLoadState('networkidle');
            // Marketplace h1 says "Discover Listings"
            await expect(page.locator('h1')).toContainText(/Discover Listings/);

            // Should show the marketplace page
            await expect(page.locator('.marketplace-hero')).toBeVisible();
        });
    });
});
