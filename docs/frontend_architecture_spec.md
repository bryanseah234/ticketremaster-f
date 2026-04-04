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
## 3. Phase 1 — Route Map & Element Mapping

### 3.1 Complete Route Map

Based on the backend API specification, the following routes are required:

#### Public Routes (No Auth Required)

| Route | Component | Backend Endpoint | Purpose |
| --- | --- | --- | --- |
| `/` | `HomePage.vue` | `GET /events` | Landing page with featured events |
| `/events` | `EventListPage.vue` | `GET /events` | Browse all events with filters |
| `/events/:eventId` | `EventDetailPage.vue` | `GET /events/{event_id}` | Event details and description |
| `/login` | `LoginPage.vue` | `POST /auth/login` | User authentication |
| `/register` | `RegisterPage.vue` | `POST /auth/register` | New user registration |
| `/demo-login` | `DemoLoginPage.vue` | N/A (client-side only) | Demo mode role selection |
| `/marketplace` | `MarketplacePage.vue` | `GET /marketplace/listings` | Browse resale tickets |
| `/venues` | `VenueListPage.vue` | `GET /venues` | Browse venues |
| `/ticket-qr/:qrHash` | `PublicQRPage.vue` | `GET /tickets/qr/{qr_hash}` | Public QR code view (shareable) |
| `/transfer/:transferId` | `TransferAcceptPage.vue` | `GET /transfer/{transfer_id}`, `POST /transfer/{transfer_id}/accept` | Accept incoming ticket transfer |

#### Authenticated Routes (User, Admin, Staff)

| Route | Component | Backend Endpoint | Purpose |
| --- | --- | --- | --- |
| `/events/:eventId/seats` | `SeatSelectionPage.vue` | `GET /events/{event_id}/seats` | Interactive seat map |
| `/tickets` | `MyTicketsPage.vue` | `GET /users/{user_id}/tickets` | User's ticket collection |
| `/tickets/:ticketId` | `TicketDetailPage.vue` | `GET /tickets/{ticket_id}` | Single ticket view with QR |
| `/checkout/:orderId` | `CheckoutPage.vue` | `POST /purchase/hold`, `POST /purchase/confirm` | Purchase confirmation flow |
| `/credits/topup` | `TopUpPage.vue` | `POST /credits/topup/initiate`, `POST /credits/topup/confirm` | Add credits to account |
| `/profile` | `ProfilePage.vue` | `GET /users/{user_id}`, `PATCH /users/{user_id}` | User profile and settings |
| `/transfer/initiate` | `TransferInitiatePage.vue` | `POST /transfer/initiate`, `POST /transfer/{transfer_id}/verify-otp` | Send ticket to another user |

#### Admin-Only Routes

| Route | Component | Backend Endpoint | Purpose |
| --- | --- | --- | --- |
| `/admin/events/new` | `AdminEventCreatePage.vue` | `POST /admin/events` | Create new event |
| `/admin/events/:id/dashboard` | `AdminEventDashboard.vue` | `GET /admin/events/{event_id}/dashboard` | Event analytics and management |
| `/admin/users` | `AdminUsersPage.vue` | `GET /admin/users`, `POST /admin/users/{user_id}/flag` | User management |

#### Staff-Only Routes

| Route | Component | Backend Endpoint | Purpose |
| --- | --- | --- | --- |
| `/staff/scan` | `StaffScanPage.vue` | `POST /verify/scan`, `POST /verify/manual` | QR code scanner for entry |

### 3.2 Element Mapping by Page

#### 3.2.1 Login Page (`/login`)

**API Endpoint:** `POST /auth/login`

**Form Elements:**

| Field | Type | Validation | API Payload Key |
| --- | --- | --- | --- |
| Email | `<input type="email">` | Required, valid email format | `email` |
| Password | `<input type="password">` | Required, min 8 chars | `password` |
| Submit Button | `<button type="submit">` | Disabled during loading | N/A |

**API Request Payload:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
API Response:

{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "credits": 1000
  }
}
State Actions:

Store tokens in localStorage (online) or sessionStorage (demo)
Populate useAuthStore with user data
Redirect to /events or return URL
3.2.2 Register Page (/register)
API Endpoint: POST /auth/register

Form Elements:

Field	Type	Validation	API Payload Key
Email	<input type="email">	Required, unique	email
Password	<input type="password">	Required, min 8 chars	password
Confirm Password	<input type="password">	Must match password	N/A (client-side only)
Full Name	<input type="text">	Required	full_name
Submit Button	<button type="submit">	Disabled during loading	N/A
API Request Payload:

{
  "email": "newuser@example.com",
  "password": "securepass123",
  "full_name": "John Doe"
}
3.2.3 Event List Page (/events)
API Endpoint: GET /events?search=&category=&date_from=&date_to=&page=1&limit=20

Filter Elements:

Field	Type	API Query Param
Search input	<input type="search">	search
Category dropdown	<select>	category
Date range picker	<input type="date"> (2x)	date_from, date_to
Sort dropdown	<select>	sort_by
Event Card Elements (per item):

Event title (clickable → /events/:eventId)
Event date and time
Venue name
Price range (min-max)
Thumbnail image
"View Details" button
API Response:

