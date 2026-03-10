import { test, expect } from '@playwright/test';

test.describe('Purchase Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Mock user login session for all tests
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('access_token', 'mock-token');
            localStorage.setItem('refresh_token', 'refresh-token');
            localStorage.setItem('user', JSON.stringify({ user_id: 'u1', email: 'test@example.com', credit_balance: 500 }));
        });
    });

    test('should reserve a seat and pay successfully', async ({ page }) => {
        // Mock reserve
        await page.route('**/api/reserve', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: { order_id: 'o1', status: 'HELD' } }) });
        });

        // Mock pay
        await page.route('**/api/pay', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: { status: 'CONFIRMED' } }) });
        });

        await page.goto('/events/e1/seats');
        await page.click('button:has-text("A-1")');
        await page.click('button:has-text("Reserve")');

        await expect(page.locator('h1')).toHaveText(/Checkout/);
        await page.click('button:has-text("Confirm Payment")');

        await expect(page).toHaveURL(/\/profile/);
        await expect(page.locator('text=Purchase confirmed')).toBeVisible();
    });

    test('should handle SEAT_UNAVAILABLE (409)', async ({ page }) => {
        await page.route('**/api/reserve', async route => {
            await route.fulfill({
                status: 409,
                body: JSON.stringify({ success: false, error_code: 'SEAT_UNAVAILABLE', message: 'Seat is held by another user' })
            });
        });

        await page.goto('/events/e1/seats');
        await page.click('button:has-text("A-1")');
        await page.click('button:has-text("Reserve")');

        const toast = page.locator('.Vue-Toastification__toast--error');
        await expect(toast).toContainText('Seat is currently unavailable');
    });

    test('should handle INSUFFICIENT_CREDITS (402)', async ({ page }) => {
        // Mock checkout page load (balance check)
        await page.route('**/api/credits/balance', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: { credit_balance: 10 } }) });
        });

        await page.route('**/api/pay', async route => {
            await route.fulfill({
                status: 402,
                body: JSON.stringify({ success: false, error_code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits' })
            });
        });

        await page.goto('/checkout/o1');
        await page.click('button:has-text("Confirm Payment")');

        const toast = page.locator('.Vue-Toastification__toast--error');
        await expect(toast).toContainText('Not enough credits');
    });

    test('should handle OTP_REQUIRED (428)', async ({ page }) => {
        await page.route('**/api/pay', async route => {
            await route.fulfill({
                status: 428,
                body: JSON.stringify({ success: false, error_code: 'OTP_REQUIRED', message: 'OTP verification required' })
            });
        });

        await page.goto('/checkout/o1');
        await page.click('button:has-text("Confirm Payment")');

        // Should show OTP input (redirect or modal)
        await expect(page).toHaveURL(/\/verify-otp/);
        await expect(page.locator('text=OTP verification required')).toBeVisible();
    });

    test('should handle HOLD_EXPIRED (410)', async ({ page }) => {
        await page.route('**/api/pay', async route => {
            await route.fulfill({
                status: 410,
                body: JSON.stringify({ success: false, error_code: 'HOLD_EXPIRED', message: 'Seat hold expired' })
            });
        });

        await page.goto('/checkout/o1');
        await page.click('button:has-text("Confirm Payment")');

        const toast = page.locator('.Vue-Toastification__toast--error');
        await expect(toast).toContainText('Your seat hold expired');
    });
});
