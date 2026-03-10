import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should show login page and handle successful login', async ({ page }) => {
        // Mock successful login response
        await page.route('**/api/auth/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        access_token: 'mock-access-token',
                        refresh_token: 'mock-refresh-token',
                        user: { user_id: '123', email: 'test@example.com' }
                    }
                })
            });
        });

        await page.goto('/login');
        await expect(page).toHaveTitle(/Login/);

        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Login")');

        // Should redirect to home/events
        await expect(page).toHaveURL('/');
    });

    test('should handle 401 Unauthorized with toast message', async ({ page }) => {
        // Mock 401 response
        await page.route('**/api/auth/login', async route => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    error_code: 'UNAUTHORIZED',
                    message: 'Invalid credentials'
                })
            });
        });

        await page.goto('/login');
        await page.fill('input[type="email"]', 'wrong@example.com');
        await page.fill('input[type="password"]', 'wrongpass');
        await page.click('button:has-text("Login")');

        // Check for toast message (vue-toastification usually has a container)
        const toast = page.locator('.Vue-Toastification__toast--error');
        await expect(toast).toBeVisible();
        await expect(toast).toContainText('Invalid credentials');
    });

    test('should handle registration and OTP', async ({ page }) => {
        // Mock registration
        await page.route('**/api/auth/register', async route => {
            await route.fulfill({
                status: 201,
                body: JSON.stringify({ success: true, data: { user_id: '123', status: 'PENDING_VERIFICATION' } })
            });
        });

        // Mock OTP verification
        await page.route('**/api/auth/verify-registration', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    success: true,
                    data: {
                        access_token: 'mock-access-token',
                        user: { user_id: '123', email: 'new@example.com' }
                    }
                })
            });
        });

        await page.goto('/register');
        await page.fill('input[placeholder*="email"]', 'new@example.com');
        await page.fill('input[placeholder*="phone"]', '+6591234567');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Register")');

        // Should show OTP input (check for "OTP" text or similar)
        await expect(page).toHaveURL(/\/verify-registration/);
        await page.fill('input[placeholder*="code"]', '123456');
        await page.click('button:has-text("Verify")');

        await expect(page).toHaveURL('/');
    });
});