{
  "data": [
    {
      "event_id": "uuid",
      "title": "Concert Name",
      "date": "2026-05-15T19:00:00Z",
      "venue": { "name": "Arena", "city": "NYC" },
      "price_range": { "min": 50, "max": 200 },
      "image_url": "https://..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
3.2.4 Event Detail Page (/events/:eventId)
API Endpoint: GET /events/{event_id}

Display Elements:

Element	Data Source
Event title	response.title
Event description	response.description
Date and time	response.date
Venue name and address	response.venue.name, response.venue.address
Price tiers	response.price_tiers[]
Available seats count	response.available_seats
Event image	response.image_url
Action Buttons:

Button	Condition	Action
"Select Seats"	Authenticated users only	Navigate to /events/:eventId/seats
"Login to Purchase"	Unauthenticated users	Navigate to /login?return=/events/:eventId
3.2.5 Seat Selection Page (/events/:eventId/seats)
API Endpoint: GET /events/{event_id}/seats

Interactive Elements:

Element	Type	Purpose
Seat map SVG	<svg> with clickable <rect> elements	Visual seat selection
Seat legend	Color-coded labels	Show available/sold/selected states
Selected seat list	Dynamic list	Display chosen seats
Price calculator	Read-only display	Show total cost
"Proceed to Checkout" button	<button>	Trigger POST /purchase/hold
Seat States:

State	Color	Clickable	API Status
Available	Green (--success)	✅	available
Selected	Blue (--primary)	✅ (deselect)	N/A (client state)
Sold	Gray (--muted)	❌	sold
On Hold	Orange (--accent)	❌	on_hold
API Request (Hold Seats):

POST /purchase/hold
{
  "event_id": "uuid",
  "seat_ids": ["seat-A1", "seat-A2"]
}
API Response:

{
  "order_id": "uuid",
  "seats": [...],
  "total_price": 150,
  "hold_expires_at": "2026-04-04T12:15:00Z"
}
3.2.6 Checkout Page (/checkout/:orderId)
API Endpoint: POST /purchase/confirm

Display Elements:

Element	Data Source
Order summary	From hold response
Seat details	seats[] array
Total price	total_price
Current credits	useAuthStore.state.user.credits
Countdown timer	hold_expires_at (5 min countdown)
Action Buttons:

Button	Condition	API Call
"Confirm Purchase"	credits >= total_price	POST /purchase/confirm
"Top Up Credits"	credits < total_price	Navigate to /credits/topup
"Cancel"	Always	Navigate back
API Request:

POST /purchase/confirm
{
  "order_id": "uuid"
}
3.2.7 My Tickets Page (/tickets)
API Endpoint: GET /users/{user_id}/tickets

Filter Elements:

Field	Type	Filter Logic
Status filter	<select>	active, used, transferred, all
Search	<input type="search">	Filter by event name
Ticket Card Elements (per item):

Event title
Event date
Seat number
Status badge (active/used/transferred)
QR code thumbnail
"View Details" button → /tickets/:ticketId
3.2.8 Ticket Detail Page (/tickets/:ticketId)
API Endpoint: GET /tickets/{ticket_id}

Display Elements:

Element	Data Source
Event title	response.event.title
Event date	response.event.date
Venue	response.event.venue.name
Seat number	response.seat_number
QR code	response.qr_code (base64 or URL)
Status badge	response.status
Action Buttons (Conditional):

Button	Condition	Action
"List on Marketplace"	status === 'active' AND role !== 'staff'	Navigate to marketplace listing flow
"Transfer Ticket"	status === 'active' AND role !== 'staff'	Navigate to /transfer/initiate?ticketId=:id
"Download QR"	Always	Download QR as PNG
3.2.9 Transfer Initiate Page (/transfer/initiate)
API Endpoints:

POST /transfer/initiate
POST /transfer/{transfer_id}/verify-otp
Form Elements (Step 1):

Field	Type	Validation	API Payload Key
Ticket selector	<select>	Required	ticket_id
Recipient email	<input type="email">	Required, valid email	recipient_email
Submit	<button>	N/A	N/A
Form Elements (Step 2 - OTP):

Field	Type	Validation	API Payload Key
OTP code	<input type="text" maxlength="6">	Required, 6 digits	otp_code
Verify button	<button>	N/A	N/A
Rate Limit Display:

Show remaining attempts (max 3)
Show cooldown timer if rate limited
3.2.10 Admin Event Create Page (/admin/events/new)
API Endpoint: POST /admin/events

Form Elements:

Field	Type	Validation	API Payload Key
Event title	<input type="text">	Required	title
Description	<textarea>	Required	description
Date	<input type="datetime-local">	Required, future date	date
Venue selector	<select>	Required	venue_id
Image upload	<input type="file">	Optional, image only	image_url
Price tiers	Dynamic list of inputs	At least 1 tier	price_tiers[]
Price Tier Sub-form (Repeatable):

Field	Type	API Payload Key
Tier name	<input type="text">	price_tiers[].name
Price	<input type="number">	price_tiers[].price
Quantity	<input type="number">	price_tiers[].quantity
3.2.11 Staff Scan Page (/staff/scan)
API Endpoints:

POST /verify/scan (QR scan)
POST /verify/manual (manual entry)
Elements:

Element	Type	Purpose
Camera view	<video> with canvas overlay	Live QR scanning
Manual entry toggle	<button>	Switch to manual mode
Ticket ID input	<input type="text">	Manual verification
Verify button	<button>	Submit manual verification
Result display	Status card	Show verification result
Verification Result States:

State	Color	Message
Valid	Green	"Ticket verified. Entry granted."
Already used	Red	"Ticket already scanned."
Invalid	Red	"Invalid ticket."
Expired	Orange	"Event has ended."
3.3 API Payload Summary
Authentication Payloads
// POST /auth/login
interface LoginRequest {
  email: string
  password: string
}

// POST /auth/register
interface RegisterRequest {
  email: string
  password: string
  full_name: string
}
Purchase Flow Payloads
// POST /purchase/hold
interface HoldRequest {
  event_id: string
  seat_ids: string[]
}

// POST /purchase/confirm
interface ConfirmRequest {
  order_id: string
}
Transfer Flow Payloads
// POST /transfer/initiate
interface TransferInitiateRequest {
  ticket_id: string
  recipient_email: string
}

// POST /transfer/{transfer_id}/verify-otp
interface TransferVerifyRequest {
  otp_code: string
}

// POST /transfer/{transfer_id}/accept
interface TransferAcceptRequest {
  // No body required
}
Credits Payloads
// POST /credits/topup/initiate
interface TopUpInitiateRequest {
  amount: number
  payment_method: 'card' | 'paypal'
}

// POST /credits/topup/confirm
interface TopUpConfirmRequest {
  transaction_id: string
}
Admin Payloads
// POST /admin/events
interface CreateEventRequest {
  title: string
  description: string
  date: string  // ISO 8601
  venue_id: string
  image_url?: string
  price_tiers: Array<{
    name: string
    price: number
    quantity: number
  }>
}

// POST /admin/users/{user_id}/flag
interface FlagUserRequest {
  reason: string
  flagged: boolean
}
Verification Payloads
// POST /verify/scan
interface ScanRequest {
  qr_hash: string
}

// POST /verify/manual
interface ManualVerifyRequest {
  ticket_id: string
}
4. Phase 2 — UI/UX Redesign & Component Hierarchy
4.1 Modern Layout Strategy
4.1.1 Layout Components
Layout	File	Usage
DefaultLayout.vue	
DefaultLayout.vue
Public pages (home, events, marketplace)
AuthLayout.vue	
AuthLayout.vue
Login, register, demo-login
DashboardLayout.vue	
DashboardLayout.vue
User tickets, profile, credits
AdminLayout.vue	
AdminLayout.vue
Admin panel pages
StaffLayout.vue	
StaffLayout.vue
Staff scanner interface
4.1.2 Layout Structure
DefaultLayout.vue:

┌─────────────────────────────────────┐
│ AppNavbar (sticky top)              │
├─────────────────────────────────────┤
│                                     │
│ <router-view> (main content)        │
│                                     │
├─────────────────────────────────────┤
│ AppFooter                           │
├─────────────────────────────────────┤
│ OfflineBanner (conditional)         │
└─────────────────────────────────────┘
DashboardLayout.vue:

┌─────────────────────────────────────┐
│ AppNavbar (sticky top)              │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │ <router-view>            │
│ Nav      │ (dashboard content)      │
│          │                          │
├──────────┴──────────────────────────┤
│ OfflineBanner (conditional)         │
└─────────────────────────────────────┘
4.2 Component Hierarchy
4.2.1 Core Components
src/components/
├── layout/
│   ├── AppNavbar.vue          # Top navigation with role-based links
│   ├── AppFooter.vue          # Footer with links
│   ├── OfflineBanner.vue      # Fixed bottom banner for demo mode
│   └── Sidebar.vue            # Dashboard sidebar navigation
├── common/
│   ├── BaseButton.vue         # Reusable button with variants
│   ├── BaseCard.vue           # Card container
│   ├── BaseModal.vue          # Modal dialog
│   ├── BaseInput.vue          # Form input with validation
│   ├── BaseSelect.vue         # Dropdown select
│   ├── BaseBadge.vue          # Status badges
│   ├── LoadingSpinner.vue     # Loading indicator
│   ├── SkeletonLoader.vue     # Content placeholder
│   └── Toast.vue              # Notification toast
├── events/
│   ├── EventCard.vue          # Event list item
│   ├── EventGrid.vue          # Grid layout for events
│   ├── EventFilters.vue       # Filter controls
│   ├── SeatMap.vue            # Interactive SVG seat map
│   └── SeatLegend.vue         # Seat status legend
├── tickets/
│   ├── TicketCard.vue         # Ticket list item
│   ├── TicketQRCode.vue       # QR code display
│   └── TicketStatusBadge.vue  # Status indicator
├── marketplace/
│   ├── ListingCard.vue        # Marketplace listing item
│   └── ListingFilters.vue     # Marketplace filters
├── transfer/
│   ├── TransferForm.vue       # Transfer initiation form
│   └── OTPInput.vue           # 6-digit OTP entry
├── credits/
│   ├── CreditBalance.vue      # Balance display widget
│   └── TopUpForm.vue          # Credit purchase form
├── admin/
│   ├── EventForm.vue          # Event creation form
│   ├── UserTable.vue          # User management table
│   └── EventDashboard.vue     # Event analytics
└── staff/
    ├── QRScanner.vue          # Camera-based scanner
    └── VerificationResult.vue # Scan result display
4.2.2 Page Components
src/pages/
├── HomePage.vue
├── EventListPage.vue
├── EventDetailPage.vue
├── SeatSelectionPage.vue
├── CheckoutPage.vue
├── LoginPage.vue
├── RegisterPage.vue
├── DemoLoginPage.vue
├── MyTicketsPage.vue
├── TicketDetailPage.vue
├── PublicQRPage.vue
├── MarketplacePage.vue
├── VenueListPage.vue
├── ProfilePage.vue
├── TopUpPage.vue
├── TransferInitiatePage.vue
├── TransferAcceptPage.vue
├── admin/
│   ├── AdminEventCreatePage.vue
│   ├── AdminEventDashboard.vue
│   └── AdminUsersPage.vue
└── staff/
    └── StaffScanPage.vue
4.3 State-Aware UI Patterns
4.3.1 Empty States
Page	Condition	Empty State Message	CTA
My Tickets	No tickets owned	"You don't have any tickets yet."	"Browse Events" button
Marketplace	No listings	"No tickets available for resale."	"Check back later"
Event List	No search results	"No events match your filters."	"Clear Filters" button
Transfer History	No transfers	"You haven't transferred any tickets."	N/A
4.3.2 Skeleton Loaders
Page	Loading State	Skeleton Pattern
Event List	Fetching events	6x EventCard skeletons in grid
Event Detail	Fetching event	Hero image + text blocks
Seat Map	Fetching seats	SVG placeholder with pulse
My Tickets	Fetching tickets	4x TicketCard skeletons
Admin Dashboard	Fetching analytics	Chart placeholders + stat cards
Skeleton Component Pattern:

<template>
  <div class="skeleton-card">
    <div class="skeleton-image"></div>
    <div class="skeleton-text skeleton-text-lg"></div>
    <div class="skeleton-text skeleton-text-md"></div>
    <div class="skeleton-text skeleton-text-sm"></div>
  </div>
</template>

<style scoped>
.skeleton-image,
.skeleton-text {
  background: linear-gradient(90deg, var(--muted) 25%, var(--muted-hover) 50%, var(--muted) 75%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
</style>
4.3.3 Error States
Error Type	Display Pattern	Recovery Action
Network error	Toast + inline message	"Retry" button
404 Not Found	Full-page error	"Go Home" button
403 Forbidden	Inline message	"Contact Support" link
Validation error	Field-level error text	Auto-focus invalid field
Session expired	Modal dialog	"Login Again" button
4.4 Accessibility Requirements (WCAG 2.1 AA)
4.4.1 Keyboard Navigation
Component	Keyboard Support
Navbar links	Tab navigation, Enter to activate
Modal dialogs	Trap focus, Esc to close
Seat map	Arrow keys to navigate, Space to select
Form inputs	Tab order follows visual order
Dropdown menus	Arrow keys to navigate, Enter to select
4.4.2 ARIA Attributes
Component	Required ARIA
AppNavbar	role="navigation", aria-label="Main navigation"
SeatMap	role="application", aria-label="Seat selection map"
Modal	role="dialog", aria-modal="true", aria-labelledby
Toast	role="alert", aria-live="polite"
Loading spinner	role="status", aria-label="Loading"
Status badges	aria-label with full status text
4.4.3 Color Contrast
All text must meet WCAG AA contrast ratios:

Normal text: 4.5:1 minimum
Large text (18pt+): 3:1 minimum
Interactive elements: 3:1 against background
Validation: Use browser DevTools Lighthouse audit to verify contrast ratios.

4.4.4 Focus Indicators
All interactive elements must have visible focus indicators:

:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
4.5 Responsive Breakpoints
Breakpoint	Width	Layout Changes
Mobile	< 640px	Single column, stacked nav
Tablet	640px - 1024px	2-column grid, hamburger menu
Desktop	> 1024px	3-column grid, full nav
Grid Pattern:

.event-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

@media (max-width: 640px) {
  .event-grid {
    grid-template-columns: 1fr;
  }
}
5. Phase 3 — Style Guide Application
5.1 Design System Mapping
Based on STYLE.md and DESIGN.md, the following design tokens are defined:

5.1.1 Color Palette
Token	Hex Value	Usage
--primary	#3b82f6	Primary actions, links
--primary-hover	#2563eb	Hover state for primary
--secondary	#8b5cf6	Secondary actions
--accent	#f97316	Offline banner, alerts
--accent-ink	#ffffff	Text on accent background
--success	#10b981	Success messages, available seats
--danger	#ef4444	Error messages, sold seats
--warning	#f59e0b	Warning messages, on-hold seats
--muted	#6b7280	Disabled states, borders
--muted-hover	#9ca3af	Hover state for muted
--background	#ffffff	Page background (light mode)
--surface	#f9fafb	Card background
--text	#111827	Primary text
--text-secondary	#6b7280	Secondary text
5.1.2 Typography
Element	Font	Size	Weight	Line Height
H1	Inter	2.5rem (40px)	700	1.2
H2	Inter	2rem (32px)	600	1.3
H3	Inter	1.5rem (24px)	600	1.4
Body	Inter	1rem (16px)	400	1.5
Small	Inter	0.875rem (14px)	400	1.4
Button	Inter	1rem (16px)	500	1
Font Loading:

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
5.1.3 Spacing Scale
Token	Value	Usage
--space-xs	0.25rem (4px)	Tight spacing
--space-sm	0.5rem (8px)	Small gaps
--space-md	1rem (16px)	Default spacing
--space-lg	1.5rem (24px)	Section spacing
--space-xl	2rem (32px)	Large gaps
--space-2xl	3rem (48px)	Page sections
5.1.4 Border Radius
Token	Value	Usage
--radius-sm	0.25rem (4px)	Badges, small buttons
--radius-md	0.5rem (8px)	Cards, inputs
--radius-lg	1rem (16px)	Modals, large cards
--radius-full	9999px	Pills, avatars
5.1.5 Shadows
Token	Value	Usage
--shadow-sm	0 1px 2px rgba(0,0,0,0.05)	Subtle elevation
--shadow-md	0 4px 6px rgba(0,0,0,0.1)	Cards
--shadow-lg	0 10px 15px rgba(0,0,0,0.1)	Modals, dropdowns
--shadow-xl	0 20px 25px rgba(0,0,0,0.15)	Popovers
5.2 Component Style Classes
5.2.1 Button Variants

/* Primary Button */
.btn-primary {
  background: var(--primary);
  color: white;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

/* Secondary Button */
.btn-secondary {
  background: var(--secondary);
  color: white;
}

/* Outline Button */
.btn-outline {
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
}

.btn-outline:hover {
  background: var(--primary);
  color: white;
}

/* Danger Button */
.btn-danger {
  background: var(--danger);
  color: white;
}

/* Disabled Button */
.btn:disabled {
  background: var(--muted);
  color: var(--text-secondary);
  cursor: not-allowed;
  opacity: 0.6;
}
5.2.2 Card Styles
.card {
  background: var(--surface);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  box-shadow: var(--shadow-md);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.card-header {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--space-md);
  color: var(--text);
}

.card-body {
  color: var(--text-secondary);
  line-height: 1.5;
}
5.2.3 Badge Styles
.badge {
  display: inline-block;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-success {
  background: var(--success);
  color: white;
}

.badge-danger {
  background: var(--danger);
  color: white;
}

.badge-warning {
  background: var(--warning);
  color: white;
}

.badge-muted {
  background: var(--muted);
  color: white;
}

.badge-demo {
  background: var(--accent);
  color: var(--accent-ink);
}
5.2.4 Form Input Styles
.input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 2px solid var(--muted);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:disabled {
  background: var(--surface);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.input-error {
  border-color: var(--danger);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-label {
  display: block;
  margin-bottom: var(--space-xs);
  font-weight: 500;
  color: var(--text);
}

.input-error-text {
  margin-top: var(--space-xs);
  font-size: 0.875rem;
  color: var(--danger);
}
5.2.5 Modal Styles
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s;
}

.modal-content {
  background: var(--background);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  max-width: 500px;
  width: 90%;
  box-shadow: var(--shadow-xl);
  animation: slideUp 0.3s;
}

.modal-header {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--space-lg);
}

.modal-footer {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-lg);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
5.3 Component-Specific Styling
5.3.1 AppNavbar
.navbar {
  background: var(--background);
  border-bottom: 1px solid var(--muted);
  padding: var(--space-md) var(--space-xl);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1280px;
  margin: 0 auto;
}

.navbar-logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
}

.navbar-links {
  display: flex;
  gap: var(--space-lg);
  align-items: center;
}

.navbar-link {
  color: var(--text);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.navbar-link:hover {
  color: var(--primary);
}

.navbar-link.active {
  color: var(--primary);
  border-bottom: 2px solid var(--primary);
}
5.3.2 OfflineBanner
.offline-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--accent);
  color: var(--accent-ink);
  padding: var(--space-md) var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 9999;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.offline-banner-text {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.offline-banner-icon {
  width: 20px;
  height: 20px;
}

.offline-banner-dismiss {
  background: transparent;
  border: 2px solid var(--accent-ink);
  color: var(--accent-ink);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.offline-banner-dismiss:hover {
  background: rgba(255, 255, 255, 0.2);
}
5.3.3 EventCard
.event-card {
  background: var(--surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.event-card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.event-card-content {
  padding: var(--space-lg);
}

.event-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--space-sm);
  color: var(--text);
}

.event-card-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.event-card-price {
  margin-top: var(--space-md);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--primary);
}
5.3.4 SeatMap
.seat-map-container {
  background: var(--surface);
  border-radius: var(--radius-md);
  padding: var(--space-xl);
  box-shadow: var(--shadow-md);
}

.seat-map-svg {
  width: 100%;
  height: auto;
  max-width: 800px;
  margin: 0 auto;
  display: block;
}

.seat {
  cursor: pointer;
  transition: fill 0.2s, stroke 0.2s;
}

.seat.available {
  fill: var(--success);
  stroke: #059669;
}

.seat.available:hover {
  fill: #059669;
}

.seat.selected {
  fill: var(--primary);
  stroke: #1d4ed8;
}

.seat.sold {
  fill: var(--muted);
  stroke: #4b5563;
  cursor: not-allowed;
}

.seat.on-hold {
  fill: var(--warning);
  stroke: #d97706;
  cursor: not-allowed;
}

.seat-label {
  font-size: 10px;
  fill: white;
  pointer-events: none;
  text-anchor: middle;
}
5.3.5 Toast Notification
.toast-container {
  position: fixed;
  top: var(--space-xl);
  right: var(--space-xl);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.toast {
  background: var(--background);
  border-radius: var(--radius-md);
  padding: var(--space-md) var(--space-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 300px;
  animation: slideInRight 0.3s;
}

.toast-success {
  border-left: 4px solid var(--success);
}

.toast-error {
  border-left: 4px solid var(--danger);
}

.toast-warning {
  border-left: 4px solid var(--warning);
}

.toast-info {
  border-left: 4px solid var(--primary);
}

.toast-message {
  flex: 1;
  color: var(--text);
}

.toast-close {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0;
  width: 24px;
  height: 24px;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
5.4 Dark Mode Support (Optional)
@media (prefers-color-scheme: dark) {
  :root {
    --background: #111827;
    --surface: #1f2937;
    --text: #f9fafb;
    --text-secondary: #9ca3af;
    --muted: #4b5563;
    --muted-hover: #6b7280;
  }
}
5.5 Animation Utilities
/* Fade animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide animations */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s, opacity 0.3s;
}

.slide-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* Pulse animation for loading states */
@keyframes skeleton-pulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Spin animation for loading spinners */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  animation: spin 1s linear infinite;
}
6. Phase 4 — Playwright Testing Strategy
6.1 Test Environment Setup
6.1.1 Playwright Configuration
File: playwright.config.ts

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
6.1.2 Test Fixtures
File: 
auth.fixture.ts

import { test as base } from '@playwright/test'

type AuthFixtures = {
  authenticatedPage: Page
  demoPage: Page
  adminPage: Page
  staffPage: Page
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login as normal user
    await page.goto('/login')
    await page.fill('[name="email"]', 'user@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/events')
    await use(page)
  },
  
  demoPage: async ({ page }, use) => {
    // Enter demo mode
    await page.goto('/demo-login')
    await page.click('text=Demo User')
    await page.waitForURL('/events')
    await use(page)
  },
  
  adminPage: async ({ page }, use) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/events')
    await use(page)
  },
  
  staffPage: async ({ page }, use) => {
    // Login as staff
    await page.goto('/login')
    await page.fill('[name="email"]', 'staff@example.com')
    await page.fill('[name="password"]', 'staff123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/events')
    await use(page)
  },
})
6.2 Test Scenarios
6.2.1 Online/Offline Mode Transition Tests
File: 
offline-transition.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Online/Offline Mode Transitions', () => {
  test('should show offline banner when backend becomes unavailable', async ({ page, context }) => {
    // Start in online mode
    await page.goto('/events')
    await expect(page.locator('.offline-banner')).not.toBeVisible()
    
    // Simulate backend failure by blocking API requests
    await context.route('**/api/**', route => route.abort())
    
    // Trigger an API call
    await page.reload()
    
    // Verify offline banner appears
    await expect(page.locator('.offline-banner')).toBeVisible()
    await expect(page.locator('.offline-banner')).toContainText('Backend unavailable')
    
    // Verify demo pill in navbar
    await expect(page.locator('.navbar .badge-demo')).toBeVisible()
    
    // Verify toast notification
    await expect(page.locator('.toast-warning')).toContainText('Showing demo data')
  })
  
  test('should restore online mode when backend becomes available', async ({ page, context }) => {
    // Start in offline mode
    await page.goto('/events?demo=true')
    await expect(page.locator('.offline-banner')).toBeVisible()
    
    // Remove API blocking
    await context.unroute('**/api/**')
    
    // Trigger an API call
    await page.click('text=Refresh')
    
    // Verify offline banner disappears
    await expect(page.locator('.offline-banner')).not.toBeVisible()
    
    // Verify demo pill disappears
    await expect(page.locator('.navbar .badge-demo')).not.toBeVisible()
    
    // Verify toast notification
    await expect(page.locator('.toast-info')).toContainText('Connection restored')
  })
  
  test('should use mock data in offline mode', async ({ page }) => {
    await page.goto('/events?demo=true')
    
    // Verify demo data is displayed
    await expect(page.locator('.event-card').first()).toBeVisible()
    
    // Check that event data contains demo indicators
    const firstEventTitle = await page.locator('.event-card-title').first().textContent()
    expect(firstEventTitle).toBeTruthy()
  })
  
  test('should prevent real API calls in offline mode', async ({ page }) => {
    let apiCallMade = false
    
    await page.route('**/api/**', route => {
      apiCallMade = true
      route.abort()
    })
    
    await page.goto('/events?demo=true')
    await page.click('.event-card').first()
    
    // Wait a moment to ensure no API calls are made
    await page.waitForTimeout(1000)
    
    expect(apiCallMade).toBe(false)
  })
})
6.2.2 RBAC Visibility Tests
File: 
role-visibility.spec.ts

import { test, expect } from '@playwright/test'
import { test as authTest } from '../fixtures/auth.fixture'

test.describe('RBAC UI Element Visibility', () => {
  test('unauthenticated user should see login/register links', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.locator('a[href="/login"]')).toBeVisible()
    await expect(page.locator('a[href="/register"]')).toBeVisible()
    await expect(page.locator('a[href="/tickets"]')).not.toBeVisible()
    await expect(page.locator('a[href="/profile"]')).not.toBeVisible()
  })
  
  authTest('normal user should see user-specific links', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('a[href="/tickets"]')).toBeVisible()
    await expect(authenticatedPage.locator('a[href="/profile"]')).toBeVisible()
    await expect(authenticatedPage.locator('button:has-text("Logout")')).toBeVisible()
    
    // Should NOT see admin/staff links
    await expect(authenticatedPage.locator('a[href="/admin/events/new"]')).not.toBeVisible()
    await expect(authenticatedPage.locator('a[href="/staff/scan"]')).not.toBeVisible()
  })
  
  authTest('admin should see admin panel link', async ({ adminPage }) => {
    await expect(adminPage.locator('a[href="/admin/events/new"]')).toBeVisible()
    await expect(adminPage.locator('text=Admin Panel')).toBeVisible()
    
    // Should NOT see staff link
    await expect(adminPage.locator('a[href="/staff/scan"]')).not.toBeVisible()
  })
  
  authTest('staff should see scanner link', async ({ staffPage }) => {
    await expect(staffPage.locator('a[href="/staff/scan"]')).toBeVisible()
    await expect(staffPage.locator('text=Scanner')).toBeVisible()
    
    // Should NOT see admin link
    await expect(staffPage.locator('a[href="/admin/events/new"]')).not.toBeVisible()
  })
  
  authTest('ticket actions should be role-specific', async ({ authenticatedPage }) => {
    // Navigate to a ticket detail page
    await authenticatedPage.goto('/tickets')
    await authenticatedPage.click('.ticket-card').first()
    
    // User should see transfer and marketplace buttons
    await expect(authenticatedPage.locator('button:has-text("Transfer Ticket")')).toBeVisible()
    await expect(authenticatedPage.locator('button:has-text("List on Marketplace")')).toBeVisible()
  })
  
  authTest('staff should NOT see ticket transfer actions', async ({ staffPage }) => {
    await staffPage.goto('/tickets')
    await staffPage.click('.ticket-card').first()
    
    // Staff should NOT see transfer/marketplace buttons
    await expect(staffPage.locator('button:has-text("Transfer Ticket")')).not.toBeVisible()
    await expect(staffPage.locator('button:has-text("List on Marketplace")')).not.toBeVisible()
  })
})
6.2.3 RBAC Route Protection Tests
File: 
route-protection.spec.ts

