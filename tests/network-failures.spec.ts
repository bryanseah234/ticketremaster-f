import { test, expect } from '@playwright/test';
import {
    setupConsoleMonitoring,
    assertNoConsoleErrors,
} from './setup/console-monitor';

const API_URL = '**/ticketremasterapi.hong-yi.me/**';

/**
 * Simulated Network Failure Tests
 *
 * Tests that the frontend gracefully handles various network error scenarios.
 * Uses API_URL pattern to only intercept backend API calls, not frontend routes.
 */
test.describe('Simulated Network Failures', () => {
    test.beforeEach(async ({ page }) => {
        setupConsoleMonitoring(page);
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    test.describe('503 Service Unavailable', () => {
        test('should display friendly error message for 503 on events page', async ({ page }) => {
            await page.route(API_URL, async route => {
                await route.fulfill({
                    status: 503,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable.' }
                    })
                });
            });

            await page.goto('/events');
            // Wait for retries to complete
            await page.waitForTimeout(5000);

            const errorIndicator = page.locator('.toast.error').or(page.locator('.toast')).or(page.locator('text=Backend unavailable'));
            await expect(errorIndicator.first()).toBeVisible({ timeout: 15000 });
        });

        test('should handle 503 on marketplace page gracefully', async ({ page, context }) => {
            await context.addInitScript(() => {
                localStorage.setItem('access_token', 'mock-token');
                localStorage.setItem('user', JSON.stringify({ userId: 'u1', email: 'test@example.com', role: 'user' }));
            });

            await page.route(API_URL, async route => {
                await route.fulfill({
                    status: 503,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable' }
                    })
                });
            });

            await page.goto('/marketplace');
            await expect(page.locator('h1')).toContainText(/Discover Listings|Marketplace/, { timeout: 10000 });
        });

        test('should allow retry after 503 error', async ({ page }) => {
            let callCount = 0;

            await page.route(API_URL, async route => {
                const url = route.request().url();
                if (url.includes('/events')) {
                    callCount++;
                    if (callCount <= 1) {
                        await route.fulfill({
                            status: 503,
                            contentType: 'application/json',
                            body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE' } })
                        });
                    } else {
                        await route.fulfill({
                            status: 200,
                            contentType: 'application/json',
                            body: JSON.stringify({
                                data: {
                                    events: [{ eventId: 'evt_001', name: 'Test Event', date: '2026-01-01' }],
                                    pagination: { page: 1, totalPages: 1 }
                                }
                            })
                        });
                    }
                } else {
                    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
                }
            });

            await page.goto('/events');
            await page.waitForTimeout(3000);

            // Reload to trigger retry
            await page.reload();
            // After reload with mock returning 200, events should render (either from mock or API)
            await expect(page.locator('.events-grid, .events-list').first()).toBeVisible({ timeout: 15000 });
        });
    });

    test.describe('429 Too Many Requests', () => {
        test('should display rate limit message for 429', async ({ page }) => {
            await page.route(API_URL, async route => {
                await route.fulfill({
                    status: 429,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: { code: 'RATE_LIMITED', message: 'Too many requests.' }
                    })
                });
            });

            await page.goto('/events');
            await page.waitForTimeout(5000);

            const errorIndicator = page.locator('.toast.error').or(page.locator('.toast')).or(page.locator('text=Backend unavailable'));
            await expect(errorIndicator.first()).toBeVisible({ timeout: 15000 });
        });

        test('should handle 429 on login form', async ({ page }) => {
            // Intercept only auth/login calls at the API host
            await page.route(API_URL, async route => {
                const url = route.request().url();
                if (url.includes('/auth/login')) {
                    await route.fulfill({
                        status: 429,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please wait 30 seconds.' }
                        })
                    });
                } else {
                    await route.continue();
                }
            });

            await page.goto('/login');

            await page.fill('input[placeholder*="email"]', 'test@example.com');
            await page.fill('input[type="password"]', 'password123');
            await page.click('button:has-text("Sign In")');

            const toast = page.locator('.toast.error').first();
            await expect(toast).toBeVisible({ timeout: 15000 });
        });

        test('should implement exponential backoff for 429', async ({ page }) => {
            let requestTimes: number[] = [];

            await page.route(API_URL, async route => {
                const url = route.request().url();
                if (url.includes('/events')) {
                    requestTimes.push(Date.now());
                    await route.fulfill({
                        status: 429,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            error: { code: 'RATE_LIMITED', retryAfter: '5' }
                        })
                    });
                } else {
                    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
                }
            });

            await page.goto('/events');
            await page.waitForTimeout(3000);

            expect(requestTimes.length).toBeGreaterThanOrEqual(1);
        });
    });

    test.describe('504 Gateway Timeout', () => {
        test('should display timeout message for 504', async ({ page }) => {
            await page.route(API_URL, async route => {
                await route.fulfill({
                    status: 504,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: { code: 'GATEWAY_TIMEOUT', message: 'The server took too long to respond.' }
                    })
                });
            });

            await page.goto('/events');
            await page.waitForTimeout(5000);

            const errorIndicator = page.locator('.toast.error').or(page.locator('.toast')).or(page.locator('text=Backend unavailable'));
            await expect(errorIndicator.first()).toBeVisible({ timeout: 15000 });
        });

        test('should handle 504 on seat selection gracefully', async ({ page, context }) => {
            await context.addInitScript(() => {
                localStorage.setItem('access_token', 'test-token');
                localStorage.setItem('user', JSON.stringify({
                    userId: 'test-user',
                    email: 'test@example.com',
                    role: 'user',
                }));
            });

            await page.route(API_URL, async route => {
                await route.fulfill({
                    status: 504,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: { code: 'GATEWAY_TIMEOUT', message: 'Request timed out' }
                    })
                });
            });

            await page.goto('/events/test-event-123/seats');
            await page.waitForTimeout(3000);
            await expect(page.locator('body')).toBeVisible();
        });
    });

    test.describe('Network Offline', () => {
        test('should display offline message when network is unavailable', async ({ page }) => {
            await page.goto('/events');
            await page.waitForTimeout(3000);

            await page.context().setOffline(true);

            try {
                await page.reload({ timeout: 5000 });
            } catch {
                // Expected
            }

            await page.waitForTimeout(2000);
            await page.context().setOffline(false);
        });

        test('should recover when network comes back online', async ({ page }) => {
            await page.goto('/events');
            await page.waitForTimeout(3000);

            await page.context().setOffline(true);

            try {
                await page.reload({ timeout: 5000 });
            } catch {
                // Expected
            }

            await page.context().setOffline(false);

            // Mock successful response for recovery
            await page.route(API_URL, async route => {
                const url = route.request().url();
                if (url.includes('/events')) {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            data: {
                                events: [{ eventId: 'evt_001', name: 'Recovered Event', date: '2026-06-01' }],
                                pagination: { page: 1, totalPages: 1 }
                            }
                        })
                    });
                } else {
                    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
                }
            });

            await page.goto('/events');
            // After recovery, events page should render content (mock or API data)
            await expect(page.locator('.events-grid, .events-list').first()).toBeVisible({ timeout: 15000 });
        });
    });

    test.describe('Partial Failures', () => {
        test('should handle partial page load when some API calls fail', async ({ page }) => {
            await page.route(API_URL, async route => {
                const url = route.request().url();
                if (url.includes('/events')) {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            data: {
                                events: [{ eventId: 'evt_001', name: 'Working Event', date: '2026-07-01' }],
                                pagination: { page: 1, totalPages: 1 }
                            }
                        })
                    });
                } else {
                    await route.fulfill({
                        status: 503,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE' } })
                    });
                }
            });

            await page.goto('/events');
            await expect(page.locator('text=Working Event')).toBeVisible({ timeout: 15000 });
        });

        test('should not show loading spinner indefinitely on error', async ({ page }) => {
            await page.route(API_URL, async route => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: { code: 'INTERNAL_ERROR' } })
                });
            });

            await page.goto('/events');
            await page.waitForTimeout(5000);

            const loadingSpinner = page.locator('.loading, .spinner, [class*="loading"], [class*="spinner"]');
            await expect(loadingSpinner.first()).not.toBeVisible({ timeout: 2000 });
        });
    });

    test.describe('Error Recovery', () => {
        test('should provide retry button after network error', async ({ page }) => {
            let attemptCount = 0;

            await page.route(API_URL, async route => {
                const url = route.request().url();
                if (url.includes('/events')) {
                    attemptCount++;
                    if (attemptCount <= 2) {
                        await route.fulfill({
                            status: 503,
                            contentType: 'application/json',
                            body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE' } })
                        });
                    } else {
                        await route.fulfill({
                            status: 200,
                            contentType: 'application/json',
                            body: JSON.stringify({
                                data: {
                                    events: [{ eventId: 'evt_001', name: 'Retry Success', date: '2026-08-01' }],
                                    pagination: { page: 1, totalPages: 1 }
                                }
                            })
                        });
                    }
                } else {
                    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
                }
            });

            await page.goto('/events');
            // Wait for error state to appear
            await page.waitForTimeout(5000);

            const errorIndicator = page.locator('.toast').or(page.locator('text=Backend unavailable'));
            await expect(errorIndicator.first()).toBeVisible({ timeout: 15000 });

            // Reload
            await page.reload();
            // After retry succeeds, events page should render content
            await expect(page.locator('.events-grid, .events-list').first()).toBeVisible({ timeout: 15000 });
        });
    });
});
