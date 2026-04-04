# TicketRemaster Frontend Architecture Specification

> Source of truth for Online/Offline state management, RBAC, route mapping, component hierarchy, style application, and E2E testing strategy.
> Backend reference: `ticketremaster-b/FRONTEND.md`, `ticketremaster-b/API.md`
> Style reference: `ticketremaster-f/STYLE.md`, `ticketremaster-f/docs/DESIGN.md`

---

## Table of Contents

1. [Connectivity & State Management](#1-connectivity--state-management)
2. [RBAC Matrix](#2-rbac-matrix)
3. [Phase 1 — Route Map & Element Mapping](#3-phase-1--route-map--element-mapping)
4. [Phase 2 — UI/UX Redesign & Component Hierarchy](#4-phase-2--uiux-redesign--component-hierarchy)
5. [Phase 3 — Style Guide Application](#5-phase-3--style-guide-application)
6. [Phase 4 — Playwright Testing Strategy](#6-phase-4--playwright-testing-strategy)

---

## 1. Connectivity & State Management

### 1.1 Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Vue 3 `<script setup lang="ts">` |
| State | Pinia |
| HTTP | Axios (`src/api/client.ts`) |
| Routing | Vue Router 4 |
| Mock layer | `src/services/mockData.ts` |
| Realtime | Socket.IO (`src/composables/useWebSocket.ts`) |

### 1.2 Online Mode vs Offline Mode

| Dimension | Online Mode | Offline Mode |
| --- | --- | --- |
| Trigger | Backend reachable; `window.__apiOffline === false` | Network error, 408, 502, 503, or 504 received |
| Data source | Kong Gateway (`VITE_API_BASE_URL`) | `src/services/mockData.ts` via `mockServices.*` |
| Auth | Real JWT stored in `localStorage` | Demo token stored in `sessionStorage` only |
| Mutations | Real API calls with idempotency keys | Simulated with `delay()` in mock service |
| Role set | Normal User, Admin, Staff + Demo variants | Demo User, Demo Admin, Demo Staff only |
| Banner | None | Fixed bottom banner: orange accent, full-width |
| Demo pill | Hidden | Shown in `AppNavbar` |

### 1.3 API Interceptor Logic (`src/api/client.ts`)

#### Request Interceptor

```
1. Set baseURL from VITE_API_BASE_URL
2. Attach Authorization: Bearer <token> if auth.state.accessToken is set
3. Attach apikey header from VITE_KONG_API_KEY on every request
4. If method is POST/PUT/DELETE AND url matches IDEMPOTENCY_REQUIRED_PATHS:
   a. Generate idempotency key: idem_<hash>_<timestamp>
   b. Set Idempotency-Key header
   c. Store cachedKey in config.metadata for retry lookup
```

**Idempotency-required paths:**
- `/purchase/hold/`
- `/purchase/confirm/`
- `/credits/topup/initiate`
- `/credits/topup/confirm`
- `/transfer/initiate`
- `/transfer/` (all sub-paths)

#### Response Interceptor — Success Path

```
1. Call emitOnline() → clears offline flag, dispatches api:online event
2. If config.metadata.cachedKey exists: cache response in idempotencyCache (TTL 24h)
3. Return response
```

#### Response Interceptor — Error Path

```
1. Log error details (strip Authorization header before logging)
2. Check idempotency cache: if cachedKey exists and status is 408/504/network error
   → return cached response (prevents duplicate processing on retry)
3. Exponential backoff retry for status codes [429, 503, 408, 504]:
   - MAX_RETRY_ATTEMPTS = 3
   - Delay = min(INITIAL_BACKOFF * 2^attempt + jitter, MAX_BACKOFF)
   - Dev: initial=500ms, max=3000ms | Prod: initial=2000ms, max=15000ms
4. Detect backend unavailability (network error, 408, 502, 503, 504):
   - If GET endpoint and not yet in demo mode: call emitOffline()
   - emitOffline() sets window.__apiOffline=true, calls setDemoMode(true),
     dispatches api:offline CustomEvent
5. 401 (not login route): clearSession() + redirect to /login
6. 404 on /users/<userId>: clearSession() + redirect to /login
7. Map error codes to user-facing toast messages (see error code table below)
```

#### Error Code → Toast Message Map

| Error Code | Toast Message |
| --- | --- |
| `SEAT_UNAVAILABLE` | Seat is currently unavailable. |
| `SEAT_ALREADY_SOLD` | Seat has already been sold. |
| `HOLD_EXPIRED` | Your seat hold expired. |
| `INSUFFICIENT_CREDITS` | Not enough credits for this action. |
| `OTP_INVALID` | OTP code is incorrect. |
| `OTP_EXPIRED` | OTP code has expired. |
| `OTP_MAX_RETRIES` | Too many OTP attempts. |
| `TRANSFER_IN_PROGRESS` | A transfer is already pending. |
| `NOT_SEAT_OWNER` | You do not own this ticket. |
| `SELF_TRANSFER` | You cannot transfer to yourself. |
| `EMAIL_ALREADY_EXISTS` | This email is already registered. |
| `VALIDATION_ERROR` | Please check your input. |
| HTTP 408 | The request timed out. Please try again. |
| HTTP 429 | You are doing that too fast. Please wait a moment. |
| HTTP 402 | Not enough credits for this action. |
| HTTP 503 | TicketRemaster is temporarily unavailable. |

### 1.4 Transient Notification System (Network Changes)

The app listens for two custom window events dispatched by `client.ts`:

| Event | Trigger | UI Action |
| --- | --- | --- |
| `api:offline` | First 5xx/network error on a GET endpoint | Show fixed bottom banner (orange, full-width). Show demo pill in navbar. Toast: "Backend unavailable. Showing demo data." |
| `api:online` | Successful response after offline state | Hide banner. Hide demo pill. Toast: "Connection restored." |

**Implementation location:** `src/App.vue` — `onMounted` registers both listeners.

**Banner component:** Fixed position, `bottom: 0`, full viewport width, `z-index: 9999`, uses `--accent` background, `--accent-ink` text. Includes a dismiss button that hides the banner for the session but does not re-enable live mode.

### 1.5 Hot-Swap Strategy: Live → Mock

When `isDemoMode()` returns `true`, every Pinia store action routes calls to `mockServices` instead of the Axios client:

```typescript
// Pattern used in every store action
async function getEvents(params) {
  if (isDemoMode()) {
    return mockServices.getEvents(params)
  }
  const res = await api.get('/events', { params })
  return res.data.data
}
```

`isDemoMode()` checks two sources (in order):
1. `window.__demoMode === true` (set by `setDemoMode(true)` in `emitOffline`)
2. URL query param `?demo=true`

Demo sessions use `sessionStorage` exclusively. Real sessions use `localStorage`. `clearSession()` clears both.

### 1.6 Pinia Store Architecture

| Store | File | Responsibilities |
| --- | --- | --- |
| `useAuthStore` | `src/stores/auth.ts` | Session, role, demoLogin, clearSession |
| `useEventStore` | `src/stores/events.ts` | Event list, event detail, seat map |
| `usePurchaseStore` | `src/stores/purchase.ts` | holdSeat, confirmPurchase, hold timer |
| `useTicketStore` | `src/stores/tickets.ts` | My tickets, QR fetch |
| `useTransferStore` | `src/stores/transfer.ts` | Initiate, OTP flow, rate limit state |
| `useMarketplaceStore` | `src/stores/marketplace.ts` | Listings, create listing, delist |
| `useCreditStore` | `src/stores/credits.ts` | Balance, topup initiate/confirm, transactions |
| `useAdminStore` | `src/stores/admin.ts` | Event create, user management |
| `useVerifyStore` | `src/stores/verify.ts` | QR scan, manual verify (staff only) |

---

## 2. RBAC Matrix

### 2.1 Mode × Role Matrix

| Mode | Connection | Available Roles |
| --- | --- | --- |
| Online | Backend reachable | Normal User, Normal Admin, Normal Staff |
| Online | Backend reachable | Demo User, Demo Admin, Demo Staff |
| Offline | Backend unreachable | Demo User, Demo Admin, Demo Staff ONLY |

### 2.2 Route Access by Role

| Route | Unauthenticated | Normal/Demo User | Normal/Demo Admin | Normal/Demo Staff |
| --- | --- | --- | --- | --- |
| `/` | ✅ | ✅ | ✅ | ✅ |
| `/events` | ✅ | ✅ | ✅ | ✅ |
| `/events/:eventId` | ✅ | ✅ | ✅ | ✅ |
| `/events/:eventId/seats` | ❌ → /login | ✅ | ✅ | ✅ |
| `/login` | ✅ | ✅ | ✅ | ✅ |
| `/register` | ✅ | ✅ | ✅ | ✅ |
| `/demo-login` | ✅ | ✅ | ✅ | ✅ |
| `/marketplace` | ✅ | ✅ | ✅ | ✅ |
| `/venues` | ✅ | ✅ | ✅ | ✅ |
| `/tickets` | ❌ → /login | ✅ | ✅ | ✅ |
| `/tickets/:ticketId` | ❌ → /login | ✅ | ✅ | ✅ |
| `/ticket-qr/:qrHash` | ✅ | ✅ | ✅ | ✅ |
| `/checkout/:orderId` | ❌ → /login | ✅ | ✅ | ❌ → /events |
| `/credits/topup` | ❌ → /login | ✅ | ✅ | ❌ → /events |
| `/profile` | ❌ → /login | ✅ | ✅ | ✅ |
| `/transfer/initiate` | ❌ → /login | ✅ | ✅ | ❌ → /events |
| `/transfer/:transferId` | ✅ | ✅ | ✅ | ✅ |
| `/staff/scan` | ❌ → /login | ❌ → /events | ❌ → /events | ✅ |
| `/admin/events/new` | ❌ → /login | ❌ → /events | ✅ | ❌ → /events |
| `/admin/events/:id/dashboard` | ❌ → /login | ❌ → /events | ✅ | ❌ → /events |
| `/admin/users` | ❌ → /login | ❌ → /events | ✅ | ❌ → /events |

### 2.3 UI Element Visibility by Role

| UI Element | Unauthenticated | User | Admin | Staff |
| --- | --- | --- | --- | --- |
| Navbar: Login / Register links | ✅ | ❌ | ❌ | ❌ |
| Navbar: Tickets link | ❌ | ✅ | ✅ | ✅ |
| Navbar: Profile link | ❌ | ✅ | ✅ | ✅ |
| Navbar: Logout button | ❌ | ✅ | ✅ | ✅ |
| Navbar: Admin Panel link | ❌ | ❌ | ✅ | ❌ |
| Navbar: Staff Scanner link | ❌ | ❌ | ❌ | ✅ |
| Navbar: Demo Mode pill | Only in offline/demo mode | Only in offline/demo mode | Only in offline/demo mode | Only in offline/demo mode |
| EventDetail: "Select Seats" button | ❌ (shows Login CTA) | ✅ | ✅ | ✅ |
| TicketDetail: "List on Marketplace" | ❌ | ✅ (status=active only) | ✅ | ❌ |
| TicketDetail: "Transfer Ticket" | ❌ | ✅ (status=active only) | ✅ | ❌ |
| TicketDetail: QR Code display | ❌ | ✅ | ✅ | ✅ |
| Admin: Event Create form | ❌ | ❌ | ✅ | ❌ |
| Admin: User flag/unflag controls | ❌ | ❌ | ✅ | ❌ |
| Staff: QR scan interface | ❌ | ❌ | ❌ | ✅ |
| Staff: Manual verify form | ❌ | ❌ | ❌ | ✅ |
| Credits: Top-up button | ❌ | ✅ | ✅ | ❌ |
| Offline banner | All roles | All roles | All roles | All roles |

### 2.4 Automatic Role Downgrade on Connection Drop

When `emitOffline()` is called (backend unreachable), the following Pinia state mutations are required:

```typescript
// In useAuthStore — called by App.vue on api:offline event
function downgradeToDemo() {
  if (!state.user) return
  // Preserve role but mark session as demo
  const currentRole = state.user.role  // 'user' | 'admin' | 'staff'
  // Replace real token with demo token (prevents real API calls)
  state.accessToken = `demo-${currentRole}-token`
  // Persist to sessionStorage only (not localStorage)
  sessionStorage.setItem('demo_access_token', state.accessToken)
  sessionStorage.setItem('demo_user', JSON.stringify(state.user))
  // Remove real tokens from localStorage
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}
```

**Capability changes after downgrade:**

| Capability | Normal Admin (Online) | Demo Admin (Offline) |
| --- | --- | --- |
| Create events | Real POST /admin/events | Mock only (no real write) |
| View event dashboard | Real data | Mock data |
| Manage users | Real data + mutations | Mock data, read-only |
| Purchase tickets | Real purchase flow | Mock purchase flow |
| Transfer tickets | Real OTP flow | Mock OTP flow |

**Recovery:** When `api:online` fires, `upgradeFromDemo()` is called:
```typescript
function upgradeFromDemo() {
  // Prompt user to re-authenticate for security
  // Real tokens were removed on downgrade
  clearSession()
  router.push('/login')
  toast.push('Connection restored. Please sign in again.', 'info')
}
```

---
