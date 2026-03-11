# TicketRemaster Frontend

Vue 3 SPA for event ticketing. This application is designed to be highly resilient, featuring a premium glassmorphic UI and an automatic "Offline Mode" when the backend is unreachable.

## Deployment

- **Production URL**: [https://ticketremaster.hong-yi.me](https://ticketremaster.hong-yi.me)
- **Production API**: `https://ticketremasterapi.hong-yi.me/api`
- **Local Development API**: `http://localhost:8000/api`

## Features

- **Resilient UI**: Automatically detects backend connection issues and switches to "Offline Mode" with a bottom banner and mock data.
- **Dynamic Hero**: Parallax landing page with a dynamic number of floating photos based on screen size.
- **Interactive Globe**: 3D globe visualization of event locations using Three.js.
- **Event Discovery**: Search, date filters, and local "Favourites" (stored in `localStorage`).
- **Checkout & Marketplace**: Secure checkout with OTP support and a dedicated P2P resale marketplace.
- **Admin Dashboard**: Real-time inventory and sales tracking for event organizers.

## Routes

- `/` Landing with Hero & Globe
- `/events` Event listing & search
...
- `/marketplace` P2P Resale Marketplace
...

## Tech Stack

- **Framework**: Vue 3 (Composition API) + Vite 7
- **State & Routing**: Pinia 2, Vue Router 4
- **Styling**: Vanilla CSS with a centralized `theme.ts` token system (Glassmorphism).
- **Visualization**: Three.js (Interactive Globe).
...

## Environment
...
VITE_API_BASE_URL=https://ticketremasterapi.hong-yi.me/api
...

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
