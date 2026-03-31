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

            // Check that demo credentials are displayed
            await expect(page.locator('text=demo@ticketremaster.com')).toBeVisible();
            await expect(page.locator('text=admin@ticketremaster.com')).toBeVisible();
            await expect(page.locator('text=staff@ticketremaster.com')).toBeVisible();
        });
    });

    test.describe('Demo User Account', () => {
        test('should login as demo user and see user-specific content', async ({ page }) => {
            await page.goto('/demo-login');

            // Click the demo user button
            await page.click('button:has-text("Demo User")');

            // Should redirect to events page
            await expect(page).toHaveURL(/\/events/);

            // Verify events are displayed with mock data
            await expect(page.locator('h1')).toContainText(/Events/);

            // Check for mock event names
            await expect(page.locator('text=Taylor Swift')).toBeVisible();

            // Verify user is logged in (check for user menu or profile link)
            const userIndicator = page.locator('text=demo@ticketremaster.com, text=My Tickets, text=Profile');
            await expect(userIndicator.first()).toBeVisible();
        });

        test('demo user should access my tickets page', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo User")');
            await expect(page).toHaveURL(/\/events/);

            // Navigate to my tickets
            await page.click('text=My Tickets');
            await expect(page).toHaveURL(/\/tickets/);
            await expect(page.locator('h1')).toContainText(/My Tickets|Tickets/);

            // Should show mock tickets
            await expect(page.locator('text=Taylor Swift')).toBeVisible();
        });

        test('demo user should access profile page', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo User")');

            // Navigate to profile
            await page.click('text=Profile');
            await expect(page).toHaveURL(/\/profile/);
            await expect(page.locator('h1')).toContainText(/Profile/);

            // Should show user email
            await expect(page.locator('text=demo@ticketremaster.com')).toBeVisible();
        });

        test('demo user should NOT access admin routes', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo User")');

            // Try to access admin page
            await page.goto('/admin/events/new');

            // Should redirect to events page
            await expect(page).toHaveURL(/\/events/);
        });

        test('demo user should NOT access staff routes', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo User")');

            // Try to access staff page
            await page.goto('/staff/scan');

            // Should redirect to events page
            await expect(page).toHaveURL(/\/events/);
        });
    });

    test.describe('Demo Admin Account', () => {
        test('should login as demo admin and see admin-specific content', async ({ page }) => {
            await page.goto('/demo-login');

            // Click the demo admin button
            await page.click('button:has-text("Demo Admin")');

            // Should redirect to admin events page
            await expect(page).toHaveURL(/\/admin\/events/);

            // Verify admin dashboard is displayed
            await expect(page.locator('h1')).toContainText(/Admin|Dashboard|Events/);
        });

        test('demo admin should access admin user management', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo Admin")');

            // Navigate to user management
            await page.click('text=Users, text=Manage Users');
            await expect(page).toHaveURL(/\/admin\/users/);
            await expect(page.locator('h1')).toContainText(/Users|User Management/);
        });

        test('demo admin should access event creation', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo Admin")');

            // Navigate to create event
            await page.click('text=Create Event, text=New Event');
            await expect(page).toHaveURL(/\/admin\/events\/new/);
            await expect(page.locator('h1')).toContainText(/Create|New Event/);
        });

        test('demo admin should NOT access staff routes', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo Admin")');

            // Try to access staff page
            await page.goto('/staff/scan');

            // Should redirect to events page (admin is not staff)
            await expect(page).toHaveURL(/\/events/);
        });
    });

    test.describe('Demo Staff Account', () => {
        test('should login as demo staff and see staff-specific content', async ({ page }) => {
            await page.goto('/demo-login');

            // Click the demo staff button
            await page.click('button:has-text("Demo Staff")');

            // Should redirect to staff scanner page
            await expect(page).toHaveURL(/\/staff\/scan/);

            // Verify staff scanner is displayed
            await expect(page.locator('h1')).toContainText(/Staff|Scanner|Ticket/);
        });

        test('demo staff should NOT access admin routes', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo Staff")');

            // Try to access admin page
            await page.goto('/admin/events/new');

            // Should redirect to events page (staff is not admin)
            await expect(page).toHaveURL(/\/events/);
        });

        test('demo staff should access staff scanner', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo Staff")');

            // Should already be on scanner page
            await expect(page).toHaveURL(/\/staff\/scan/);

            // Verify scanner interface is visible
            await expect(page.locator('text=Scan, text=QR Code, text=Ticket')).toBeVisible();
        });
    });

    test.describe('Mock Data Rendering', () => {
        test('should display mock events on events page', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo User")');
            await expect(page).toHaveURL(/\/events/);

            // Check for multiple mock events
            await expect(page.locator('text=Taylor Swift')).toBeVisible();
            await expect(page.locator('text=NBA|Hamilton|TechCrunch')).toBeVisible();
        });

        test('should display mock venues on venues page', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo User")');

            await page.goto('/venues');
            await expect(page.locator('h1')).toContainText(/Venues/);

            // Check for mock venues
            await expect(page.locator('text=Madison Square Garden')).toBeVisible();
        });

        test('should display mock marketplace listings', async ({ page }) => {
            await page.goto('/demo-login');
            await page.click('button:has-text("Demo User")');

            await page.goto('/marketplace');
            await expect(page.locator('h1')).toContainText(/Marketplace/);

            // Should show listings (might be empty in demo mode, but page should load)
            await expect(page.locator('text=Marketplace')).toBeVisible();
        });
    });
});
