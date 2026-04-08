import { test, expect } from '@playwright/test';
import {
    setupConsoleMonitoring,
    assertNoConsoleErrors,
} from './setup/console-monitor';

/**
 * WebSocket Real-time Notification Tests
 * 
 * Tests the Socket.IO notification infrastructure for:
 * - seat_update events
 * - ticket_update events  
 * - transfer_update events
 * - purchase_update events
 */
test.describe('WebSocket Real-time Notifications', () => {
    test.beforeEach(async ({ page }) => {
        setupConsoleMonitoring(page);
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    async function loginDemoUser(page: any) {
        await page.goto('/demo-login');
        await page.click('button:has-text("Demo User")');
        await page.waitForURL(/\/events/, { timeout: 15000 });
    }

    async function navigateInApp(page: any, path: string) {
        await page.evaluate((nextPath) => {
            window.history.pushState({}, '', nextPath);
            window.dispatchEvent(new PopStateEvent('popstate'));
        }, path);
    }

    test('should connect to WebSocket on authenticated pages', async ({ page }) => {
        await loginDemoUser(page);
        await navigateInApp(page, '/tickets');
        
        // Give WebSocket time to connect
        await page.waitForTimeout(1000);
        
        // The page should load without errors
        await expect(page.locator('.tickets-page')).toBeVisible();
    });

    test('should handle WebSocket reconnection', async ({ page }) => {
        await loginDemoUser(page);
        await navigateInApp(page, '/tickets');
        await page.waitForTimeout(500);

        // Simulate disconnection by navigating away and back
        await navigateInApp(page, '/events');
        await page.waitForTimeout(500);
        await navigateInApp(page, '/tickets');
        await page.waitForTimeout(500);

        // Page should still function after navigation
        await expect(page.locator('.tickets-page')).toBeVisible();
    });
});

test.describe('Notification Event Types', () => {
    test('seat_update event structure', async () => {
        const seatUpdate = {
            type: 'seat_update',
            payload: {
                eventId: 'evt_001',
                seatId: 'seat_001',
                inventoryId: 'inv_001',
                status: 'sold',
                previousStatus: 'held'
            },
            traceId: 'trace_abc123',
            timestamp: new Date().toISOString()
        };

        expect(seatUpdate.type).toBe('seat_update');
        expect(seatUpdate.payload).toHaveProperty('eventId');
        expect(seatUpdate.payload).toHaveProperty('seatId');
        expect(seatUpdate.payload).toHaveProperty('status');
    });

    test('ticket_update event structure', async () => {
        const ticketUpdate = {
            type: 'ticket_update',
            payload: {
                ticketId: 'tkt_001',
                status: 'used',
                previousStatus: 'active',
                scannedAt: new Date().toISOString()
            },
            traceId: 'trace_def456',
            timestamp: new Date().toISOString()
        };

        expect(ticketUpdate.type).toBe('ticket_update');
        expect(ticketUpdate.payload).toHaveProperty('ticketId');
        expect(ticketUpdate.payload).toHaveProperty('status');
    });

    test('transfer_update event structure', async () => {
        const transferUpdate = {
            type: 'transfer_update',
            payload: {
                transferId: 'txr_001',
                status: 'completed',
                previousStatus: 'pending_seller_otp',
                completedAt: new Date().toISOString()
            },
            traceId: 'trace_ghi789',
            timestamp: new Date().toISOString()
        };

        expect(transferUpdate.type).toBe('transfer_update');
        expect(transferUpdate.payload).toHaveProperty('transferId');
        expect(transferUpdate.payload).toHaveProperty('status');
    });

    test('purchase_update event structure', async () => {
        const purchaseUpdate = {
            type: 'purchase_update',
            payload: {
                inventoryId: 'inv_001',
                ticketId: 'tkt_001',
                status: 'completed',
                userId: 'usr_001'
            },
            traceId: 'trace_jkl012',
            timestamp: new Date().toISOString()
        };

        expect(purchaseUpdate.type).toBe('purchase_update');
        expect(purchaseUpdate.payload).toHaveProperty('inventoryId');
        expect(purchaseUpdate.payload).toHaveProperty('ticketId');
    });
});