import { test, expect } from '@playwright/test'
import { test as authTest } from '../fixtures/auth.fixture'

test.describe('RBAC Route Protection', () => {
  test('unauthenticated user redirected from protected routes', async ({ page }) => {
    await page.goto('/tickets')
    await expect(page).toHaveURL(/\/login/)
    
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/)
    
    await page.goto('/admin/events/new')
    await expect(page).toHaveURL(/\/login/)
  })
  
  authTest('normal user redirected from admin routes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/events/new')
    await expect(authenticatedPage).toHaveURL(/\/events/)
    
    await authenticatedPage.goto('/admin/users')
    await expect(authenticatedPage).toHaveURL(/\/events/)
  })
  
  authTest('normal user redirected from staff routes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/staff/scan')
    await expect(authenticatedPage).toHaveURL(/\/events/)
  })
  
  authTest('staff redirected from admin routes', async ({ staffPage }) => {
    await staffPage.goto('/admin/events/new')
    await expect(staffPage).toHaveURL(/\/events/)
  })
  
  authTest('staff redirected from user purchase routes', async ({ staffPage }) => {
    await staffPage.goto('/checkout/some-order-id')
    await expect(staffPage).toHaveURL(/\/events/)
    
    await staffPage.goto('/credits/topup')
    await expect(staffPage).toHaveURL(/\/events/)
  })
  
  authTest('admin can access admin routes', async ({ adminPage }) => {
    await adminPage.goto('/admin/events/new')
    await expect(adminPage).toHaveURL(/\/admin\/events\/new/)
    
    await adminPage.goto('/admin/users')
    await expect(adminPage).toHaveURL(/\/admin\/users/)
  })
  
  authTest('staff can access staff routes', async ({ staffPage }) => {
    await staffPage.goto('/staff/scan')
    await expect(staffPage).toHaveURL(/\/staff\/scan/)
  })
})
6.2.4 Automatic Role Downgrade Tests
File: 
role-downgrade.spec.ts

