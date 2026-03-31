import { test, expect } from '@playwright/test';
import {
    setupConsoleMonitoring,
    assertNoConsoleErrors,
} from './setup/console-monitor';

/**
 * Client-Side Validation Tests
 *
 * Tests form validation without backend interaction:
 * - Registration form with invalid email formats
 * - Login form with empty fields
 * - Password validation
 * - Phone number validation
 */
test.describe('Client-Side Validation', () => {
    test.beforeEach(async ({ page }) => {
        setupConsoleMonitoring(page);
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    test.describe('Registration Form Validation', () => {
        test('should show error for invalid email format', async ({ page }) => {
            await page.goto('/register');

            // Fill with invalid email (no @ symbol)
            await page.fill('input[type="email"], input[placeholder*="email"], input[name="email"]', 'invalid-email');
            await page.fill('input[type="password"], input[placeholder*="password"], input[name="password"]', 'password123');
            await page.fill('input[placeholder*="Confirm"], input[name="confirmPassword"]', 'password123');
            await page.fill('input[type="tel"], input[placeholder*="phone"], input[name="phone"]', '+1234567890');

            // Submit the form
            await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Register")');

            // Should show validation error
            await expect(page.locator('text=invalid, text=Invalid email, text=valid email, text=Must be a valid email')).toBeVisible({ timeout: 5000 });
        });

        test('should show error for empty email field', async ({ page }) => {
            await page.goto('/register');

            // Leave email empty
            await page.fill('input[type="password"], input[placeholder*="password"], input[name="password"]', 'password123');
            await page.fill('input[placeholder*="Confirm"], input[name="confirmPassword"]', 'password123');
            await page.fill('input[type="tel"], input[placeholder*="phone"], input[name="phone"]', '+1234567890');

            // Submit the form
            await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Register")');

            // Should show validation error for required field
            await expect(page.locator('text=required, text=Required, text=must not be empty, text=email is required')).toBeVisible({ timeout: 5000 });
        });

        test('should show error for empty password field', async ({ page }) => {
            await page.goto('/register');

            await page.fill('input[type="email"], input[placeholder*="email"], input[name="email"]', 'test@example.com');
            // Leave password empty
            await page.fill('input[placeholder*="Confirm"], input[name="confirmPassword"]', 'password123');
            await page.fill('input[type="tel"], input[placeholder*="phone"], input[name="phone"]', '+1234567890');

            // Submit the form
            await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Register")');

            // Should show validation error for required password
            await expect(page.locator('text=password is required, text=password required, text=Password is required')).toBeVisible({ timeout: 5000 });
        });

        test('should show error for mismatched passwords', async ({ page }) => {
            await page.goto('/register');

            await page.fill('input[type="email"], input[placeholder*="email"], input[name="email"]', 'test@example.com');
            await page.fill('input[type="password"], input[placeholder*="password"], input[name="password"]', 'password123');
            await page.fill('input[placeholder*="Confirm"], input[name="confirmPassword"]', 'different-password');
            await page.fill('input[type="tel"], input[placeholder*="phone"], input[name="phone"]', '+1234567890');

            // Submit the form
            await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Register")');

            // Should show password mismatch error
            await expect(page.locator('text=passwords do not match, text=Password mismatch, text=Passwords must match, text=confirm password')).toBeVisible({ timeout: 5000 });
        });

        test('should show error for short password', async ({ page }) => {
            await page.goto('/register');

            await page.fill('input[type="email"], input[placeholder*="email"], input[name="email"]', 'test@example.com');
            await page.fill('input[type="password"], input[placeholder*="password"], input[name="password"]', '123');
            await page.fill('input[placeholder*="Confirm"], input[name="confirmPassword"]', '123');
            await page.fill('input[type="tel"], input[placeholder*="phone"], input[name="phone"]', '+1234567890');

            // Submit the form
            await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Register")');

            // Should show password length error
            await expect(page.locator('text=password must be at least, text=minimum 6 characters, text=too short, text=at least 6')).toBeVisible({ timeout: 5000 });
        });

        test('should show error for invalid phone number', async ({ page }) => {
            await page.goto('/register');

            await page.fill('input[type="email"], input[placeholder*="email"], input[name="email"]', 'test@example.com');
            await page.fill('input[type="password"], input[placeholder*="password"], input[name="password"]', 'password123');
            await page.fill('input[placeholder*="Confirm"], input[name="confirmPassword"]', 'password123');
            await page.fill('input[type="tel"], input[placeholder*="phone"], input[name="phone"]', 'invalid-phone');

            // Submit the form
            await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Register")');

            // Should show phone validation error
            await expect(page.locator('text=invalid phone, text=Invalid phone, text=phone number, text=valid phone')).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('Login Form Validation', () => {
        test('should show error for empty email on login', async ({ page }) => {
            await page.goto('/login');

            // Leave email empty
            await page.fill('input[type="password"], input[placeholder*="password"], input[name="password"]', 'password123');

            // Submit the form
            await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

            // Should show validation error
            await expect(page.locator('text=email is required, text=Email is required, text=required')).toBeVisible({ timeout: 5000 });
        });

        test('should show error for empty password on login', async ({ page }) => {
            await page.goto('/login');

            await page.fill('input[type="email"], input[placeholder*="email"], input[name="email"]', 'test@example.com');
            // Leave password empty

            // Submit the form
            await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

            // Should show validation error
            await expect(page.locator('text=password is required, text=Password is required, text=required')).toBeVisible({ timeout: 5000 });
        });

        test('should show error for invalid email format on login', async ({ page }) => {
            await page.goto('/login');

            await page.fill('input[type="email"], input[placeholder*="email"], input[name="email"]', 'invalid-email');
            await page.fill('input[type="password"], input[placeholder*="password"], input[name="password"]', 'password123');

            // Submit the form
            await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

            // Should show validation error
            await expect(page.locator('text=invalid email, text=Invalid email, text=valid email, text=Must be a valid email')).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('Form Accessibility', () => {
        test('registration form should have proper labels', async ({ page }) => {
            await page.goto('/register');

            // Check that form inputs have associated labels
            const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]').first();
            await expect(emailInput).toBeVisible();

            // Check for aria-label or associated label
            const hasAriaLabel = await emailInput.evaluate(el => el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby'));
            const hasId = await emailInput.evaluate(el => el.id !== '');

            if (!hasAriaLabel) {
                // If no aria-label, should have id for label association
                expect(hasId || await emailInput.evaluate(el => el.parentElement?.querySelector('label') !== null)).toBeTruthy();
            }
        });

        test('login form should have proper labels', async ({ page }) => {
            await page.goto('/login');

            const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]').first();
            await expect(emailInput).toBeVisible();

            const hasAriaLabel = await emailInput.evaluate(el => el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby'));
            const hasId = await emailInput.evaluate(el => el.id !== '');

            if (!hasAriaLabel) {
                expect(hasId || await emailInput.evaluate(el => el.parentElement?.querySelector('label') !== null)).toBeTruthy();
            }
        });
    });
});
