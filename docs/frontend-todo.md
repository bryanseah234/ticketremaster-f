# TicketRemaster — Frontend To-Do List

> **Status as of Phase 4 completion** — all items below are implemented.
> All API calls go through Kong at `VITE_API_BASE_URL` (no `/api/` prefix).
> Protected routes require `Authorization: Bearer <token>` + `apikey: <key>` headers.

---

## 1. Authentication

**Pages/Components:** Register, Login, VerifyView, Profile

### Tasks

- [x] **Register page** — form with `email`, `password`, `phoneNumber`
  - `POST /auth/register` → returns `{ data: { userId, email, role, createdAt } }` — **no token**
  - Handle errors: `VALIDATION_ERROR` (400), `EMAIL_ALREADY_EXISTS` (409)
- [x] **OTP verification page** (`/verify`) — after registration, user enters 6-digit SMS OTP
  - `POST /auth/verify-registration` with `{ userId, otpCode }` → returns JWT token
  - Handle errors: `NO_PENDING_VERIFICATION` (400), `OTP_INVALID` (401), `USER_NOT_FOUND` (404)
- [x] **Login page** — form with `email`, `password`
  - `POST /auth/login` → returns `{ data: { token, expiresAt, user: { userId, email, role } } }`
  - Handle errors: `AUTH_INVALID_CREDENTIALS` (401), `AUTH_FORBIDDEN` (403 — flagged account)
- [x] **Profile page** — display current user info via `ProfileField.vue` and `StatusBadge.vue`
  - `GET /auth/me` → `{ data: { userId, email, phoneNumber, role, isFlagged, createdAt } }`
  - `isDemoMode()` fallback: uses `auth.state.user` directly
- [x] **JWT management** — Bearer token attached to all protected requests; demo sessions use `sessionStorage`
- [x] **demoLogin(role)** — `auth.demoLogin('user'|'admin'|'staff')` persists to `sessionStorage` only

---

## 2. Credits

**Pages/Components:** CreditTopupView, ProfileView (balance + history)

### Tasks

- [x] **Credit balance display** — `GET /credits/balance` → `{ data: { creditBalance, ... } }`
- [x] **Top-up initiation** — `POST /credits/topup/initiate` with `{ amount }` → `{ data: { clientSecret, paymentIntentId, amount } }`
  - Stripe Elements card form in live mode; "Simulate Top Up" button in demo mode
- [x] **Top-up confirmation** — `POST /credits/topup/confirm` with `{ paymentIntentId }` → `{ data: { status, new_balance } }`
- [x] **Credit transaction history** — `GET /credits/transactions?page=&limit=` → paginated list

---

## 3. Events Browsing (Public)

**Pages/Components:** EventListView, EventDetailView, SeatSelectionView

### Tasks

- [x] **Events listing page** — `GET /events?page=&limit=&type=`
  - Uses `EventCard.vue` component; type filter dropdown; pagination (10/page)
  - `isDemoMode()` fallback via `mockServices.getEvents()`
  - Backend field: `date` (not `eventDate`)
- [x] **Event detail page** — `GET /events/:eventId`
  - Full details: name, date, type (`StatusBadge`), venue, description, price, seatsAvailable
  - "Select Seats" button → `/events/:eventId/seats`
  - `isDemoMode()` fallback via `mockServices.getEvent()`
- [x] **Seat availability map** — `GET /events/:eventId/seats`
  - `SeatGrid.vue` accepts `seats: SeatWithInventory[]` prop
  - Status values: `available` / `held` / `sold` / `reserved`
  - `isDemoMode()` fallback via `mockServices.getSeats()`

---

## 4. Ticket Purchase Flow (Auth Required)

**Pages/Components:** SeatSelectionView, CheckoutView

### Tasks

- [x] **Hold seat** — `POST /purchase/hold/:inventoryId` → `{ data: { inventoryId, status: "held", heldUntil, holdToken } }`
  - 5-minute countdown timer; `holdToken` stored in `localStorage.pendingOrder`
- [x] **Purchase confirmation** — `POST /purchase/confirm/:inventoryId` with `{ eventId, holdToken }` + `Idempotency-Key` header
  - `isDemoMode()` fallback: simulates 1.5s delay, returns mock ticket
  - Error codes: `SEAT_UNAVAILABLE` (409), `PAYMENT_HOLD_EXPIRED` (410), `INSUFFICIENT_CREDITS` (402)
- [x] **Release hold on cancel** — `DELETE /purchase/hold/:inventoryId` with `{ holdToken }`

---

## 5. Marketplace (Browse & List Tickets for Resale)

**Pages/Components:** MarketplaceView

### Tasks