import { test, expect } from '@playwright/test'
import { test as authTest } from '../fixtures/auth.fixture'

test.describe('Automatic Role Downgrade on Connection Loss', () => {
  authTest('admin downgraded to demo admin when offline', async ({ adminPage, context }) => {
    // Verify admin capabilities online
    await adminPage.goto('/admin/events/new')
    await expect(adminPage).toHaveURL(/\/admin\/events\/new/)
    
    // Simulate backend failure
    await context.route('**/api/**', route => route.abort())
    
    // Trigger offline detection
    await adminPage.reload()
    
    // Verify offline banner and demo pill
    await expect(adminPage.locator('.offline-banner')).toBeVisible()
    await expect(adminPage.locator('.badge-demo')).toBeVisible()
    
    // Verify still on admin page but using mock data
    await expect(adminPage).toHaveURL(/\/admin\/events\/new/)
    
    // Verify form still works but uses mock service
    await adminPage.fill('[name="title"]', 'Test Event')
    await adminPage.click('button[type="submit"]')
    
    // Should show success but not make real API call
    await expect(adminPage.locator('.toast-success')).toBeVisible()
  })
  
  authTest('user prompted to re-login when connection restored', async ({ authenticatedPage, context }) => {
    // Start in offline mode
    await context.route('**/api/**', route => route.abort())
    await authenticatedPage.goto('/events')
    await expect(authenticatedPage.locator('.offline-banner')).toBeVisible()
    
    // Restore connection
    await context.unroute('**/api/**')
    await authenticatedPage.reload()
    
    // Should be redirected to login
    await expect(authenticatedPage).toHaveURL(/\/login/)
    await expect(authenticatedPage.locator('.toast-info')).toContainText('Connection restored')
    await expect(authenticatedPage.locator('.toast-info')).toContainText('Please sign in again')
  })
  
  authTest('session storage used in demo mode', async ({ page }) => {
    await page.goto('/demo-login')
    await page.click('text=Demo Admin')
    
    // Check that demo token is in sessionStorage, not localStorage
    const sessionToken = await page.evaluate(() => sessionStorage.getItem('demo_access_token'))
    const localToken = await page.evaluate(() => localStorage.getItem('access_token'))
    
    expect(sessionToken).toBeTruthy()
    expect(localToken).toBeNull()
  })
})
6.2.5 Purchase Flow Tests
File: 
purchase-flow.spec.ts


