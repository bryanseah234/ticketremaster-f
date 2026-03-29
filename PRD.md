# ESD Microservices — Event Ticketing Platform

This project is an event ticketing platform built with a microservices architecture. It supports ticket purchasing, a peer-to-peer resale marketplace with OTP verification, credit-based payments via Stripe, QR-code entry at venues, and role-based access for users, admins, and staff.

---

## Architecture Overview

The system is organized into three layers: **Atomic Services** (data owners), **Composite Services** (orchestrators), and **External Services** (third-party wrappers). Services communicate via REST APIs. RabbitMQ handles async tasks (seat hold expiry, seller notifications).

---

## Atomic Services

### User Service
- **Purpose:** User accounts, roles, credentials
- **DB:** userId, email, password (hashed), salt, phoneNumber, role (staff/admin/user), isFlagged, createdAt

### Event Service
- **Purpose:** Event creation and details
- **Methods:** set default image, CRUD event, set venue, populate seat inventory
- **DB:** eventId, venueId, name, date, description, type (e.g. concert), image, price, createdAt, updatedAt

### Venue Service
- **Purpose:** Venue data
- **DB:** venueId, name, capacity, coordinates, address, postalCode, isActive

### Seat Service
- **Purpose:** Static seat definitions per venue
- **DB:** seatId, venueId, seatNumber, rowNumber

### Seat Inventory Service
- **Purpose:** Per-event seat availability and locking. Records are created when an event is created.
- **DB:** inventoryId, seatId, eventId, venueId, seatNumber, rowNumber, status (sold/held/available), heldUntil

### Ticket Service
- **Purpose:** Ticket ownership and QR data
- **DB:** ticketId, inventoryId, ownerId, venueId, eventId, price, status (active/listed/pending_transfer/transferred/used/expired), qrHash, qrTimestamp, createdAt

### Ticket Log Service
- **Purpose:** Scan and entry audit log
- **DB:** logId, timestamp, ticketId, staffId, status (checkedin/expiredqr/notfound/wrongvenue)

### Marketplace Service
- **Purpose:** Resale listings
- **DB:** listingId, ticketId, sellerId, price, createdAt

### Transfer Service
- **Purpose:** P2P transfer state machine
- **DB:** transferId, listingId, buyerId, sellerId, status (pending_buyer_otp/pending_seller_otp/pending_acceptance/completed/cancelled/failed), creditAmount, buyerOtpVerified (bool), sellerOtpVerified (bool), buyerVerificationSid, sellerVerificationSid, completedAt, createdAt, updatedAt

### Credit Service [OutSystems]
- **Purpose:** Credit balances
- **DB:** accountId, userId, creditBalance

### Credit Transaction Service
- **Purpose:** Credit debit/credit audit log
- **DB:** txnId, userId, delta (positive = top up, negative = spent), reason (topup/ticket_purchase/p2p_sent/p2p_received), referenceId (stripePaymentIntentId for topups, ticketId for purchases, transferId for P2P transfers), createdAt

---

## Composite Services (Orchestrators)

### Auth Orchestrator
- Handles: Registration, Login

### Event Orchestrator
- Handles: All events and seat browsing for events

### Credit Orchestrator
- Handles: Credit top-up via Stripe
- **Flow:**
  1. Receive top-up request from user
  2. Call Stripe Payment Wrapper
  3. Receive confirmation from Stripe Payment Wrapper
  4. Call Credit Service → update balance
  5. Call Credit Transaction Service → log top-up delta with stripePaymentIntentId as referenceId, reason: topup

### Ticket Purchase Orchestrator
- Handles: Buying ticket for an event
- **Flow:**
  1. User selects seat → call Seat Inventory Service → set status to held, set heldUntil
  2. Publish message to TTL queue with inventoryId and hold TTL
  3. User confirms purchase → check credits via Credit Service
  4. If insufficient credits → call Seat Inventory Service to release hold, ack and discard TTL message, return error
  5. Call Seat Inventory Service → set status to sold
  6. Ack and discard TTL message since purchase completed
  7. Call Ticket Service → create ticket record
  8. Call Credit Service → deduct credits
  9. Call Credit Transaction Service → log debit delta