- [x] **Browse resale listings** — `GET /marketplace?page=&limit=`
  - Event filter dropdown; price sort; pagination (10/page)
  - `isDemoMode()` fallback via `mockServices.getMarketplaceListings()`
  - Backend enriches `sellerName` from seller's email prefix
- [x] **List a ticket for resale** — `POST /marketplace/list` with `{ ticketId, price }`
  - Only `active` tickets can be listed
- [x] **Cancel/delist a listing** — `DELETE /marketplace/:listingId`

---

## 6. Transfer Flow — P2P Ticket Purchase (Auth Required)

**Pages/Components:** TransferInitiateView, TransferConfirmView

### Tasks

- [x] **Buyer: Initiate transfer** — `POST /transfer/initiate` with `{ listingId }` only
  - `isDemoMode()` fallback: 1s delay, navigates to mock transfer page
  - Error codes: `LISTING_NOT_FOUND` (404), `INSUFFICIENT_CREDITS` (402), `AUTH_FORBIDDEN` (403)
- [x] **Transfer OTP state machine** — full flow via `TransferConfirmView.vue`
  - States: `pending_seller_acceptance` → `pending_buyer_otp` → `pending_seller_otp` → `completed`
  - `isDemoMode()` fallback: each step advances with 1s simulated delay
- [x] **Buyer OTP verify** — `POST /transfer/:transferId/buyer-verify` with `{ otp }`
- [x] **Seller accept** — `POST /transfer/:transferId/seller-accept`
- [x] **Seller OTP verify** — `POST /transfer/:transferId/seller-verify` with `{ otp }`
- [x] **OTP rate limiting** — 429 response → disable verify button, show MM:SS countdown (900s)
- [x] **Resend OTP** — `POST /transfer/:transferId/resend-otp`
- [x] **Cancel transfer** — `POST /transfer/:transferId/cancel`
- [x] **Expired state** — shown when `status === 'expired'`
- [x] **Status polling** — 5-second interval for real-time updates

---

## 7. My Tickets & QR Code (Auth Required)

**Pages/Components:** MyTicketsView, TicketDetailView

### Tasks

- [x] **My tickets list** — `GET /tickets` → enriched with event + venue
  - Uses `StatusBadge.vue`; `isDemoMode()` fallback via `mockServices.getMyTickets()`
  - Ticket status values: `active`, `used`, `listed`, `cancelled`
  - "List on Marketplace" and "Transfer Ticket" buttons only for `status === 'active'`
- [x] **Ticket detail / QR** — `GET /tickets/:ticketId/qr`
  - 60s TTL with auto-refresh; `isDemoMode()` shows `DEMO-QR-{ticketId}`
  - Full ticket details above QR: event, venue, seat, price, status

---

## 8. Ticket Verification (Staff Role Only)

**Pages/Components:** StaffScannerView

### Tasks

- [x] **QR scan interface** — camera-based QR reader → `POST /verify/scan` with `{ qrHash }`
- [x] **Manual entry** — `POST /verify/manual` with `{ ticketId }`
- [x] **Scan result display** — SUCCESS (green), FAILED (red), WRONG_VENUE (yellow)

---

## 9. Global / Shared Tasks

- [x] **Error envelope handling** — global Axios interceptor; all errors `{ error: { code, message } }`
- [x] **Auth guard** — `requiresAuth`, `requiresAdmin`, `requiresStaff` route meta
- [x] **Demo mode** — `isDemoMode()` checked at store/service level; `demoLogin(role)` for quick access
- [x] **New components** — `EventCard.vue`, `StatusBadge.vue`, `ProfileField.vue`
- [x] **Refined components** — `AppNavbar.vue` (demo pill, logout), `SeatGrid.vue` (SeatWithInventory type)
- [x] **TypeScript** — strict mode, `tsc --noEmit` exits 0, zero `@ts-ignore`
- [x] **Build** — `npm run build` exits 0, zero Vue template warnings
- [x] **Deployed** — pushed to `bryan` branch, Vercel deployment configured

---

## API Summary Reference

| Orchestrator | Kong Path | Auth |
|---|---|---|
| Auth | `/auth` | Public (register/login/verify-registration); JWT for `/me` |
| Credits | `/credits` | JWT + apikey |
| Events | `/events`, `/venues` | Public |
| Purchase | `/purchase` | JWT + apikey + Idempotency-Key |
| Marketplace | `/marketplace` | Public (GET); JWT + apikey (POST/DELETE) |
| Transfer | `/transfer` | JWT + apikey |
| QR / Tickets | `/tickets` | JWT + apikey |
| Verification | `/verify` | Staff JWT + apikey |
| Admin | `/admin/events` | Admin JWT |