import { test, expect } from '@playwright/test'
import { test as authTest } from '../fixtures/auth.fixture'

test.describe('Ticket Purchase Flow', () => {
  authTest('complete purchase flow - happy path', async ({ authenticatedPage }) => {
    // Browse events
    await authenticatedPage.goto('/events')
    await expect(authenticatedPage.locator('.event-card')).toHaveCount.greaterThan(0)
    
    // Select an event
    await authenticatedPage.click('.event-card').first()
    await expect(authenticatedPage).toHaveURL(/\/events\/[^/]+/)
    
    // Click select seats
    await authenticatedPage.click('button:has-text("Select Seats")')
    await expect(authenticatedPage).toHaveURL(/\/events\/[^/]+\/seats/)
    
    // Select seats on map
    await authenticatedPage.click('.seat.available').first()
    await authenticatedPage.click('.seat.available').nth(1)
    
    // Verify selected seats count
    await expect(authenticatedPage.locator('.selected-seats-count')).toContainText('2')
    
    // Proceed to checkout
    await authenticatedPage.click('button:has-text("Proceed to Checkout")')
    await expect(authenticatedPage).toHaveURL(/\/checkout\/[^/]+/)
    
    // Verify order summary
    await expect(authenticatedPage.locator('.order-summary')).toBeVisible()
    await expect(authenticatedPage.locator('.countdown-timer')).toBeVisible()
    
    // Confirm purchase
    await authenticatedPage.click('button:has-text("Confirm Purchase")')
    
    // Verify success
    await expect(authenticatedPage.locator('.toast-success')).toContainText('Purchase successful')
    await expect(authenticatedPage).toHaveURL(/\/tickets/)
  })
  
  authTest('purchase fails with insufficient credits', async ({ authenticatedPage }) => {
    // Navigate to expensive event
    await authenticatedPage.goto('/events')
    await authenticatedPage.click('.event-card').first()
    await authenticatedPage.click('button:has-text("Select Seats")')
    
    // Select multiple expensive seats
    await authenticatedPage.click('.seat.available').first()
    await authenticatedPage.click('.seat.available').nth(1)
    await authenticatedPage.click('.seat.available').nth(2)
    
    await authenticatedPage.click('button:has-text("Proceed to Checkout")')
    
    // Verify insufficient credits message
    await expect(authenticatedPage.locator('.insufficient-credits-warning')).toBeVisible()
    await expect(authenticatedPage.locator('button:has-text("Confirm Purchase")')).toBeDisabled()
    
    // Verify top-up CTA
    await expect(authenticatedPage.locator('a:has-text("Top Up Credits")')).toBeVisible()
  })
  
  authTest('hold expires after 5 minutes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/events')
    await authenticatedPage.click('.event-card').first()
    await authenticatedPage.click('button:has-text("Select Seats")')
    await authenticatedPage.click('.seat.available').first()
    await authenticatedPage.click('button:has-text("Proceed to Checkout")')
    
    // Verify countdown timer
    const timer = authenticatedPage.locator('.countdown-timer')
    await expect(timer).toBeVisible()
    
    // Fast-forward time (mock or wait)
    await authenticatedPage.evaluate(() => {
      // Simulate timer expiration
      window.dispatchEvent(new CustomEvent('hold-expired'))
    })
    
    // Verify expiration message
    await expect(authenticatedPage.locator('.toast-warning')).toContainText('hold expired')
    await expect(authenticatedPage.locator('button:has-text("Confirm Purchase")')).toBeDisabled()
  })
})
6.2.6 Transfer Flow Tests
File: 
transfer-flow.spec.ts

