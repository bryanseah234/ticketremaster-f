# TicketRemaster Frontend

> Vue 3 SPA for event ticketing, talking to backend via Kong API Gateway (`localhost:8000`).

## Overview

TicketRemaster is a modern event ticketing frontend built with Vue 3, Vite, Pinia, Vue Router, and Tailwind CSS. It communicates exclusively with the backend through Kong API Gateway. Staff QR scanning is handled by a separate OutSystems app.

## Features
- Event browsing, detail, and seat selection
- Secure login, registration, and JWT-based authentication
- Interactive seat reservation and checkout with OTP flow
- Ticket management, QR code display, and transfer
- Credit top-up via Stripe
- Responsive, modern UI with Tailwind CSS

## Tech Stack
- **Vue 3** (Composition API, `<script setup>`)
- **Vite** (build tool)
- **Vue Router 4** (SPA routing)
- **Pinia** (state management)
- **Axios** (HTTP client with JWT/refresh interceptors)
- **Tailwind CSS v3** (utility-first styling)
- **@chenfengyuan/vue-qrcode** (QR code rendering)
- **@stripe/stripe-js** (Stripe Elements)
- **vue-toastification** (toast notifications)
- **@heroicons/vue** (icon set)
- **@vueuse/core** (utility composables)
- **dayjs** (date formatting)

## Folder Structure
```
src/
├── api/                # Axios instance
├── assets/             # CSS, images
├── components/         # Reusable UI components
│   └── icons/          # Icon components
├── views/              # Page components (one per route)
├── stores/             # Pinia stores (auth, tickets, credits)
├── router/             # Vue Router setup
├── App.vue
└── main.js
```

## Setup & Development

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm run dev
```

### 3. Build for production
```bash
npm run build
```

### 4. Preview production build
```bash
npm run preview
```

## API Integration
- All API calls go through Kong at `http://localhost:8000/api`
- Authenticated endpoints require `Authorization: Bearer <access_token>`
- JWT/refresh handled via Axios interceptors (see `src/api/client.js`)

## Auth Flow
- Login returns `access_token` (15min) and `refresh_token` (7 days)
- `access_token` stored in Pinia (memory), `refresh_token` in localStorage
- On 401, Axios auto-refreshes token; on refresh failure, logs out

## Recommended IDE & Tools
- [VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)

## Notes
- All business logic and API details are in `INSTRUCTIONS.md`
- OutSystems QR scanner is a separate app (see `outsystems/README.md`)
- Color palette/theme can be customized in `tailwind.config.js`

---

For detailed API endpoints, flows, and error handling, see `INSTRUCTIONS.md` in the project root.
