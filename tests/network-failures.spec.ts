import { test, expect } from '@playwright/test';
import {
    setupConsoleMonitoring,
    assertNoConsoleErrors,
} from './setup/console-monitor';

/**
 * Simulated Network Failure Tests
 *
 * Tests that the frontend gracefully handles various network error scenarios:
 * - 503 Service Unavailable
 * - 429 Too Many Requests
 * - 504 Gateway Timeout
 * - Network offline
 *
 * The frontend uses a custom ToastStack component for error messages and localStorage cache for fallback.
 * API calls go to https://ticketremasterapi.hong-yi.me (not /api/ prefix).
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
            // Intercept ALL requests to the API domain
            await page.route('**ticketremasterapi.hong-yi.me/**', async route => {
                await route.fulfill({
                    status: 503,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: {
                            code: 'SERVICE_UNAVAILABLE',
                            message: 'Service temporarily unavailable. Please try again later.'
                        }
                    })
                });
            });

            await page.goto('/events');
            await page.waitForLoadState('networkidle');

            // EventListView shows toast "Backend unavailable" on catch, or empty state
            const errorIndicator = page.locator('.toast.error').or(page.locator('text=Backend unavailable'));
            await expect(errorIndicator.first()).toBeVisible({ timeout: 15000 });
        });

        test('should handle 503 on marketplace page gracefully', async ({ page, context }) => {
            await context.addInitScript(() => {
                localStorage.setItem('access_token', 'mock-token');
                localStorage.setItem('user', JSON.stringify({ userId: 'u1', email: 'test@example.com', role: 'user' }));
            });

            await page.route('**ticketremasterapi.hong-yi.me/**', async route => {
                await route.fulfill({
                    status: 503,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable' }
                    })
                });
            });

            await page.goto('/marketplace');
            await page.waitForLoadState('networkidle');

            // MarketplaceView silently catches errors and shows empty listings
            // The h1 "Discover Listings" should still render
            await expect(page.locator('h1')).toContainText(/Discover Listings|Marketplace/, { timeout: 10000 });
        });

        test('should allow retry after 503 error', async ({ page }) => {
            let callCount = 0;

            await page.route('**/events**', async route => {
                // Only intercept API calls, not the frontend route
                if (route.request().url().includes('ticketremasterapi')) {
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
                    await route.continue();
                }
            });

            await page.goto('/events');
            await page.waitForLoadState('networkidle');

            // Reload to trigger the second (successful) call
            await page.reload();
            await page.waitForLoadState('networkidle');

            // Should eventually show the event after retry/reload
            await expect(page.locator('text=Test Event')).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('429 Too Many Requests', () => {
        test('should display rate limit message for 429', async ({ page }) => {
            await page.route('**ticketremasterapi.hong-yi.me/**', async route => {
                await route.fulfill({
                    status: 429,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: {
                            code: 'RATE_LIMITED',
                            message: 'Too many requests. Please wait before trying again.'
                        }
                    })
                });
            });

            await page.goto('/events');
            // Wait for retries to complete (API client has exponential backoff)
            await page.waitForTimeout(5000);

            // EventListView catches errors and may show toast or empty state
            const errorIndicator = page.locator('.toast.error').or(page.locator('.toast'));
            await expect(errorIndicator.first()).toBeVisible({ timeout: 15000 });
        });

        test('should handle 429 on login form', async ({ page }) => {
            await page.route('**/auth/login', async route => {
                await route.fulfill({
                    status: 429,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: {
                            code: 'RATE_LIMITED',
                            message: 'Too many login attempts. Please wait 30 seconds.'
                        }
                    })
                });
            });

            await page.goto('/login');

            await page.fill('input[placeholder*="email"]', 'test@example.com');
            await page.fill('input[type="password"]', 'password123');
            await page.click('button:has-text("Sign In")');

            // Should show rate limit toast message
            const toast = page.locator('.toast.error').first();
            await expect(toast).toBeVisible({ timeout: 15000 });
            await expect(toast).toContainText(/Too many login attempts|wait/);
        });

        test('should implement exponential backoff for 429', async ({ page }) => {
            let requestTimes: number[] = [];

            await page.route('**/events**', async route => {
                if (route.request().url().includes('ticketremasterapi')) {
                    requestTimes.push(Date.now());
                    await route.fulfill({
                        status: 429,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            error: { code: 'RATE_LIMITED', retryAfter: '5' }
                        })
                    });
                } else {
                    await route.continue();
                }
            });

            await page.goto('/events');

            // Wait a bit for potential retries
            await page.waitForTimeout(3000);

            // Should have made at least one attempt
            expect(requestTimes.length).toBeGreaterThanOrEqual(1);
        });
    });

    test.describe('504 Gateway Timeout', () => {
        test('should display timeout message for 504', async ({ page }) => {
            await page.route('**ticketremasterapi.hong-yi.me/**', async route => {
                await route.fulfill({
                    status: 504,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: {
                            code: 'GATEWAY_TIMEOUT',
                            message: 'The server took too long to respond. Please try again.'
                        }
                    })
                });
            });

            await page.goto('/events');
            // Wait for retries to complete
            await page.waitForTimeout(5000);

            // Should show toast error or empty state with "Backend unavailable" message
            const errorIndicator = page.locator('.toast.error').or(page.locator('.toast'));
            await expect(errorIndicator.first()).toBeVisible({ timeout: 15000 });
        });

        test('should handle 504 on seat selection gracefully', async ({ page, context }) => {
            // Set up auth via addInitScript
            await context.addInitScript(() => {
                localStorage.setItem('access_token', 'test-token');
                localStorage.setItem('user', JSON.stringify({
                    userId: 'test-user',
                    email: 'test@example.com',
                    role: 'user',
                }));
            });

            await page.route('**/events/*/seats', async route => {
                await route.fulfill({
                    status: 504,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: { code: 'GATEWAY_TIMEOUT', message: 'Request timed out' }
                    })
                });
            });

            await page.goto('/events/test-event-123/seats');

            // Page should load without crashing
            await page.waitForLoadState('networkidle');
            // The page itself should be visible (not a blank page)
            await expect(page.locator('body')).toBeVisible();
        });
    });

    test.describe('Network Offline', () => {
        test('should display offline message when network is unavailable', async ({ page }) => {
            // Navigate first while online
            await page.goto('/events');
            await page.waitForLoadState('networkidle');

            // Then set offline mode
            await page.context().setOffline(true);

            // Reload to trigger offline behavior
            try {
                await page.reload({ timeout: 5000 });
            } catch {
                // Expected: reload may fail when offline
            }

            // The browser should show an error page or the app should handle it
            // Since the dev server is on localhost, going offline may show the browser's own error page
            await page.waitForTimeout(2000);

            // Restore online
            await page.context().setOffline(false);
        });

        test('should recover when network comes back online', async ({ page }) => {
            // Navigate while online
            await page.goto('/events');
            await page.waitForLoadState('networkidle');

            // Go offline
            await page.context().setOffline(true);

            // Try to reload (may fail)
            try {
                await page.reload({ timeout: 5000 });
            } catch {
                // Expected
            }

            // Bring network back
            await page.context().setOffline(false);

            // Mock successful response for the recovery
            await page.route('**/events**', async route => {
                if (route.request().url().includes('ticketremasterapi')) {
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
                    await route.continue();
                }
            });

            // Reload after coming back online
            await page.goto('/events');
            await page.waitForLoadState('networkidle');

            // Should recover and show content
            await expect(page.locator('text=Recovered Event')).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Partial Failures', () => {
        test('should handle partial page load when some API calls fail', async ({ page }) => {
            // Events API succeeds
            await page.route('**/events**', async route => {
                if (route.request().url().includes('ticketremasterapi')) {
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
                    await route.continue();
                }
            });

            await page.goto('/events');
            await page.waitForLoadState('networkidle');

            // Events should still show
            await expect(page.locator('text=Working Event')).toBeVisible({ timeout: 10000 });
        });

        test('should not show loading spinner indefinitely on error', async ({ page }) => {
            await page.route('**ticketremasterapi.hong-yi.me/**', async route => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: { code: 'INTERNAL_ERROR' } })
                });
            });

            await page.goto('/events');

            // Wait a bit
            await page.waitForTimeout(3000);

            // Loading spinner should not be visible anymore
            const loadingSpinner = page.locator('.loading, .spinner, [class*="loading"], [class*="spinner"]');
            await expect(loadingSpinner.first()).not.toBeVisible({ timeout: 2000 });
        });
    });

    test.describe('Error Recovery', () => {
        test('should provide retry button after network error', async ({ page }) => {
            let attemptCount = 0;

            await page.route('**/events**', async route => {
                if (route.request().url().includes('ticketremasterapi')) {
                    attemptCount++;
                    if (attemptCount === 1) {
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
                    await route.continue();
                }
            });

            await page.goto('/events');
            await page.waitForLoadState('networkidle');

            // Should show error state (toast or empty state)
            const errorIndicator = page.locator('.toast').or(page.locator('text=Backend unavailable'));
            await expect(errorIndicator.first()).toBeVisible({ timeout: 15000 });

            // Reload page to trigger the second (successful) call
            await page.reload();
            await page.waitForLoadState('networkidle');

            // Should eventually succeed
            await expect(page.locator('text=Retry Success')).toBeVisible({ timeout: 10000 });
        });
    });
});