import { test, expect } from '@playwright/test'
import { test as authTest } from '../fixtures/auth.fixture'

test.describe('Ticket Transfer Flow', () => {
  authTest('complete transfer flow with OTP', async ({ authenticatedPage }) => {
    // Navigate to tickets
    await authenticatedPage.goto('/tickets')
    await authenticatedPage.click('.ticket-card[data-status="active"]').first()
    
    // Initiate transfer
    await authenticatedPage.click('button:has-text("Transfer Ticket")')
    await expect(authenticatedPage).toHaveURL(/\/transfer\/initiate/)
    
    // Fill recipient email
    await authenticatedPage.fill('[name="recipient_email"]', 'recipient@example.com')
    await authenticatedPage.click('button[type="submit"]')
    
    // Verify OTP step
    await expect(authenticatedPage.locator('.otp-input')).toBeVisible()
    await expect(authenticatedPage.locator('text=Enter OTP')).toBeVisible()
    
    // Enter OTP (in demo mode, any 6 digits work)
    await authenticatedPage.fill('[name="otp_code"]', '123456')
    await authenticatedPage.click('button:has-text("Verify")')
    
    // Verify success
    await expect(authenticatedPage.locator('.toast-success')).toContainText('Transfer initiated')
    await expect(authenticatedPage).toHaveURL(/\/tickets/)
  })
  
  authTest('transfer fails with invalid OTP', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/tickets')
    await authenticatedPage.click('.ticket-card[data-status="active"]').first()
    await authenticatedPage.click('button:has-text("Transfer Ticket")')
    
    await authenticatedPage.fill('[name="recipient_email"]', 'recipient@example.com')
    await authenticatedPage.click('button[type="submit"]')
    
    // Enter wrong OTP
    await authenticatedPage.fill('[name="otp_code"]', '000000')
    await authenticatedPage.click('button:has-text("Verify")')
    
    // Verify error
    await expect(authenticatedPage.locator('.toast-error')).toContainText('OTP code is incorrect')
    await expect(authenticatedPage.locator('.otp-attempts-remaining')).toBeVisible()
  })
  
  authTest('transfer rate limited after 3 attempts', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/transfer/initiate')
    await authenticatedPage.fill('[name="recipient_email"]', 'recipient@example.com')
    await authenticatedPage.click('button[type="submit"]')
    
    // Attempt 3 wrong OTPs
    for (let i = 0; i < 3; i++) {
      await authenticatedPage.fill('[name="otp_code"]', '000000')
      await authenticatedPage.click('button:has-text("Verify")')
      await authenticatedPage.waitForTimeout(500)
    }
    
    // Verify rate limit
    await expect(authenticatedPage.locator('.toast-error')).toContainText('Too many OTP attempts')
    await expect(authenticatedPage.locator('button:has-text("Verify")')).toBeDisabled()
    await expect(authenticatedPage.locator('.cooldown-timer')).toBeVisible()
  })
  
  test('recipient can accept transfer', async ({ page }) => {
    // Simulate clicking transfer link from email
    await page.goto('/transfer/mock-transfer-id')
    
    // Verify transfer details
    await expect(page.locator('.transfer-details')).toBeVisible()
    await expect(page.locator('text=Accept Transfer')).toBeVisible()
    
    // Accept transfer
    await page.click('button:has-text("Accept Transfer")')
    
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login/)
  })
})
6.2.7 Admin Flow Tests
File: 
admin-flow.spec.ts