### Marketplace Orchestrator
- Handles: Listing a ticket for resale
- **Flow:**
  1. Seller requests to list ticket → validate ticket belongs to seller via Ticket Service
  2. Check ticket status is active (not already listed, used, or in transfer)
  3. Call Ticket Service → update ticket status to listed
  4. Call Marketplace Service → create listing record

### Transfer Orchestrator
- Handles: Full P2P transfer flow
- **Flow:**
  1. Buyer selects listing → call Marketplace Service to validate listing is still active
  2. Check credits via Credit Service
  3. If credits sufficient, call OTP Wrapper → send OTP to buyer, receive buyerVerificationSid
  4. If credits insufficient, return error
  5. Call Transfer Service → create transfer record with status pending_buyer_otp, store buyerVerificationSid
  6. Buyer submits OTP → call OTP Wrapper → verify using buyerVerificationSid
  7. If buyer OTP fails → update Transfer status to failed, return error
  8. If buyer OTP passes → call Transfer Service → set buyerOtpVerified = true, status = pending_acceptance
  9. Publish message to Seller Notification Queue with transferId, sellerId, listingId
  10. Transfer Orchestrator consumes message → triggers seller notification
  11. Seller is notified that a verified buyer wants their ticket
  12. Seller clicks accept → call OTP Wrapper → send OTP to seller, receive sellerVerificationSid
  13. Call Transfer Service → update sellerVerificationSid, status = pending_seller_otp
  14. Seller submits OTP → call OTP Wrapper → verify using sellerVerificationSid
  15. Execute transfer atomically:
      - Call Credit Service → deduct credits from buyer
      - Call Credit Service → add credits to seller
      - Call Credit Transaction Service → log p2p_sent for buyer
      - Call Credit Transaction Service → log p2p_received for seller
      - Call Ticket Service → update ownerId to buyer, status = active
      - Call Marketplace Service → mark listing as completed
      - Call Transfer Service → status = completed, set completedAt

### QR Orchestrator
- Handles: Generating a fresh QR code when user opens their ticket
- **Flow:**
  1. User opens ticket → validate ticket belongs to user via Ticket Service
  2. Check ticket status is active (not listed, used, transferred, etc.)
  3. Generate new qrHash (e.g. hash(ticketId + timestamp + secret)) and qrTimestamp
  4. Call Ticket Service → update qrHash and qrTimestamp
  5. Return QR data to frontend for rendering

### Ticket Verification Orchestrator
- Handles: Staff scanning QR at venue gate
- **Flow:**
  1. Staff scans QR → orchestrator receives qrHash
  2. Call Ticket Service → look up ticket by qrHash
  3. Check qrTimestamp — if older than 60s → log to Ticket Log Service as expiredQR, return error
  4. Call Event Service → validate event is legitimate and active
  5. Call Seat Inventory Service → confirm seat status is sold
  6. Check ticket status is active (not listed, transferred, used)
  7. Call Ticket Log Service → check if ticketId has already been scanned with status checked_in → if yes, reject as duplicate scan
  8. Check venueId on ticket matches the staff's current venue → if not, return redirect to correct venue (look up venue via Venue Service)
  9. All checks pass → call Ticket Service → update status to used
  10. Call Ticket Log Service → create record with status checked_in

---

## External Services

### Stripe Wrapper Service
- Wraps Stripe API for payment processing (credit top-ups)

### SMU Notification Wrapper Service
- Wraps SMU utilities API for OTP delivery and notifications
- Used for: sending OTP to buyer/seller during transfers, notifying seller of pending transfers

---

## RabbitMQ Design

### Queue 1: Seat Hold Expiry
- **Purpose:** Release a held seat automatically when heldUntil lapses
- **Flow:**
  1. When Ticket Purchase Orchestrator sets a seat to held, publish message to TTL queue with hold duration as message TTL (5 mins)
  2. If user completes purchase within TTL → orchestrator acks and discards the message
  3. If TTL lapses → message is dead-lettered to DLX
  4. Ticket Purchase Orchestrator consumes DLX message → calls Seat Inventory Service to release seat back to available

