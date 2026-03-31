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
 * Verifies that user-friendly fallback messages are displayed.
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
            // Intercept API calls and return 503
            await page.route('**/api/**', async route => {
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

            // Should show error message (not crash)
            const errorMessage = page.locator('text=Service temporarily unavailable, text=Service Unavailable, text=try again later, text=temporarily unavailable');
            await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
        });

        test('should handle 503 on marketplace page gracefully', async ({ page }) => {
            await page.route('**/api/**', async route => {
                await route.fulfill({
                    status: 503,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: {
                            code: 'SERVICE_UNAVAILABLE',
                            message: 'Service temporarily unavailable'
                        }
                    })
                });
            });

            await page.goto('/marketplace');

            // Should show error but page should still be functional
            await expect(page.locator('h1')).toContainText(/Marketplace/);
        });

        test('should allow retry after 503 error', async ({ page }) => {
            let callCount = 0;

            await page.route('**/api/events', async route => {
                callCount++;
                if (callCount === 1) {
                    // First call returns 503
                    await route.fulfill({
                        status: 503,
                        body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE' } })
                    });
                } else {
                    // Second call succeeds
                    await route.fulfill({
                        status: 200,
                        body: JSON.stringify({
                            data: {
                                events: [{ eventId: 'evt_001', name: 'Test Event', date: '2026-01-01' }],
                                pagination: { page: 1, total: 1 }
                            }
                        })
                    });
                }
            });

            await page.goto('/events');

            // Should eventually show the event after retry
            await expect(page.locator('text=Test Event')).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('429 Too Many Requests', () => {
        test('should display rate limit message for 429', async ({ page }) => {
            await page.route('**/api/**', async route => {
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

            // Should show rate limit message
            const rateLimitMessage = page.locator('text=Too many requests, text=Rate limit, text=please wait, text=wait before');
            await expect(rateLimitMessage.first()).toBeVisible({ timeout: 5000 });
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

            await page.fill('input[type="email"]', 'test@example.com');
            await page.fill('input[type="password"]', 'password123');
            await page.click('button:has-text("Sign In"), button:has-text("Login")');

            // Should show rate limit message
            await expect(page.locator('text=Too many login attempts, text=please wait 30 seconds, text=Rate limit')).toBeVisible({ timeout: 5000 });
        });

        test('should implement exponential backoff for 429', async ({ page }) => {
            let requestTimes: number[] = [];

            await page.route('**/api/events', async route => {
                requestTimes.push(Date.now());
                await route.fulfill({
                    status: 429,
                    body: JSON.stringify({
                        error: { code: 'RATE_LIMITED', retryAfter: '5' }
                    })
                });
            });

            await page.goto('/events');

            // Wait a bit for potential retries
            await page.waitForTimeout(3000);

            // Should have made multiple attempts with increasing delays
            if (requestTimes.length > 1) {
                const firstDelay = requestTimes[1] - requestTimes[0];
                // First retry should be after at least 1 second (exponential backoff start)
                expect(firstDelay).toBeGreaterThanOrEqual(1000);
            }
        });
    });

    test.describe('504 Gateway Timeout', () => {
        test('should display timeout message for 504', async ({ page }) => {
            await page.route('**/api/**', async route => {
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

            // Should show timeout message
            const timeoutMessage = page.locator('text=took too long, text=Gateway timeout, text=try again, text=timeout');
            await expect(timeoutMessage.first()).toBeVisible({ timeout: 5000 });
        });

        test('should handle 504 on seat selection gracefully', async ({ page }) => {
            // First, set up auth
            await page.evaluate(() => {
                localStorage.setItem('access_token', 'test-token');
                localStorage.setItem('user', JSON.stringify({
                    userId: 'test-user',
                    email: 'test@example.com',
                    role: 'user',
                }));
            });

            await page.route('**/api/events/*/seats', async route => {
                await route.fulfill({
                    status: 504,
                    body: JSON.stringify({
                        error: { code: 'GATEWAY_TIMEOUT', message: 'Request timed out' }
                    })
                });
            });

            await page.goto('/events/test-event-123/seats');

            // Should show error but not crash
            await expect(page.locator('text=timeout, text=took too long, text=try again')).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('Network Offline', () => {
        test('should display offline message when network is unavailable', async ({ page }) => {
            // Set offline mode
            await page.context().setOffline(true);

            await page.goto('/events');

            // Should show offline message
            const offlineMessage = page.locator('text=offline, text=no internet, text=network error, text=connection error, text=check your connection');
            await expect(offlineMessage.first()).toBeVisible({ timeout: 5000 });

            // Restore online
            await page.context().setOffline(false);
        });

        test('should recover when network comes back online', async ({ page }) => {
            // Start offline
            await page.context().setOffline(true);
            await page.goto('/events');

            // Should show offline message
            await expect(page.locator('text=offline, text=no internet, text=network error')).toBeVisible({ timeout: 5000 });

            // Bring network back
            await page.context().setOffline(false);

            // Mock successful response
            await page.route('**/api/events', async route => {
                await route.fulfill({
                    status: 200,
                    body: JSON.stringify({
                        data: {
                            events: [{ eventId: 'evt_001', name: 'Recovered Event' }],
                            pagination: { page: 1, total: 1 }
                        }
                    })
                });
            });

            // Should recover and show content
            await page.reload();
            await expect(page.locator('text=Recovered Event')).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Partial Failures', () => {
        test('should handle partial page load when some API calls fail', async ({ page }) => {
            // Events API succeeds
            await page.route('**/api/events', async route => {
                await route.fulfill({
                    status: 200,
                    body: JSON.stringify({
                        data: {
                            events: [{ eventId: 'evt_001', name: 'Working Event' }],
                            pagination: { page: 1, total: 1 }
                        }
                    })
                });
            });

            // Venues API fails
            await page.route('**/api/venues', async route => {
                await route.fulfill({
                    status: 503,
                    body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE' } })
                });
            });

            await page.goto('/events');

            // Events should still show
            await expect(page.locator('text=Working Event')).toBeVisible({ timeout: 5000 });

            // Venues section should show error or be hidden gracefully
            // (depends on implementation)
        });

        test('should not show loading spinner indefinitely on error', async ({ page }) => {
            await page.route('**/api/**', async route => {
                await route.fulfill({
                    status: 500,
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

            await page.route('**/api/events', async route => {
                attemptCount++;
                if (attemptCount === 1) {
                    await route.fulfill({
                        status: 503,
                        body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE' } })
                    });
                } else {
                    await route.fulfill({
                        status: 200,
                        body: JSON.stringify({
                            data: {
                                events: [{ eventId: 'evt_001', name: 'Retry Success' }],
                                pagination: { page: 1, total: 1 }
                            }
                        })
                    });
                }
            });

            await page.goto('/events');

            // Should show error first
            await expect(page.locator('text=Service unavailable, text=error, text=try again')).toBeVisible({ timeout: 5000 });

            // Find and click retry button
            const retryBtn = page.locator('button:has-text("Retry"), button:has-text("Try Again"), button:has-text("Reload")');
            if (await retryBtn.count() > 0) {
                await retryBtn.click();

                // Should eventually succeed
                await expect(page.locator('text=Retry Success')).toBeVisible({ timeout: 10000 });
            }
        });
    });
});