import { test as authTest, expect } from '../fixtures/auth.fixture'

test.describe('Admin Event Management', () => {
  authTest('admin can create new event', async ({ adminPage }) => {
    await adminPage.goto('/admin/events/new')
    
    // Fill event form
    await adminPage.fill('[name="title"]', 'New Concert Event')
    await adminPage.fill('[name="description"]', 'An amazing concert experience')
    await adminPage.fill('[name="date"]', '2026-06-15T19:00')
    await adminPage.selectOption('[name="venue_id"]', { index: 1 })
    
    // Add price tier
    await adminPage.click('button:has-text("Add Price Tier")')
    await adminPage.fill('[name="price_tiers[0].name"]', 'General Admission')
    await adminPage.fill('[name="price_tiers[0].price"]', '50')
    await adminPage.fill('[name="price_tiers[0].quantity"]', '100')
    
    // Submit form
    await adminPage.click('button[type="submit"]')
    
    // Verify success
    await expect(adminPage.locator('.toast-success')).toContainText('Event created')
    await expect(adminPage).toHaveURL(/\/admin\/events\/[^/]+\/dashboard/)
  })
  
  authTest('admin can view event dashboard', async ({ adminPage }) => {
    await adminPage.goto('/admin/events/new')
    // Create event first (abbreviated)
    await adminPage.fill('[name="title"]', 'Dashboard Test Event')
    await adminPage.fill('[name="description"]', 'Test')
    await adminPage.fill('[name="date"]', '2026-07-01T20:00')
    await adminPage.selectOption('[name="venue_id"]', { index: 1 })
    await adminPage.click('button[type="submit"]')
    
    // Navigate to dashboard
    await expect(adminPage).toHaveURL(/\/admin\/events\/[^/]+\/dashboard/)
    
    // Verify dashboard elements
    await expect(adminPage.locator('.stat-card:has-text("Total Sales")')).toBeVisible()
    await expect(adminPage.locator('.stat-card:has-text("Available Seats")')).toBeVisible()
    await expect(adminPage.locator('.stat-card:has-text("Revenue")')).toBeVisible()
    await expect(adminPage.locator('.sales-chart')).toBeVisible()
  })
  
  authTest('admin can manage users', async ({ adminPage }) => {
    await adminPage.goto('/admin/users')
    
    // Verify user table
    await expect(adminPage.locator('.user-table')).toBeVisible()
    await expect(adminPage.locator('.user-table tbody tr')).toHaveCount.greaterThan(0)
    
    // Flag a user
    await adminPage.click('.user-table tbody tr').first().locator('button:has-text("Flag")')
    await adminPage.fill('[name="flag_reason"]', 'Suspicious activity')
    await adminPage.click('button:has-text("Confirm Flag")')
    
    // Verify success
    await expect(adminPage.locator('.toast-success')).toContainText('User flagged')
  })
})
6.2.8 Staff Scanner Tests
File: 
staff-scanner.spec.ts

import { test as authTest, expect } from '../fixtures/auth.fixture'

test.describe('Staff QR Scanner', () => {
  authTest('staff can access scanner page', async ({ staffPage }) => {
    await staffPage.goto('/staff/scan')
    
    // Verify scanner interface
    await expect(staffPage.locator('.qr-scanner')).toBeVisible()
    await expect(staffPage.locator('video')).toBeVisible()
    await expect(staffPage.locator('button:has-text("Manual Entry")')).toBeVisible()
  })
  
  authTest('staff can verify ticket manually', async ({ staffPage }) => {
    await staffPage.goto('/staff/scan')
    
    // Switch to manual mode
    await staffPage.click('button:has-text("Manual Entry")')
    
    // Enter ticket ID
    await staffPage.fill('[name="ticket_id"]', 'valid-ticket-id')
    await staffPage.click('button:has-text("Verify")')
    
    // Verify success result
    await expect(staffPage.locator('.verification-result.success')).toBeVisible()
    await expect(staffPage.locator('.verification-result')).toContainText('Entry granted')
  })
  
  authTest('staff sees error for already-used ticket', async ({ staffPage }) => {
    await staffPage.goto('/staff/scan')
    await staffPage.click('button:has-text("Manual Entry")')
    
    // Enter used ticket ID
    await staffPage.fill('[name="ticket_id"]', 'used-ticket-id')
    await staffPage.click('button:has-text("Verify")')
    
    // Verify error result
    await expect(staffPage.locator('.verification-result.error')).toBeVisible()
    await expect(staffPage.locator('.verification-result')).toContainText('already scanned')
  })
  
  authTest('staff sees error for invalid ticket', async ({ staffPage }) => {
    await staffPage.goto('/staff/scan')
    await staffPage.click('button:has-text("Manual Entry")')
    
    // Enter invalid ticket ID
    await staffPage.fill('[name="ticket_id"]', 'invalid-ticket-id')
    await staffPage.click('button:has-text("Verify")')
    
    // Verify error result
    await expect(staffPage.locator('.verification-result.error')).toBeVisible()
    await expect(staffPage.locator('.verification-result')).toContainText('Invalid ticket')
  })
})
6.2.9 Accessibility Tests
File: 
a11y.spec.ts

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Compliance', () => {
  test('home page should not have accessibility violations', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
  
  test('event list page should not have accessibility violations', async ({ page }) => {
    await page.goto('/events')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
  
  test('login page should not have accessibility violations', async ({ page }) => {
    await page.goto('/login')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
  
  test('keyboard navigation works on navbar', async ({ page }) => {
    await page.goto('/')
    
    // Tab through navbar links
    await page.keyboard.press('Tab')
    await expect(page.locator('a[href="/"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('a[href="/events"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('a[href="/marketplace"]')).toBeFocused()
    
    // Press Enter to navigate
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/marketplace/)
  })
  
  test('modal traps focus correctly', async ({ page }) => {
    await page.goto('/events')
    
    // Open a modal (e.g., filter modal)
    await page.click('button:has-text("Filters")')
    
    // Verify focus is trapped in modal
    const modal = page.locator('.modal-overlay')
    await expect(modal).toBeVisible()
    
    // Tab through modal elements
    await page.keyboard.press('Tab')
    const firstFocusable = await page.evaluate(() => document.activeElement?.tagName)
    
    // Tab multiple times to cycle through
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
    }
    
    // Focus should still be within modal
    const stillInModal = await page.evaluate(() => {
      const activeEl = document.activeElement
      const modal = document.querySelector('.modal-overlay')
      return modal?.contains(activeEl)
    })
    
    expect(stillInModal).toBe(true)
    
    // Escape closes modal
    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible()
  })
  
  test('form inputs have proper labels', async ({ page }) => {
    await page.goto('/login')
    
    // Check email input
    const emailLabel = page.locator('label[for="email"]')
    await expect(emailLabel).toBeVisible()
    await expect(emailLabel).toContainText('Email')
    
    const emailInput = page.locator('input#email')
    await expect(emailInput).toHaveAttribute('type', 'email')
    await expect(emailInput).toHaveAttribute('aria-label')
    
    // Check password input
    const passwordLabel = page.locator('label[for="password"]')
    await expect(passwordLabel).toBeVisible()
    await expect(passwordLabel).toContainText('Password')
    
    const passwordInput = page.locator('input#password')
    await expect(passwordInput).toHaveAttribute('type', 'password')
    await expect(passwordInput).toHaveAttribute('aria-label')
  })
})
6.2.10 Responsive Design Tests
File: 
mobile.spec.ts

import { test, expect, devices } from '@playwright/test'

test.describe('Mobile Responsive Design', () => {
  test.use({ ...devices['iPhone 12'] })
  
  test('navbar collapses to hamburger menu on mobile', async ({ page }) => {
    await page.goto('/')
    
    // Verify hamburger menu is visible
    await expect(page.locator('.hamburger-menu')).toBeVisible()
    
    // Verify full nav links are hidden
    await expect(page.locator('.navbar-links')).not.toBeVisible()
    
    // Click hamburger to open menu
    await page.click('.hamburger-menu')
    
    // Verify menu opens
    await expect(page.locator('.mobile-menu')).toBeVisible()
    await expect(page.locator('.mobile-menu a[href="/events"]')).toBeVisible()
  })
  
  test('event grid shows single column on mobile', async ({ page }) => {
    await page.goto('/events')
    
    // Verify single column layout
    const gridColumns = await page.locator('.event-grid').evaluate(el => {
      return window.getComputedStyle(el).gridTemplateColumns
    })
    
    // Should be single column (1fr or similar)
    expect(gridColumns).not.toContain('repeat')
  })
  
  test('seat map is scrollable on mobile', async ({ page, context }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[name="email"]', 'user@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.goto('/events')
    await page.click('.event-card').first()
    await page.click('button:has-text("Select Seats")')
    
    // Verify seat map container is scrollable
    const seatMapContainer = page.locator('.seat-map-container')
    await expect(seatMapContainer).toBeVisible()
    
    const isScrollable = await seatMapContainer.evaluate(el => {
      return el.scrollWidth > el.clientWidth
    })
    
    expect(isScrollable).toBe(true)
  })
  
  test('forms are usable on mobile', async ({ page }) => {
    await page.goto('/login')
    
    // Verify form inputs are properly sized
    const emailInput = page.locator('input[name="email"]')
    const inputWidth = await emailInput.evaluate(el => el.offsetWidth)
    const viewportWidth = page.viewportSize()?.width || 0
    
    // Input should be close to full width (accounting for padding)
    expect(inputWidth).toBeGreaterThan(viewportWidth * 0.8)
    
    // Verify buttons are touch-friendly (min 44x44px)
    const submitButton = page.locator('button[type="submit"]')
    const buttonHeight = await submitButton.evaluate(el => el.offsetHeight)
    
    expect(buttonHeight).toBeGreaterThanOrEqual(44)
  })
})
6.3 Test Utilities
6.3.1 Mock Data Helpers
File: 
mock-data.ts

export const mockEvent = {
  event_id: 'mock-event-1',
  title: 'Test Concert',
  description: 'A test concert event',
  date: '2026-06-15T19:00:00Z',
  venue: {
    venue_id: 'mock-venue-1',
    name: 'Test Arena',
    city: 'Test City',
    address: '123 Test St'
  },
  price_range: { min: 50, max: 200 },
  available_seats: 100,
  image_url: 'https://example.com/image.jpg'
}

export const mockTicket = {
  ticket_id: 'mock-ticket-1',
  event: mockEvent,
  seat_number: 'A-15',
  status: 'active',
  qr_code: 'data:image/png;base64,mock-qr-code',
  purchase_date: '2026-04-01T10:00:00Z'
}

export const mockUser = {
  user_id: 'mock-user-1',
  email: 'user@example.com',
  full_name: 'Test User',
  role: 'user',
  credits: 1000
}
6.3.2 API Mock Helpers
File: 
api-mocks.ts

import { Page } from '@playwright/test'

export async function mockAPISuccess(page: Page, endpoint: string, response: any) {
  await page.route(`**/api${endpoint}`, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    })
  })
}

