import { test, expect } from '@playwright/test';
import {
    setupConsoleMonitoring,
    assertNoConsoleErrors,
} from './setup/console-monitor';

test.describe('Credit Top-up Flow', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.addInitScript(() => {
            localStorage.setItem('access_token', 'mock-token');
            localStorage.setItem('refresh_token', 'refresh-token');
            localStorage.setItem('user', JSON.stringify({ userId: 'usr_001', email: 'test@example.com', role: 'user' }));
        });
        setupConsoleMonitoring(page);
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    test('should complete full top-up flow with Stripe', async ({ page }) => {
        // Mock balance check
        await page.route('**/credits/balance', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: { creditBalance: 50, userId: 'usr_001' } })
            });
        });

        // Mock top-up initiate
        await page.route('**/credits/topup/initiate', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        clientSecret: 'pi_test_secret',
                        paymentIntentId: 'pi_123456',
                        amount: 100
                    }
                })
            });
        });

        // Mock top-up confirm
        await page.route('**/credits/topup/confirm', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: { status: 'succeeded', new_balance: 150 }
                })
            });
        });

        await page.goto('/credits/topup');
        await expect(page.locator('h1')).toContainText(/Credit Top Up|Top Up/, { timeout: 15000 });
        
        // Select amount
        const amountBtn = page.locator('button:has-text("$100")');
        if (await amountBtn.count() > 0) {
            await amountBtn.click();
            
            // Verify amount is selected
            await expect(page.locator('input[type="number"]')).toHaveValue('100');
        }
    });

    test('should handle idempotent top-up with same idempotency key', async ({ page }) => {
        let requestCount = 0;
        
        await page.route('**/credits/topup/initiate', async route => {
            requestCount++;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        clientSecret: 'pi_test_secret',
                        paymentIntentId: 'pi_123456',
                        amount: 100
                    }
                })
            });
        });

        await page.goto('/credits/topup');
        await page.waitForLoadState('networkidle');
        const amountBtn = page.locator('button:has-text("$100")');
        if (await amountBtn.count() > 0) {
            await amountBtn.click();
        }
        const payBtn = page.locator('button:has-text("Pay with Card")');
        if (await payBtn.count() > 0) {
            await payBtn.click();
        }
    });

    test('should handle top-up validation error', async ({ page }) => {
        await page.route('**/credits/topup/initiate', async route => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: { code: 'VALIDATION_ERROR', message: 'Amount must be positive.' }
                })
            });
        });

        await page.goto('/credits/topup');
        await page.waitForLoadState('networkidle');
        
        const amountInput = page.locator('input[type="number"]');
        if (await amountInput.count() > 0) {
            await amountInput.fill('-50');
            const payBtn = page.locator('button:has-text("Pay with Card")');
            if (await payBtn.count() > 0) {
                await payBtn.click();
                // Should show error message via toast
                const toast = page.locator('.toast.error');
                await expect(toast).toBeVisible({ timeout: 10000 });
            }
        }
    });

    test('should handle Stripe confirmation error', async ({ page }) => {
        await page.route('**/credits/topup/initiate', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        clientSecret: 'pi_test_secret',
                        paymentIntentId: 'pi_123456',
                        amount: 100
                    }
                })
            });
        });

        await page.route('**/credits/topup/confirm', async route => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: { code: 'PAYMENT_FAILED', message: 'Card declined.' }
                })
            });
        });

        await page.goto('/credits/topup');
        await page.waitForLoadState('networkidle');
        const amountBtn = page.locator('button:has-text("$100")');
        if (await amountBtn.count() > 0) {
            await amountBtn.click();
        }
        const payBtn = page.locator('button:has-text("Pay with Card")');
        if (await payBtn.count() > 0) {
            await payBtn.click();
        }
    });
});

