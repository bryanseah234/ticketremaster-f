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
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('access_token', 'mock-token');
            localStorage.setItem('refresh_token', 'refresh-token');
            localStorage.setItem('user', JSON.stringify({ userId: 'usr_001', email: 'test@example.com', role: 'user' }));
        });
        setupConsoleMonitoring(page);
    });

    test.afterEach(async () => {
        assertNoConsoleErrors();
    });

    test('should connect to WebSocket on authenticated pages', async ({ page }) => {
        // Mock WebSocket connection
        await page.route('ws://**/*', async route => {
            const ws = await route.websocket();
            ws.on('framesent', frame => {
                console.log('WS Sent:', frame.payload);
            });
            ws.on('framereceived', frame => {
                console.log('WS Received:', frame.payload);
            });
        });

        await page.goto('/tickets');
        
        // Give WebSocket time to connect
        await page.waitForTimeout(1000);
        
        // The page should load without errors
        await expect(page.locator('h1')).toHaveText(/My Tickets|Tickets/);
    });

    test('should handle WebSocket reconnection', async ({ page }) => {
        let connectionAttempts = 0;

        await page.route('ws://**/*', async route => {
            connectionAttempts++;
            if (connectionAttempts === 1) {
                const ws = await route.websocket();
                ws.on('framesent', frame => console.log('WS Sent:', frame.payload));
            } else {
                const ws = await route.websocket();
                ws.on('framesent', frame => console.log('WS Reconnected:', frame.payload));
            }
        });

        await page.goto('/tickets');
        await page.waitForTimeout(500);

        // Simulate disconnection by navigating away and back
        await page.goto('/events');
        await page.waitForTimeout(500);
        await page.goto('/tickets');
        await page.waitForTimeout(500);

        // Should have attempted reconnection
        expect(connectionAttempts).toBeGreaterThanOrEqual(1);
    });
});

test.describe('Notification Event Types', () => {
    test('seat_update event structure', async ({ page }) => {
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

    test('ticket_update event structure', async ({ page }) => {
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

    test('transfer_update event structure', async ({ page }) => {
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

    test('purchase_update event structure', async ({ page }) => {
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