export async function mockAPIError(page: Page, endpoint: string, status: number, errorCode: string) {
  await page.route(`**/api${endpoint}`, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: errorCode,
          message: 'Mock error message'
        }
      })
    })
  })
}

export async function mockAPIOffline(page: Page) {
  await page.route('**/api/**', route => route.abort('failed'))
}
6.4 CI/CD Integration
6.4.1 GitHub Actions Workflow
File: 
e2e-tests.yml

name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
        
      - name: Run Playwright tests
        run: npx playwright test
        
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
6.5 Test Coverage Goals
Test Category	Target Coverage	Priority
Online/Offline transitions	100%	High
RBAC route protection	100%	High
RBAC UI visibility	100%	High
Purchase flow	90%	High
Transfer flow	90%	High
Admin flows	80%	Medium
Staff flows	80%	Medium
Accessibility (WCAG 2.1 AA)	100%	High
Responsive design	80%	Medium
Error handling	90%	High
7. Implementation Checklist
7.1 Phase 1 Deliverables
 All routes implemented per route map
 All form elements mapped to API payloads
 API client with interceptors configured
 Idempotency key generation implemented
 Error code mapping complete
7.2 Phase 2 Deliverables
 All layout components created
 All page components created
 All reusable components created
 Empty states implemented
 Skeleton loaders implemented
 Error states implemented
 ARIA attributes added
 Keyboard navigation working
 Focus indicators visible
7.3 Phase 3 Deliverables
 Design tokens defined in CSS
 All component styles applied
 Responsive breakpoints working
 Dark mode support (optional)
 Animations implemented
7.4 Phase 4 Deliverables
 Playwright configured
 All test scenarios written
 Test fixtures created
 Mock helpers implemented
 CI/CD pipeline configured
 Test coverage meets goals
8. Appendix
8.1 Key Files Reference
File	Purpose
client.ts
Axios instance with interceptors
auth.ts
Authentication state and role management
index.ts
Route definitions and guards
mockData.ts
Offline mode mock data
useWebSocket.ts
Real-time notifications
App.vue
Root component with offline listeners
main.ts
App initialization
8.2 Environment Variables
Variable	Purpose	Example
VITE_API_BASE_URL	Backend API URL	http://localhost:8000/api
VITE_KONG_API_KEY	Kong Gateway API key	your-api-key
VITE_WS_URL	WebSocket URL	ws://localhost:8000/ws
VITE_DEMO_MODE	Force demo mode	true or false
8.3 Browser Support
Browser	Minimum Version
Chrome	90+
Firefox	88+
Safari	14+
Edge	90+
8.4 Performance Targets
Metric	Target
First Contentful Paint	< 1.5s
Time to Interactive	< 3.5s
Largest Contentful Paint	< 2.5s
Cumulative Layout Shift	< 0.1
First Input Delay	< 100ms
Document Version: 1.0
Last Updated: April 4, 2026
Status: Complete
Next Review: Upon implementation start



---

That's the complete remaining content! Copy and paste this entire markdown block to the end of your `ticketremaster-f/docs/frontend_architecture_spec.md` file. The document now includes:

✅ **Phase 1**: Complete route mapping and element mapping with API payloads  
✅ **Phase 2**: UI/UX redesign strategy with component hierarchy and accessibility requirements  
✅ **Phase 3**: Complete style guide application with design tokens and component styles  
✅ **Phase 4**: Comprehensive Playwright testing strategy with 10+ test scenario files

The spec is now complete and ready for implementation!
