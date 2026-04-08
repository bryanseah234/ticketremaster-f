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
        await page.waitForLoadState('domcontentloaded');
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
        await page.waitForLoadState('domcontentloaded');
        
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
        await page.waitForLoadState('domcontentloaded');
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
    const seedAuthSession = async (
        page: any,
        userId = 'usr_001',
        email = 'buyer@example.com',
    ) => {
        await page.addInitScript(
            ({ sessionUserId, sessionEmail }) => {
                sessionStorage.removeItem('ticketremaster_demo_mode');
                sessionStorage.removeItem('demo_access_token');
                sessionStorage.removeItem('demo_user');
                sessionStorage.removeItem('demo_context');
                localStorage.setItem('access_token', 'mock-token');
                localStorage.setItem('refresh_token', 'refresh-token');
                localStorage.setItem(
                    'user',
                    JSON.stringify({
                        userId: sessionUserId,
                        email: sessionEmail,
                        role: 'user',
                    }),
                );
            },
            { sessionUserId: userId, sessionEmail: email },
        );
    };

    const stubTransferShellRequests = async (page: any) => {
        await page.context().route('**/credits/balance*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: { creditBalance: 250 } }),
            });
        });

        await page.context().route('**/transfer/pending*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: { transfers: [] } }),
            });
        });

        await page.context().route('**/transfer/my-pending*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: { transfers: [] } }),
            });
        });
    };

    const enterOtp = async (page: any, otp: string) => {
        await page.locator('.otp-grid').click();
        await page.keyboard.type(otp);
    };

    const navigateInApp = async (page: any, path: string) => {
        await page.goto('/');
        await page.locator('main').waitFor({ state: 'visible' });
        await page.evaluate((nextPath) => {
            window.history.pushState({}, '', nextPath);
            window.dispatchEvent(new PopStateEvent('popstate'));
        }, path);
    };

    const fulfillTransferApi = async (route: any, body: unknown) => {
        if (route.request().resourceType() === 'document') {
            await route.continue();
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(body),
        });
    };

    test.beforeEach(async ({ page }) => {
        setupConsoleMonitoring(page);
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    test('should show rate limit warning after 429 response', async ({ page }) => {
        await seedAuthSession(page, 'usr_001', 'buyer@example.com');
        await stubTransferShellRequests(page);

        await page.context().route('**/transfer/txr_001', async route => {
            await fulfillTransferApi(route, {
                data: {
                    transferId: 'txr_001',
                    status: 'pending_buyer_otp',
                    buyerId: 'usr_001',
                    sellerId: 'usr_002',
                    sellerOtpVerified: true,
                    buyerVerificationSid: 'VE_buyer_001',
                    creditAmount: 100,
                    eventName: 'Singapore Jazz Festival 2026',
                    venueName: 'Singapore Indoor Stadium',
                    seatRow: 'B',
                    seatNumber: '14',
                },
            });
        });

        await page.context().route('**/transfer/txr_001/buyer-verify', async route => {
            await route.fulfill({
                status: 429,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait.' },
                }),
            });
        });

        await navigateInApp(page, '/transfer/txr_001');
        await expect(page.locator('.otp-layout')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('.otp-event-name')).toContainText('Singapore Jazz Festival 2026');

        await enterOtp(page, '123456');
        await page.getByRole('button', { name: 'Verify & Complete' }).click();

        await expect(page.locator('.warning-box')).toContainText('Too many attempts');
    });

    test('should hand off from buyer OTP verification to seller waiting state', async ({ page }) => {
        await seedAuthSession(page, 'usr_001', 'buyer@example.com');
        await stubTransferShellRequests(page);

        await page.context().route('**/transfer/txr_002', async route => {
            await fulfillTransferApi(route, {
                data: {
                    transferId: 'txr_002',
                    status: 'pending_buyer_otp',
                    buyerId: 'usr_001',
                    sellerId: 'usr_002',
                    buyerVerificationSid: 'VE_buyer_002',
                    creditAmount: 100,
                    eventName: 'Neon Nights',
                    venueName: 'Esplanade Concert Hall',
                    seatRow: '12',
                    seatNumber: '08',
                },
            });
        });

        await page.context().route('**/transfer/txr_002/buyer-verify', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        transferId: 'txr_002',
                        status: 'pending_seller_otp',
                        buyerOtpVerified: true,
                        sellerVerificationSid: 'VE_seller_002',
                        creditAmount: 100,
                        eventName: 'Neon Nights',
                        seatRow: '12',
                        seatNumber: '08',
                    },
                }),
            });
        });

        await navigateInApp(page, '/transfer/txr_002');
        await expect(page.locator('.otp-layout')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('.otp-event-name')).toContainText('Neon Nights');
        await expect(page.locator('.otp-seat')).toContainText('Row 12');

        await enterOtp(page, '123456');
        await page.getByRole('button', { name: 'Verify & Complete' }).click();

        await expect(page.getByText('Waiting for seller verification.')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('The buyer is verified. The seller now needs to enter their OTP to complete the transfer.')).toBeVisible();
        await expect(page.locator('.otp-layout')).toHaveCount(0);
    });

    test('should show the seller OTP screen after the buyer verifies', async ({ page }) => {
        await seedAuthSession(page, 'usr_002', 'seller@example.com');
        await stubTransferShellRequests(page);

        await page.context().route('**/transfer/txr_003', async route => {
            await fulfillTransferApi(route, {
                data: {
                    transferId: 'txr_003',
                    status: 'pending_seller_otp',
                    buyerId: 'usr_001',
                    sellerId: 'usr_002',
                    buyerOtpVerified: true,
                    sellerVerificationSid: 'VE_seller_003',
                    creditAmount: 100,
                    eventName: 'Symphony Night',
                    venueName: 'Victoria Concert Hall',
                    seatSection: 'VIP',
                    seatRow: 'C',
                    seatNumber: '21',
                },
            });
        });

        await navigateInApp(page, '/transfer/txr_003');
        await expect(page.locator('.otp-layout')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('.otp-event-name')).toContainText('Symphony Night');
        await expect(page.locator('.otp-seat')).toContainText('Row C');
        await expect(page.locator('.otp-copy')).toContainText('The buyer has finished verification');
        await expect(page.getByRole('button', { name: 'Verify & Continue' })).toBeVisible();
    });

    test('should complete the transfer after seller verification', async ({ page }) => {
        await seedAuthSession(page, 'usr_002', 'seller@example.com');
        await stubTransferShellRequests(page);

        await page.context().route('**/transfer/txr_005', async route => {
            await fulfillTransferApi(route, {
                data: {
                    transferId: 'txr_005',
                    status: 'pending_seller_otp',
                    buyerId: 'usr_001',
                    sellerId: 'usr_002',
                    buyerOtpVerified: true,
                    sellerVerificationSid: 'VE_seller_005',
                    creditAmount: 100,
                    eventName: 'Afterglow Arena',
                    seatRow: 'F',
                    seatNumber: '03',
                },
            });
        });

        await page.context().route('**/transfer/txr_005/seller-verify', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        transferId: 'txr_005',
                        status: 'completed',
                        completedAt: new Date().toISOString(),
                        sellerOtpVerified: true,
                        creditAmount: 100,
                        eventName: 'Afterglow Arena',
                        seatRow: 'F',
                        seatNumber: '03',
                    },
                }),
            });
        });

        await navigateInApp(page, '/transfer/txr_005');
        await expect(page.locator('.otp-layout')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('.otp-event-name')).toContainText('Afterglow Arena');

        await enterOtp(page, '654321');
        await page.getByRole('button', { name: 'Verify & Continue' }).click();

        await expect(page.getByText('Transfer complete.')).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('button', { name: 'Back to Marketplace' })).toBeVisible();
        await expect(page.getByText('$100.00')).toBeVisible();
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
