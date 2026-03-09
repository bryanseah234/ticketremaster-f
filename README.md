# TicketRemaster Frontend

Vue 3 SPA for event ticketing, talking to backend via the API Gateway at `http://localhost:8000/api` in local development.

## Features

- Landing page with hero, featured events, and CTA sections
- Event discovery with search, date filter, and favourites
- Event detail with seat availability preview and seat reserve flow
- Checkout with OTP flow for flagged users and credit balance display
- Tickets list and QR display with auto-refresh
- Ticket transfer initiate and confirm flows
- Credit top-up with Stripe Elements
- Marketplace page with required sections and listings
- Admin event creation and dashboard

## Routes

- `/` Landing
- `/events` Event listing
- `/events/:eventId` Event detail
- `/events/:eventId/seats` Seat selection
- `/login` Login
- `/register` Register
- `/verify` Verify registration
- `/checkout/:orderId` Checkout
- `/tickets` My tickets
- `/tickets/:seatId` Ticket QR
- `/tickets/:seatId/transfer` Transfer initiate
- `/transfer/:transferId` Transfer confirm
- `/credits/topup` Credit top-up
- `/profile` Profile + favourites
- `/marketplace` Marketplace
- `/admin/events/new` Admin event create
- `/admin/events/:eventId/dashboard` Admin event dashboard

## Tech Stack

- Vue 3 + Vite 7
- TypeScript
- Vue Router 4
- Pinia 2
- Axios
- Stripe.js
- @chenfengyuan/vue-qrcode + qrcode
- @vueuse/core
- dayjs

## Environment

Create a `.env` file (use `.env.example` as a template):

```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_replace_me
```

## Setup & Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Notes

- API contract reference: `API.md`
- OutSystems QR scanner is a separate app (see `outsystems/README.md`)
