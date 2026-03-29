# Product Requirements Document (PRD)

## Executive Summary

**TicketRemaster** is a full-stack event ticketing platform that combines primary ticket sales with a peer-to-peer (P2P) resale marketplace. The system enables event organizers to create and manage events with seat inventory, allows customers to purchase tickets using a credit-based payment system (powered by Stripe), and facilitates secure ticket transfers between users via OTP verification. The platform features role-based access control for three user types: regular users, administrators, and venue staff.

The frontend is a Vue 3 Single Page Application (SPA) with a premium glassmorphic UI design, featuring resilient offline mode with mock data fallback when backend services are unavailable. The application communicates with a microservices backend through a Kong API Gateway, implementing idempotency keys for state-changing operations and exponential backoff for retry scenarios.

---

## System Architecture & Data Flow

### High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Vue 3 SPA     │────▶│   Kong Gateway   │────▶│  Orchestrator       │
│  (Frontend)     │     │  (API Gateway)   │     │  Services           │
│                 │     │                  │     │                     │
│  • Glassmorphic │     │  • Rate Limiting │     │  • Auth             │
│    UI           │     │  • Key Auth      │     │  • Credits          │
│  • Pinia Store  │     │  • Routing       │     │  • Purchase         │
│  • Vue Router   │     │  • SSL           │     │  • Marketplace      │
│  • Axios Client │     │                  │     │  • Transfer         │
└─────────────────┘     └──────────────────┘     │  • QR/Tickets       │
        │                                                │
        │                                                ▼
        │                                        ┌─────────────────────┐
        │                                        │   Atomic Services   │
        │                                        │                     │
        │                                        │  • User Service     │
        │                                        │  • Event Service    │
        │                                        │  • Venue Service    │
        │                                        │  • Seat Service     │
        │                                        │  • Seat Inventory   │
        │                                        │  • Ticket Service   │
        │                                        │  • Marketplace Svc  │
        │                                        │  • Transfer Service │
        │                                        │  • Credit Service   │
        │                                        └─────────────────────┘
        ▼
┌─────────────────┐
│  External APIs  │
│                 │
│  • Stripe       │
│  • SMU Notify   │
└─────────────────┘
```

### Data Flow: Ticket Purchase

1. **Seat Selection**: User browses events → views seat map → selects available seat
2. **Hold Seat**: `POST /purchase/hold/{inventoryId}` → seat locked for 5 minutes (TTL queue)
3. **Checkout**: User confirms purchase → system validates credit balance
4. **Payment**: If sufficient credits → `POST /purchase/confirm/{inventoryId}` → ticket created
5. **Ticket Issuance**: Ticket record created with QR hash, ownership assigned to buyer

### Data Flow: P2P Transfer

1. **Listing**: Seller lists active ticket on marketplace → ticket status changes to `listed`
2. **Initiation**: Buyer initiates transfer → `POST /transfer/initiate` with `listingId`
3. **Buyer OTP**: System sends OTP to buyer → buyer verifies via `POST /transfer/{transferId}/buyer-verify`
4. **Seller Notification**: System notifies seller of verified buyer request
5. **Seller Accept**: Seller accepts → `POST /transfer/{transferId}/seller-accept`
6. **Seller OTP**: System sends OTP to seller → seller verifies via `POST /transfer/{transferId}/seller-verify`
7. **Completion**: Credits transferred, ticket ownership updated, listing marked complete

### Data Flow: Credit Top-Up

1. **Initiate**: `POST /credits/topup/initiate` with amount → returns Stripe `clientSecret`
2. **Stripe Payment**: Frontend uses Stripe Elements to process card payment
3. **Confirm**: `POST /credits/topup/confirm` with `paymentIntentId` → balance updated
4. **Idempotency**: Both endpoints support idempotency keys (24-hour TTL)

---

## Comprehensive Feature Matrix

### Core Functionality

#### 1. Authentication & User Management

| Feature | Status | Description |
|---------|--------|-------------|
| User Registration | ✅ Implemented | `POST /auth/register` with email, phone, password |
| User Login | ✅ Implemented | `POST /auth/login` returns JWT token |
| Session Management | ✅ Implemented | Token stored in localStorage, auto-attached to requests |
| Role-Based Access | ✅ Implemented | Three roles: `user`, `admin`, `staff` |
| Profile Management | ✅ Implemented | View user details, credit balance, transaction history |
| Logout | ✅ Implemented | Clears session and redirects to login |

**Edge Cases Handled:**
- Email already exists (409 conflict)
- Invalid credentials (401 unauthorized)
- Unverified account (403, redirects to verification page)
- Token expiry (auto-redirect to login)
- Account flagged (403 with message)

#### 2. Event Discovery & Browsing

| Feature | Status | Description |
|---------|--------|-------------|
| Event Listing | ✅ Implemented | Grid/list view with pagination, search, date filters |
| Event Details | ✅ Implemented | Full event info with venue details |
| Seat Map | ✅ Implemented | Interactive seat grid (available/held/sold) |
| Favorites | ✅ Implemented | localStorage-based, persisted across sessions |
| Event Types | ✅ Implemented | concert, sports, orchestra, theatre, festival, classical |

**Business Logic:**
- Events filtered by type, date range, search query
- Seat status color-coded: green (available), amber (held), gray (sold)
- Fallback to mock data when backend unavailable

#### 3. Ticket Purchase

| Feature | Status | Description |
|---------|--------|-------------|
| Seat Hold | ✅ Implemented | 5-minute TTL with countdown timer |
| Purchase Confirmation | ✅ Implemented | Validates credits, creates ticket |
| Credit Deduction | ✅ Implemented | Automatic on successful purchase |
| Hold Expiry Handling | ✅ Implemented | Auto-release via TTL queue |
| Conflict Resolution | ✅ Implemented | 409 for double-booking, 410 for expired hold |

**Edge Cases Handled:**
- Seat unavailable (409 Conflict)
- Hold expired (410 Gone)
- Insufficient credits (402 Payment Required)
- Event ended (410 Gone)

#### 4. Marketplace (P2P Resale)

| Feature | Status | Description |
|---------|--------|-------------|
| Browse Listings | ✅ Implemented | Filterable by event, date, price sort |
| List Ticket | ✅ Implemented | Set custom price for active tickets |
| Unlist Ticket | ✅ Implemented | Remove listing, restore ticket to active |
| Buy from Marketplace | ✅ Implemented | Initiates transfer flow |

**Business Logic:**
- Only `active` tickets can be listed
- Listed tickets cannot generate QR codes
- Seller can unlist at any time before sale

#### 5. Transfer System

| Feature | Status | Description |
|---------|--------|-------------|
| Transfer Initiation | ✅ Implemented | Buyer starts P2P purchase |
| OTP Verification | ✅ Implemented | 6-digit OTP for both buyer and seller |
| Rate Limiting | ✅ Implemented | Max 3 OTP attempts per 15 minutes |
| Status Polling | ✅ Implemented | 5-second interval for real-time updates |
| Transfer Cancellation | ✅ Implemented | Both parties can cancel before completion |
| Auto-Cancel | ⚠️ Backend only | 24-hour timeout for pending transfers |

**State Machine:**
```
pending_seller_acceptance → pending_buyer_otp → pending_seller_otp → completed
                                ↓                      ↓
                            cancelled              completed
