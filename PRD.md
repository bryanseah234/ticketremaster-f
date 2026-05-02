# PRD: ticketremaster-f (Frontend)

## Overview
A Vue 3 + TypeScript frontend for the TicketRemaster ticketing platform. Provides event browsing, seat selection with interactive maps, ticket purchase via credit system, ticket management, P2P transfer, a resale marketplace, and an admin dashboard. End-to-end tested with Playwright.

## Goals
- Event discovery with search, filter by type/date/venue
- Interactive seat map with real-time availability
- Secure checkout with credit system + Stripe
- Ticket management: view, transfer, list on resale
- Marketplace for verified ticket resale
- Admin dashboard for event creation and user management
- Full Playwright E2E test suite

## Non-Goals
- Mobile native app
- Server-side rendering (SPA only)
- Backend logic (see ticketremaster-b)

## User Stories
- As a buyer, I want to browse events, click specific seats on an interactive map, and check out.
- As a ticket holder, I want to view my tickets with QR codes and transfer one to a friend.
- As a reseller, I want to list my ticket on the marketplace at a set price.
- As an admin, I want to create events, upload seat maps, and manage users.

## Tech Stack
- **Language**: TypeScript / Vue 3
- **Build**: Vite
- **UI Library**: Vue 3 Composition API
- **Payments**: Stripe.js (frontend)
- **Testing**: Playwright (E2E)
- **Deployment**: Docker (Dockerfile) + Vercel/Nginx

## Architecture
```
ticketremaster-f/
├── src/
│   ├── views/            # Pages: Events, EventDetail, Checkout, MyTickets, Marketplace, Admin
│   ├── components/       # SeatMap, TicketCard, Navbar, etc.
│   ├── stores/           # Pinia state management
│   ├── services/         # API clients for each backend service
│   └── router/           # Vue Router routes
├── public/               # Static assets
├── scripts/              # Utility scripts
├── playwright.config.ts  # E2E test config
└── vite.config.ts
```

**Key views:**
| View | Route | Purpose |
|------|-------|---------|
| Events | `/` | Browse + filter events |
| EventDetail | `/events/:id` | Event info + seat map |
| Checkout | `/checkout` | Credit payment + Stripe |
| MyTickets | `/tickets` | View QRs, transfer, list |
| Marketplace | `/marketplace` | Browse resale listings |
| Admin | `/admin` | Event creation + analytics |

## Features (detailed)

### Seat Map
- Renders SVG/Canvas seat map for the selected event
- Real-time seat availability (polling or WebSocket from inventory-service)
- Click to select/deselect seats
- Shows price, availability status (available/reserved/sold)

### Credit System + Stripe
- Shows user credit balance
- Checkout: deduct credits first; Stripe for top-up
- Stripe Elements embedded in top-up flow

### Ticket Management
- Lists all purchased tickets with QR code images
- P2P transfer: enter recipient email → backend handles ownership transfer
- Resale listing: set price → create marketplace listing

### Admin Dashboard
- Create events: name, date, venue, seat map upload
- View event sales analytics
- User management table

### E2E Testing (Playwright)
- `playwright.config.ts` configures browser targets
- Test scenarios: full purchase flow, transfer flow, admin creation

## API Integration
Connects to ticketremaster-b services via Kong API gateway (single base URL).

## Deployment / Run
```bash
npm install
npm run dev         # local dev
npm run build       # production build
npx playwright test # E2E tests
```

## Constraints & Notes
- **CORS**: API requests go through Kong gateway — configure `VITE_API_BASE_URL` to point to Kong
- **Stripe**: Stripe publishable key via `VITE_STRIPE_PUBLIC_KEY` env var
- **Real-time**: seat availability updates depend on backend polling vs WebSocket configuration
- **Docker**: Dockerfile available for containerized deployment