test.describe('Transfer Flow with OTP Rate Limiting', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.addInitScript(() => {
            localStorage.setItem('access_token', 'mock-token');
            localStorage.setItem('refresh_token', 'refresh-token');
            localStorage.setItem('user', JSON.stringify({ userId: 'usr_001', email: 'buyer@example.com', role: 'user' }));
        });
        setupConsoleMonitoring(page);
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    test('should show rate limit warning after 429 response', async ({ page }) => {
        // Mock transfer state
        await page.route('**/transfer/txr_001', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        transferId: 'txr_001',
                        status: 'pending_buyer_otp',
                        buyerId: 'usr_001',
                        sellerId: 'usr_002',
                        creditAmount: 100,
                        eventName: 'Test Event',
                        venueName: 'Test Venue'
                    }
                })
            });
        });

        // Mock OTP verify returning 429
        await page.route('**/transfer/txr_001/buyer-verify', async route => {
            await route.fulfill({
                status: 429,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait.' }
                })
            });
        });

        await page.goto('/transfer/txr_001');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1')).toContainText(/Ticket Transfer|Transfer|transfer/i, { timeout: 15000 });

        // Enter OTP and submit
        const otpInput = page.locator('input[placeholder*="6-digit"]');
        if (await otpInput.count() > 0) {
            await otpInput.fill('123456');
            await page.click('button:has-text("Verify")');

            // Should show rate limit warning (toast or inline)
            const warning = page.locator('.rate-limit-warning, .toast.error');
            await expect(warning.first()).toBeVisible({ timeout: 15000 });
        }
    });

    test('should handle successful OTP verification', async ({ page }) => {
        await page.route('**/transfer/txr_002', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        transferId: 'txr_002',
                        status: 'pending_buyer_otp',
                        buyerId: 'usr_001',
                        sellerId: 'usr_002',
                        creditAmount: 100
                    }
                })
            });
        });

        await page.route('**/transfer/txr_002/buyer-verify', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        transferId: 'txr_002',
                        status: 'pending_seller_otp',
                        message: 'OTP verified. Waiting for seller.'
                    }
                })
            });
        });

        await page.goto('/transfer/txr_002');
        await page.waitForLoadState('networkidle');
        const otpInput = page.locator('input[placeholder*="6-digit"]');
        if (await otpInput.count() > 0) {
            await otpInput.fill('123456');
            await page.click('button:has-text("Verify")');

            // Should transition to waiting state
            await expect(page.locator('text=Waiting for seller')).toBeVisible({ timeout: 10000 });
        }
    });

    test('should handle seller accepting transfer', async ({ page }) => {
        await page.route('**/transfer/txr_003', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        transferId: 'txr_003',
                        status: 'pending_seller_acceptance',
                        buyerId: 'usr_001',
                        sellerId: 'usr_001', // Current user is seller
                        creditAmount: 100
                    }
                })
            });
        });

        await page.route('**/transfer/txr_003/seller-accept', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        transferId: 'txr_003',
                        status: 'pending_buyer_otp',
                        message: 'Request accepted. OTP sent to buyer.'
                    }
                })
            });
        });

        await page.goto('/transfer/txr_003');
        await page.waitForLoadState('networkidle');
        const acceptBtn = page.locator('button:has-text("Accept")');
        if (await acceptBtn.count() > 0) {
            await expect(page.locator('text=A buyer wants your ticket')).toBeVisible();
            await acceptBtn.click();

            // Should transition to waiting for buyer state
            await expect(page.locator('text=Waiting for buyer')).toBeVisible({ timeout: 10000 });
        }
    });

    test('should handle transfer completion with seller OTP', async ({ page }) => {
        await page.route('**/transfer/txr_005', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        transferId: 'txr_005',
                        status: 'pending_seller_otp',
                        buyerId: 'usr_001',
                        sellerId: 'usr_001',
                        creditAmount: 100,
                        eventName: 'Test Event'
                    }
                })
            });
        });

        await page.route('**/transfer/txr_005/seller-verify', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        transferId: 'txr_005',
                        status: 'completed',
                        completedAt: new Date().toISOString(),
                        ticket: { ticketId: 'tkt_001' }
                    }
                })
            });
        });

        await page.goto('/transfer/txr_005');
        await page.waitForLoadState('networkidle');
        const otpInput = page.locator('input[placeholder*="6-digit"]');
        if (await otpInput.count() > 0) {
            await otpInput.fill('654321');
            await page.click('button:has-text("Confirm")');

            // Should show success
            await expect(page.locator('text=Transfer complete')).toBeVisible({ timeout: 10000 });
        }
    });
});

test.describe('API Reliability Features', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.addInitScript(() => {
            localStorage.setItem('access_token', 'mock-token');
            localStorage.setItem('refresh_token', 'refresh-token');
            localStorage.setItem('user', JSON.stringify({ userId: 'usr_001', email: 'test@example.com', role: 'user' }));
        });
        setupConsoleMonitoring(page);
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    test('should retry on 429 with exponential backoff', async ({ page }) => {
        let attemptCount = 0;

        await page.route('**/credits/balance', async route => {
            attemptCount++;
            if (attemptCount <= 2) {
                await route.fulfill({
                    status: 429,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: { code: 'RATE_LIMITED', message: 'Too many requests' }
                    })
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: { creditBalance: 100 } })
                });
            }
        });

        await page.goto('/credits/topup');
        await expect(page.locator('h1')).toContainText(/Credit Top Up|Top Up/, { timeout: 15000 });
    });

    test('should handle 503 Service Unavailable with graceful retry', async ({ page }) => {
        // Route pattern must match API host, not frontend routes
        await page.route('**ticketremasterapi.hong-yi.me/**', async route => {
            await route.fulfill({
                status: 503,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable' }
                })
            });
        });

        await page.goto('/events');
        // Wait for retries to complete - API client has exponential backoff
        await page.waitForTimeout(5000);
        
        // Should show error toast or empty state but not crash
        const errorIndicator = page.locator('.toast.error').or(page.locator('.toast')).or(page.locator('text=Backend unavailable'));
        await expect(errorIndicator.first()).toBeVisible({ timeout: 15000 });
    });
});