```

#### 6. QR Code & Ticket Verification

| Feature | Status | Description |
|---------|--------|-------------|
| QR Generation | ✅ Implemented | Fresh QR hash every 60 seconds |
| QR Display | ✅ Implemented | Countdown timer with auto-refresh |
| Staff Scanner | ✅ Implemented | Camera-based QR scanning |
| Manual Entry | ✅ Implemented | Fallback ticket ID verification |
| Scan Results | ✅ Implemented | PASS (green), FAILED (red), WRONG_VENUE (yellow) |

**Security:**
- QR codes expire after 60 seconds
- Duplicate scan detection
- Venue validation (staff must be at correct venue)

#### 7. Credit System

| Feature | Status | Description |
|---------|--------|-------------|
| Balance Display | ✅ Implemented | Real-time credit balance in navbar |
| Stripe Top-Up | ✅ Implemented | Card payment via Stripe Elements |
| Transaction History | ✅ Implemented | Paginated list of all credit movements |
| Idempotency Keys | ✅ Implemented | Prevents duplicate charges (24h TTL) |

**Transaction Types:**
- `topup` - Credit added via Stripe
- `ticket_purchase` - Credit spent on ticket
- `p2p_sent` - Credit transferred to seller
- `p2p_received` - Credit received from buyer

#### 8. Admin Features

| Feature | Status | Description |
|---------|--------|-------------|
| Event Creation | ✅ Implemented | Full event setup with venue, pricing, seat count |
| User Management | ✅ Implemented | View and manage user accounts |
| Event Dashboard | ✅ Implemented | Real-time sales and inventory tracking |

---

### Deprecated/Altered Features

| Original Feature | Current Status | Reason for Change |
|------------------|----------------|-------------------|
| Favourites Service (backend) | Not implemented | Stored client-side in localStorage instead |
| RabbitMQ async notifications | Simplified to polling | Frontend polls `/transfer/pending` every 8s |
| WebSocket push notifications | Not implemented | Polling-based notification system used |
| Forgot password flow | Not implemented | Out of scope for MVP |
| Event edit/delete | Partially implemented | Only create supported in current UI |

---

## Non-Functional Requirements

### Performance

- **Initial Load**: < 3 seconds on 3G connection
- **API Response Time**: < 500ms for read operations, < 2s for write operations
- **Offline Mode**: Instant fallback to cached/mock data when backend unavailable
- **Bundle Size**: Optimized with Vite, code splitting enabled

### Security

- **Authentication**: JWT tokens with expiration, stored in localStorage
- **Authorization**: Role-based access control (user, admin, staff)
- **API Security**: Kong gateway with key authentication and rate limiting
- **Idempotency**: State-changing operations protected against duplicates
- **CORS**: Configured for production domain only

### Scalability

- **Frontend**: CDN-ready static assets via Vercel deployment
- **API Gateway**: Kong handles load balancing and rate limiting
- **Microservices**: Independent scaling per service (2 pods per service in production)
- **Database**: PostgreSQL with connection pooling

### Fault Tolerance

- **Offline Mode**: Automatic detection and graceful degradation
- **Retry Logic**: Exponential backoff for transient failures (429, 503, 408, 504)
- **Error Boundaries**: Global error handler with user-friendly messages
- **Idempotency Cache**: Client-side cache for retry scenarios

---

## Future Roadmap

### Phase 1: Core Improvements

1. **WebSocket Integration**: Replace polling with real-time notifications
2. **Event Editing**: Full CRUD operations for event management
3. **Transfer Timeout Handling**: Auto-cancel expired transfers with user notification
4. **Flagged User Management**: Admin UI for managing flagged accounts

### Phase 2: Enhanced Features

1. **Favourites Backend**: Persist favorites across devices
2. **Password Reset**: Email-based password recovery flow
3. **Multi-language Support**: i18n for international markets
4. **Accessibility**: WCAG 2.1 AA compliance

### Phase 3: Technical Debt

1. **Test Coverage**: Increase E2E test coverage to 80%
2. **Type Safety**: Full TypeScript migration for all components
3. **Performance**: Implement virtual scrolling for large lists
4. **Monitoring**: Add error tracking (Sentry) and analytics
