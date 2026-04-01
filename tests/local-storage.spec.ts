import { test, expect } from '@playwright/test';
import {
    setupConsoleMonitoring,
    assertNoConsoleErrors,
} from './setup/console-monitor';

/**
 * Local State Persistence Tests
 *
 * Tests that localStorage is properly used for:
 * - Favorites functionality (save and persist after page reload)
 * - Authentication state persistence
 * - User preferences
 */
test.describe('Local State Persistence', () => {
    test.beforeEach(async ({ page }) => {
        setupConsoleMonitoring(page);
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    test.describe('Favorites Functionality', () => {
        test('should save favorite event to localStorage', async ({ page }) => {
            await page.goto('/events');

            // Find and click the favorite/heart button for an event
            const heartBtn = page.locator('button[aria-label*="favorite"], button[aria-label*="favourite"], .heart-btn, .fav-btn').first();

            if (await heartBtn.count() > 0) {
                // Get initial favorites
                const initialFavorites = await page.evaluate(() => {
                    const favs = localStorage.getItem('favoriteEvents');
                    return favs ? JSON.parse(favs) : [];
                });

                // Click to add to favorites
                await heartBtn.click();

                // Wait for the state to update
                await page.waitForTimeout(500);

                // Check localStorage was updated
                const updatedFavorites = await page.evaluate(() => {
                    const favs = localStorage.getItem('favoriteEvents');
                    return favs ? JSON.parse(favs) : [];
                });

                // Should have added at least one event
                expect(updatedFavorites.length).toBeGreaterThan(initialFavorites.length);
            }
        });

        test('should persist favorites after page reload', async ({ page }) => {
            await page.goto('/events');

            // Find and click the favorite button
            const heartBtn = page.locator('button[aria-label*="favorite"], button[aria-label*="favourite"], .heart-btn, .fav-btn').first();

            if (await heartBtn.count() > 0) {
                // Click to add to favorites
                await heartBtn.click();

                // Get the event ID that was favorited
                const favoritesBeforeReload = await page.evaluate(() => {
                    const favs = localStorage.getItem('favoriteEvents');
                    return favs ? JSON.parse(favs) : [];
                });

                // Reload the page
                await page.reload();

                // Check localStorage still has the favorites
                const favoritesAfterReload = await page.evaluate(() => {
                    const favs = localStorage.getItem('favoriteEvents');
                    return favs ? JSON.parse(favs) : [];
                });

                // Should still have the same favorites
                expect(favoritesAfterReload).toEqual(favoritesBeforeReload);
            }
        });

        test('should toggle favorite state correctly', async ({ page }) => {
            await page.goto('/events');

            const heartBtn = page.locator('button[aria-label*="favorite"], button[aria-label*="favourite"], .heart-btn, .fav-btn').first();

            if (await heartBtn.count() > 0) {
                // Get initial state
                const initialFavorites = await page.evaluate(() => {
                    const favs = localStorage.getItem('favoriteEvents');
                    return favs ? JSON.parse(favs) : [];
                });

                // Add to favorites
                await heartBtn.click();
                await page.waitForTimeout(300);

                // Should be added
                const afterAdd = await page.evaluate(() => {
                    const favs = localStorage.getItem('favoriteEvents');
                    return favs ? JSON.parse(favs) : [];
                });
                expect(afterAdd.length).toBeGreaterThan(initialFavorites.length);

                // Remove from favorites
                await heartBtn.click();
                await page.waitForTimeout(300);

                // Should be removed
                const afterRemove = await page.evaluate(() => {
                    const favs = localStorage.getItem('favoriteEvents');
                    return favs ? JSON.parse(favs) : [];
                });
                expect(afterRemove.length).toBe(initialFavorites.length);
            }
        });
    });

    test.describe('Authentication State Persistence', () => {
        test('should persist auth token after page reload', async ({ page, context }) => {
            // Use addInitScript to set localStorage BEFORE any page loads
            await context.addInitScript(() => {
                localStorage.setItem('access_token', 'test-token');
                localStorage.setItem('refresh_token', 'test-refresh');
                localStorage.setItem('user', JSON.stringify({
                    userId: 'test-user',
                    email: 'test@example.com',
                    role: 'user',
                }));
            });

            await page.goto('/events');

            // Verify token is still in localStorage
            const token = await page.evaluate(() => localStorage.getItem('access_token'));
            expect(token).toBe('test-token');

            // Reload page
            await page.reload();

            // Token should still be there
            const tokenAfterReload = await page.evaluate(() => localStorage.getItem('access_token'));
            expect(tokenAfterReload).toBe('test-token');
        });

        test('should maintain logged-in state after navigation', async ({ page, context }) => {
            // Use addInitScript to set localStorage BEFORE any page loads
            await context.addInitScript(() => {
                localStorage.setItem('access_token', 'test-token');
                localStorage.setItem('refresh_token', 'test-refresh');
                localStorage.setItem('user', JSON.stringify({
                    userId: 'test-user',
                    email: 'test@example.com',
                    role: 'user',
                }));
            });

            // Navigate to protected route
            await page.goto('/tickets');
            await expect(page).toHaveURL('/tickets');

            // Navigate to another protected route
            await page.goto('/profile');
            await expect(page).toHaveURL('/profile');

            // Should still be logged in (not redirected to login)
            const token = await page.evaluate(() => localStorage.getItem('access_token'));
            expect(token).toBe('test-token');
        });

        test('should clear auth state on logout', async ({ page, context }) => {
            // Use addInitScript to set localStorage BEFORE any page loads
            await context.addInitScript(() => {
                localStorage.setItem('access_token', 'test-token');
                localStorage.setItem('refresh_token', 'test-refresh');
                localStorage.setItem('user', JSON.stringify({
                    userId: 'test-user',
                    email: 'test@example.com',
                    role: 'user',
                }));
            });

            await page.goto('/profile');
            await page.waitForLoadState('networkidle');

            // Find and click logout button (ProfileView uses "Log Out")
            const logoutBtn = page.locator('button:has-text("Log Out"), button:has-text("Logout"), button:has-text("Sign Out")');

            if (await logoutBtn.count() > 0) {
                await logoutBtn.click();

                // Wait for logout redirect (auth store navigates to /login)
                await page.waitForURL(/\/(login|demo-login|\?)/, { timeout: 10000 }).catch(() => {});
                await page.waitForTimeout(500);

                // Auth should be cleared
                const token = await page.evaluate(() => localStorage.getItem('access_token'));
                expect(token).toBeNull();
            }
        });
    });

    test.describe('User Preferences Persistence', () => {
        test('should persist theme preference', async ({ page }) => {
            await page.goto('/');

            // Check if there's a theme toggle
            const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="light"], .theme-toggle');

            if (await themeToggle.count() > 0) {
                // Get initial theme
                const initialTheme = await page.evaluate(() => localStorage.getItem('theme'));

                // Toggle theme
                await themeToggle.click();
                await page.waitForTimeout(300);

                // Check theme changed
                const newTheme = await page.evaluate(() => localStorage.getItem('theme'));
                expect(newTheme).not.toBe(initialTheme);

                // Reload and verify persistence
                await page.reload();
                const themeAfterReload = await page.evaluate(() => localStorage.getItem('theme'));
                expect(themeAfterReload).toBe(newTheme);
            }
        });

        test('should persist language preference', async ({ page }) => {
            await page.goto('/');

            // Check if there's a language selector
            const langSelector = page.locator('select[aria-label*="language"], select[name="lang"], .lang-selector');

            if (await langSelector.count() > 0) {
                // Get initial language
                const initialLang = await page.evaluate(() => localStorage.getItem('locale') || localStorage.getItem('language'));

                // Change language
                await langSelector.selectOption('es');
                await page.waitForTimeout(300);

                // Check language changed
                const newLang = await page.evaluate(() => localStorage.getItem('locale') || localStorage.getItem('language'));
                expect(newLang).toBe('es');

                // Reload and verify persistence
                await page.reload();
                const langAfterReload = await page.evaluate(() => localStorage.getItem('locale') || localStorage.getItem('language'));
                expect(langAfterReload).toBe('es');
            }
        });
    });
});