### Queue 2: Seller Notification
- **Purpose:** Notify seller that a verified buyer wants their ticket after buyer OTP is confirmed
- **Flow:**
  1. After buyer OTP is verified in Transfer Orchestrator, publish message to Seller Notification Queue
  2. Transfer Orchestrator consumes this message and notifies the seller (via websocket push or frontend polling)

---

## Frontend Pages

### Auth & Setup
- **Sign up page:** Text inputs for email, name, phone number, password. Role defaults to "user."
- **Login page:** Email + password. Route by role after login (user → homepage, admin → admin profile, staff → QR scanner).

### Core User Pages
- **Homepage (landing page):** Display upcoming events. Interactive globe with pins at event locations (using venue coordinates).
- **Event page (browse events):** Event cards showing name, description, type, time, base price, venue info. View more button, favourite button. Credit reminder popup. Labels: active / over / (decide third status). Seat selection popup on "view more."
- **Event detail page:** Full event details, event image, venue details (name, address, capacity). Seat availability summary. "Buy ticket" CTA.
- **Buy ticket page:** Seat map showing available/held/sold from Seat Inventory. Clicking seat → held with 5-min TTL. Show credit balance vs price. Countdown timer for hold expiry. Insufficient credits → error + redirect to top up. Success popup.
- **Marketplace page:** Resale tickets displayed as event cards. Show event name, description, type, date, credits, seat info. Filter by event/price/date.
- **Transfer page (OTP verification):** Two-phase OTP: buyer verifies first → seller notified → seller accepts → seller verifies. Transfer states: INITIATED → pending_buyer_otp → pending_acceptance → pending_seller_otp → completed. Status tracker. OTP resend button. Success popup + "ticket added to your tickets" corner popup.
- **Your tickets:** Display user's tickets with status. "Generate QR code" button (disabled when status = listed). QR expires after 60 seconds — show countdown timer with auto-refresh. "List on marketplace" button for active tickets. Show event details alongside each ticket.
- **Profile page:** Show profile (username, email, etc.), payment options, credit balance, top up button. Transaction history from Credit Transaction Service.
- **Top up page:** Connected to Stripe API. Preset amount buttons + custom amount. Stripe Elements for card input. Show current balance + new balance after top up.

### Admin & Staff
- **Admin — create event:** Event name, description, venue (dropdown from Venue Service, active only), price, date/time picker. Event type determines default image. Creating event auto-populates seat inventory.
- **Staff — QR scanner:** Camera integration for QR scanning. Color-coded feedback: green = PASS, red = FAILED (EXPIRED), yellow = WRONG VENUE (show correct venue). Scan history for current session. Manual ticket ID entry fallback.

### Global Components
- **Navbar:** Role-aware links. Credit balance display. Notification bell for transfer requests.
- **Footer:** Centralised, clean links.
- **Notifications:** Seller notification when buyer completes OTP (websocket or polling). In-app notification center or toast notifications.
- **Error/loading states:** Loading spinners during orchestrator calls. Insufficient credits error. Seat no longer available error. OTP failure states. Network error/timeout handling.

---

## Known Gaps & Decisions Needed

1. **Favourites storage:** Event page has a favourite button but no Favourite Service or DB field exists. Need either a new atomic service or a field in User Service.
2. **Notification delivery mechanism:** Backend has RabbitMQ Queue 2 for seller notifications but frontend has no mechanism to receive them. Decide: websocket push vs polling.
3. **Third event label:** Event page labels are "active / over / ??". Decide: "upcoming", "sold out", or something else.
4. **Forgot password flow:** No reset mechanism exists in current services.
5. **Event edit/delete:** Admin can create events but no edit/update/cancel functionality is specified.
6. **Unlist from marketplace:** No flow specified for removing a listing.
7. **Transfer timeout:** What happens if seller doesn't respond to a transfer request?
8. **isFlagged field:** User Service has isFlagged but no admin UI for managing flagged users.

---

## Work Split

- **Jaslyn:** Ticket, Ticket Log, Marketplace, Transfer, and RabbitMQ
- **JingWei:** (to be assigned)
- **Brian:** (to be assigned)
