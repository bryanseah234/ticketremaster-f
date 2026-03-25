# TicketRemaster — Frontend To-Do List

## Overview
TicketRemaster UI consists of three core service flows:
- **Purchase Ticket Service**
- **Transfer Ticket Service**
- **Ticket Verification Service**

All API calls go directly to individual backend orchestrators running on `localhost` since the proxy gateway is not used. Protected routes require `Authorization: Bearer <token>` in the request header.

---

## 1. Authentication

**Pages/Components:** Register, Login, Profile

### Tasks
- [x] **Register page** — form with `email`, `password`, `phoneNumber`
  - `POST /auth/register`
  - Handle errors: `VALIDATION_ERROR` (400), `EMAIL_ALREADY_EXISTS` (409)
- [x] **Login page** — form with `email`, `password`
  - `POST /auth/login`
  - Store returned JWT token (e.g. in memory or secure cookie)
  - Handle errors: `INVALID_CREDENTIALS` (401), `ACCOUNT_FLAGGED` (403)
- [x] **Profile page** — display current user info
  - `GET /auth/me`
  - Show: `userId`, `email`, `phoneNumber`, `role`, `isFlagged`, `createdAt`
  - Handle error: `UNAUTHORIZED` (401)
- [x] **JWT management** — attach Bearer token to all protected requests; handle token expiry (`expiresAt`)

---

## 2. Credits

**Pages/Components:** Credits Dashboard, Top-Up Flow

### Tasks
- [x] **Credit balance display**
  - `GET /credits/balance`
  - Show `creditBalance` and `lastToppedUpAt`
- [x] **Top-up initiation**
  - `POST /credits/topup/initiate` with `{ amount: number }`
  - Receive `clientSecret` and render **Stripe payment UI** (Stripe Elements)
  - Handle errors: `INVALID_AMOUNT` (400), `UNAUTHORIZED` (401)
- [x] **Stripe webhook** — handled server-side by Stripe; frontend only needs to show success/failure after Stripe UI completes
- [x] **Credit transaction history page**
  - `GET /credits/transactions?page=&limit=`
  - Paginated table showing `txnId`, `delta`, `reason`, `referenceId`, `createdAt`
  - Handle pagination controls

---

## 3. Events Browsing (Public — No Auth Required)

**Pages/Components:** Events List, Event Detail, Seat Map, Seat Detail

### Tasks
- [x] **Events listing page**
  - `GET /events?page=&limit=&type=`
  - Display event cards: `name`, `date`, `type`, `image`, `price`, `venue`, `seatsAvailable`
  - Filter by event type (concert, orchestra, etc.)
  - Pagination
- [x] **Event detail page**
  - `GET /events/:eventId`
  - Show full details including venue `address`, `postalCode`, `coordinates`, `capacity`
  - Handle error: `EVENT_NOT_FOUND` (404)
- [x] **Seat availability map**
  - `GET /events/:eventId/seats`
  - Interactive seat grid showing status: `available` / `held` / `sold`
  - Colour-code seats by status
  - Handle error: `EVENT_NOT_FOUND` (404)
- [x] **Seat detail panel/modal**
  - `GET /events/:eventId/seats/:inventoryId`
  - Show seat info (`seatNumber`, `rowNumber`, `status`, `heldUntil`) and event/venue summary
  - Display "Hold Seat" CTA (proceeds to purchase flow if authenticated)
  - Handle errors: `EVENT_NOT_FOUND` (404), `SEAT_NOT_FOUND` (404)

---

## 4. Ticket Purchase Flow (Auth Required)

**Pages/Components:** Hold Seat, Purchase Confirmation

### Tasks
- [x] **Hold seat action**
  - `POST /purchase/hold/:inventoryId`
  - Lock seat for 10 minutes; show countdown timer using `heldUntil`
  - Handle errors: `SEAT_NOT_AVAILABLE` (409), `SEAT_NOT_FOUND` (404), `UNAUTHORIZED` (401)
- [x] **Purchase confirmation page**
  - `POST /purchase/confirm/:inventoryId`
  - Show ticket summary on success: `ticketId`, `eventId`, `seatNumber`, `rowNumber`, `price`, `status`
  - Handle errors:
    - `SEAT_NOT_HELD` (400) — seat not held by this user
    - `HOLD_EXPIRED` (400) — hold expired, redirect back to seat map
    - `INSUFFICIENT_CREDITS` (402) — prompt user to top up
    - `SEAT_NOT_FOUND` (404), `UNAUTHORIZED` (401)

---

## 5. Marketplace (Browse & List Tickets for Resale)

**Pages/Components:** Marketplace Listing Page, List Ticket Modal, My Listings

### Tasks
- [x] **Browse resale listings**
  - `GET /marketplace?eventId=&page=&limit=`
  - Display: `listingId`, `price`, seller email, event details, seat info
  - Filter by event; pagination
- [x] **List a ticket for resale**
  - `POST /marketplace/list` with `{ ticketId }`
  - Trigger from user's ticket detail view
  - Handle errors: `TICKET_NOT_ELIGIBLE` (400), `NOT_TICKET_OWNER` (403), `TICKET_NOT_FOUND` (404)
- [x] **Cancel/delist a listing**
  - `DELETE /marketplace/:listingId`
  - Confirm prompt before deletion
  - Handle errors: `NOT_LISTING_OWNER` (403), `LISTING_NOT_ACTIVE` (400), `LISTING_NOT_FOUND` (404)

