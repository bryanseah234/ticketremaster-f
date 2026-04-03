# Frontend Testing Guide

This guide covers testing the TicketRemaster frontend, including demo accounts for UI development and debugging.

## Test Structure

The Playwright E2E tests are organized into the following categories:

| Test File | Description |
|-----------|-------------|
| `console-monitoring.spec.ts` | Browser console error monitoring for all pages |
| `demo-mode.spec.ts` | Demo login and mock data rendering for all roles |
| `rbac.spec.ts` | Role-based access control (admin, staff, user routes) |
| `validation.spec.ts` | Client-side form validation (login, register) |
| `local-storage.spec.ts` | LocalStorage persistence (favorites, auth state) |
| `network-failures.spec.ts` | Simulated network failures (503, 429, 504, offline) |
| `auth.spec.ts` | Authentication flow tests |
| `admin.spec.ts` | Admin operations tests |
| `events.spec.ts` | Events listing and details tests |
| `purchase.spec.ts` | Purchase flow tests |
| `marketplace.spec.ts` | Marketplace flow tests |
| `integration.spec.ts` | Credit top-up and transfer integration tests |
| `websocket.spec.ts` | WebSocket notification tests |

### Console Monitoring

All tests include browser console monitoring via `tests/setup/console-monitor.ts`. This utility:

- Captures console errors and page errors during test execution
- Filters out known/expected errors (Sentry/PostHog offline errors, network failures)
- Fails tests if unexpected console errors occur
- Helps maintain a clean browser console

## Demo Accounts

The frontend includes a **Demo Mode** that allows UI development and testing without requiring a backend connection. Access demo accounts at `/demo-login`.

### Available Demo Accounts

| Account | Email | Role | Password | Redirect |
|---------|-------|------|----------|----------|
| Demo User | `demo@ticketremaster.com` | user | `demo1234` | `/events` |
| Demo Admin | `admin@ticketremaster.com` | admin | `demo1234` | `/admin/events` |
| Demo Staff | `staff@ticketremaster.com` | staff | `demo1234` | `/staff/scan` |

### How to Use Demo Mode

1. **Navigate to demo login:**
   ```
   http://localhost:5173/demo-login
   ```

2. **Click a demo account button** or enter credentials manually

3. **Explore the UI** — All read-only features work with mock data

### What Works in Demo Mode

- ✅ Browse events list
- ✅ View event details
- ✅ Seat selection (visual only)
- ✅ View my tickets
- ✅ Marketplace browsing
- ✅ Admin dashboard (with admin account)
- ✅ Staff scanner (with staff account)
- ✅ Design system preview

### What's Disabled in Demo Mode

- ❌ Real authentication (uses mock JWT)
- ❌ Purchases and payments
- ❌ Ticket transfers
- ❌ Account registration
- ❌ Real-time WebSocket updates
- ❌ Profile modifications

## Testing Observability

The frontend includes a **Debug Panel** for testing Sentry and PostHog integration.

### Accessing the Debug Panel

The debug panel appears as a floating button in the bottom-right corner of every page.

### Testing Sentry

Click the debug panel and use these buttons:

| Button | What it does |
|--------|--------------|
| **Send Error** | Throws a test error that gets captured by Sentry |
| **Send Message** | Sends a test message to Sentry |
| **Send Log + Breadcrumb** | Sends a log with breadcrumb for debugging |

### Testing PostHog

| Button | What it does |
|--------|--------------|
| **Send Event** | Captures a test event with custom properties |
| **Identify User** | Identifies the current user with test data |

### Verifying Data

After clicking any debug button:

1. **Sentry:** Go to https://sentry.io/ → Your Project → Issues
2. **PostHog:** Go to https://us.posthog.com/project/361191 → Activity → Live events

## Running Tests Locally

### Prerequisites

```bash
cd ticketremaster-f
npm install
```

### Type Checking

```bash
npm run typecheck
```

### Building

```bash
npm run build
```

### Running E2E Tests

```bash
npm run test
```

### Running Tests with UI

```bash
npm run test:ui
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_SENTRY_DSN` | Sentry error tracking | `https://...` |
| `VITE_POSTHOG_API_KEY` | PostHog analytics | `phc_...` |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe payments | `pk_test_...` |
| `VITE_KONG_API_KEY` | API gateway key | `tk_front_...` |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:8109` |

### Setting Up Local Environment

1. Copy `.env.example` to `.env`
2. Update values as needed
3. Run `npm run dev`

## Troubleshooting

### Demo Mode Not Working

If demo mode doesn't activate automatically when backend is down:
1. Add `?demo=true` to the URL
2. Or navigate to `/demo-login` directly

### Sentry/PostHog Not Receiving Data

1. Check browser console for errors
2. Verify environment variables are set correctly
3. Check if ad blockers are blocking tracking scripts
4. Use the debug panel to send test events

### Build Failures

If `npm run build` fails:
1. Run `npm run typecheck` to see TypeScript errors
2. Fix any type errors shown
3. Try `npm run build:skip-types` to skip type checking (not recommended for production)

## Test Checklist

Before deploying to production:

- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] E2E tests pass (`npm run test`)
- [ ] Sentry test error appears in dashboard
- [ ] PostHog test event appears in dashboard
- [ ] Demo login works with all three accounts
- [ ] All protected routes redirect to login when not authenticated
- [ ] Admin routes only accessible with admin account
- [ ] Staff routes only accessible with staff account
