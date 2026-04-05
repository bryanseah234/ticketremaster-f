import { test, expect } from '@playwright/test';
import {
    setupConsoleMonitoring,
    assertNoConsoleErrors,
} from './setup/console-monitor';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        setupConsoleMonitoring(page);
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    test('should show login page and handle successful login', async ({ page }) => {
        // Mock successful login response - actual endpoint: POST /auth/login
        await page.route('**/auth/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        token: 'mock-access-token',
                        expiresAt: new Date(Date.now() + 3600000).toISOString(),
                        user: { userId: 'usr_001', email: 'test@example.com', role: 'user' }
                    }
                })
            });
        });

        await page.goto('/login');
        await expect(page.locator('h1')).toHaveText(/Sign In/);

        await page.fill('input[placeholder*="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Sign In")');

        // Should redirect to home/events
        await expect(page).toHaveURL('/events');
    });

    test('should handle 401 Unauthorized with toast message', async ({ page }) => {
        // Mock 401 response
        await page.route('**/auth/login', async route => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' }
                })
            });
        });

        await page.goto('/login');
        await page.fill('input[placeholder*="email"]', 'wrong@example.com');
        await page.fill('input[type="password"]', 'wrongpass');
        await page.click('button:has-text("Sign In")');

        // Check for toast message
        const toast = page.locator('.toast.error').first();
        await expect(toast).toBeVisible({ timeout: 10000 });
        await expect(toast).toContainText(/Invalid|credentials/);
    });

    test('should handle registration successfully', async ({ page }) => {
        // Mock registration - actual endpoint: POST /auth/register
        await page.route('**/auth/register', async route => {
            await route.fulfill({
                status: 201,
                body: JSON.stringify({
                    data: {
                        userId: 'usr_002',
                        email: 'new@example.com',
                        role: 'user',
                        createdAt: new Date().toISOString()
                    }
                })
            });
        });

        await page.goto('/register');
        await page.fill('input[placeholder*="your name"]', 'New Demo User');
        await page.fill('input[placeholder*="email"]', 'new@example.com');
        await page.fill('input[placeholder*="Phone number"]', '91234567');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Register Account")');

        // Should redirect to verify (OTP step) or login
        await expect(page).toHaveURL(/\/(verify|login)/, { timeout: 10000 });
    });

    test('should handle registration validation errors (400)', async ({ page }) => {
        await page.route('**/auth/register', async route => {
            await route.fulfill({
                status: 400,
                body: JSON.stringify({
                    error: { code: 'VALIDATION_ERROR', message: 'Invalid email format' },
                    errors: { email: ['Must be a valid email address'] }
                })
            });
        });

        await page.goto('/register');
        await page.fill('input[placeholder*="your name"]', 'Valid User');
        await page.fill('input[placeholder*="email"]', 'valid@example.com');
        await page.fill('input[placeholder*="Phone number"]', '91234567');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Register Account")');

        const toast = page.locator('.toast.error').first();
        await expect(toast).toBeVisible({ timeout: 10000 });
        await expect(toast).toContainText(/validation|Invalid|email/i);
    });

    test('should handle duplicate email registration (409)', async ({ page }) => {
        await page.route('**/auth/register', async route => {
            await route.fulfill({
                status: 409,
                body: JSON.stringify({
                    error: { code: 'EMAIL_ALREADY_EXISTS', message: 'This email is already registered' }
                })
            });
        });

        await page.goto('/register');
        await page.fill('input[placeholder*="your name"]', 'Existing User');
        await page.fill('input[placeholder*="email"]', 'existing@example.com');
        await page.fill('input[placeholder*="Phone number"]', '91234567');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Register Account")');

        const toast = page.locator('.toast.error').first();
        await expect(toast).toBeVisible({ timeout: 10000 });
        await expect(toast).toContainText(/already registered/);
    });

    test('should redirect unauthenticated user from protected routes', async ({ page, context }) => {
        // Clear any stored auth by using a fresh context
        await context.clearCookies();
        await context.addInitScript(() => {
            localStorage.clear();
        });

        await page.goto('/tickets');
        await expect(page).toHaveURL('/login');
    });
});