---

## 6. Transfer Flow — P2P Ticket Purchase (Auth Required)

**Pages/Components:** Transfer Initiation, OTP Verification screens (buyer & seller), Transfer Status Polling

### Tasks
- [x] **Buyer: Initiate transfer**
  - `POST /transfer/initiate` with `{ listingId }`
  - Show "OTP sent to your phone" message; display `transferId`
  - Handle errors: `LISTING_NOT_ACTIVE` (400), `CANNOT_BUY_OWN_LISTING` (403), `INSUFFICIENT_CREDITS` (402), `LISTING_NOT_FOUND` (404)
- [x] **Buyer: OTP verification screen**
  - `POST /transfer/:transferId/buyer-verify` with `{ otp }`
  - 6-digit OTP input; show status update on success (`pending_seller_acceptance`)
  - Handle errors: `INVALID_OTP` (400), `WRONG_TRANSFER_STATUS` (400), `TRANSFER_NOT_FOUND` (404)
- [x] **Seller: Accept transfer request**
  - `POST /transfer/:transferId/seller-accept`
  - Seller receives notification and confirms; show "OTP sent" message
  - Handle errors: `NOT_SELLER` (403), `WRONG_TRANSFER_STATUS` (400), `TRANSFER_NOT_FOUND` (404)
- [x] **Seller: OTP verification screen**
  - `POST /transfer/:transferId/seller-verify` with `{ otp }`
  - On success, show transfer `completed` and new ticket ownership details
  - Handle errors: `INVALID_OTP` (400), `WRONG_TRANSFER_STATUS` (400), `INSUFFICIENT_CREDITS` (402), `TRANSFER_NOT_FOUND` (404)
- [x] **Transfer status polling**
  - `GET /transfer/:transferId`
  - Poll to reflect live status: `pending_buyer_otp` → `pending_seller_acceptance` → `pending_seller_otp` → `completed`
  - Show `buyerOtpVerified`, `sellerOtpVerified` progress indicators
  - Handle errors: `ACCESS_DENIED` (403), `TRANSFER_NOT_FOUND` (404)
- [x] **Cancel transfer**
  - `POST /transfer/:transferId/cancel`
  - Available for both buyer and seller before completion
  - Handle errors: `ACCESS_DENIED` (403), `TRANSFER_ALREADY_COMPLETED` (400), `TRANSFER_NOT_FOUND` (404)

---

## 7. My Tickets & QR Code (Auth Required)

**Pages/Components:** My Tickets List, Ticket Detail / QR Screen

### Tasks
- [x] **My tickets list**
  - `GET /tickets`
  - Show all tickets with event name, date, venue, seat, price, and status
- [x] **Ticket QR code screen**
  - `GET /tickets/:ticketId/qr`
  - Display QR code image generated from `qrHash`
  - Show expiry countdown (`expiresAt` = 60s TTL); auto-refresh on expiry
  - Handle errors: `NOT_TICKET_OWNER` (403), `TICKET_NOT_ACTIVE` (400), `TICKET_NOT_FOUND` (404)
  - **Note:** Call this endpoint every time the user opens the ticket screen — do not cache the QR

---

## 8. Ticket Verification (Staff Role Only)

**Pages/Components:** Staff Scanner App

### Tasks
- [x] **QR scan interface**
  - Camera/QR reader component that captures `qrHash`
  - `POST /verify/scan` with `{ qrHash }`
  - Requires staff JWT with `venueId` claim
- [x] **Scan result display**
  - `checked_in` → green success screen with ticket and seat details
  - `QR_EXPIRED` (400) → prompt attendee to refresh
  - `DUPLICATE_SCAN` (400) → already scanned warning
  - `WRONG_VENUE` (400) → show correct venue name and address
  - `TICKET_INVALID` (400) → invalid ticket state error
  - Handle: `UNAUTHORIZED` (401), `NOT_STAFF` (403), `QR_NOT_FOUND` (404)

---

## 9. Global / Shared Tasks

- [x] **Error envelope handling** — all errors return `{ success: false, error: { code, message } }`; build a global error handler/interceptor
- [x] **Auth guard** — redirect unauthenticated users to login for protected routes
- [x] **Role-based routing** — staff role routes to scanner app; user role routes to main app
- [x] **Stripe integration** — install Stripe.js / Stripe Elements for credit top-up UI
- [x] **JWT expiry handling** — detect expired token and prompt re-login
- [x] **Pagination component** — reusable for events, marketplace, transactions
- [x] **OTP input component** — 6-digit input for transfer verification screens
- [x] **Loading / skeleton states** — for all async API calls
- [x] **Toast / notification system** — for success and error feedback across flows

---

## API Summary Reference

| Orchestrator | Base Path | Port | Auth |
|---|---|---|---|
| Auth | `/auth` | 6010 | Public (register/login); JWT for `/me` |
| Credits | `/credits` | 6006 | JWT required |
| Events | `/events` | 6001 | Public |
| Purchase | `/purchase` | 6002 | JWT required |
| Marketplace | `/marketplace` | 6003 | JWT required |
| Transfer | `/transfer` | 6004 | JWT required |
| QR / Tickets | `/tickets` | 6009 | JWT required |
| Verification | `/verify` | 6008 | Staff JWT required |
