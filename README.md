# TicketRemaster Frontend

A modern, resilient event ticketing platform built with Vue 3, featuring a premium glassmorphic UI and peer-to-peer ticket resale marketplace.

**Production URL**: [https://ticketremaster.hong-yi.me](https://ticketremaster.hong-yi.me)

---

## Features

- **Event Discovery**: Browse events with search, date filters, and grid/list views
- **Interactive Seat Selection**: Real-time seat map with availability status
- **Credit-Based Payments**: Stripe-integrated top-up system with idempotency protection
- **P2P Resale Marketplace**: Secure ticket transfers with dual OTP verification
- **QR Code Entry**: Dynamic QR codes with 60-second expiry for secure venue entry
- **Staff Scanner**: Camera-based QR verification with color-coded feedback
- **Admin Dashboard**: Event creation and user management tools
- **Offline Mode**: Graceful degradation with mock data when backend is unavailable
- **Role-Based Access**: Three roles (user, admin, staff) with appropriate permissions

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | ^20.19.0 or >=22.12.0 |
| npm | 9.x or higher |
| Browser | Chrome 90+, Firefox 88+, Safari 14+ |

---

## Environment Configuration

Create a `.env` file in the project root with the following variables:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `VITE_API_BASE_URL` | string | Backend API base URL | `https://ticketremasterapi.hong-yi.me/api` |
| `VITE_KONG_API_KEY` | string | Kong gateway API key | `tk_front_123456789` |
| `VITE_STRIPE_PUBLIC_KEY` | string | Stripe publishable key | `pk_test_...` |
| `VITE_PROXY_AUTH_URL` | string | Dev proxy for auth service | `http://localhost:6010` |
| `VITE_PROXY_EVENTS_URL` | string | Dev proxy for events service | `http://localhost:6001` |

**Note**: Never commit `.env` files to version control.

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/bryanseah234/ticketremaster-f.git
cd ticketremaster-f
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy the example env file (if available)
cp .env.example .env

# Or create manually
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
echo "VITE_KONG_API_KEY=tk_front_123456789" >> .env
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### 5. (Optional) Set Up Backend

For full functionality, start the backend services:

```bash
# Using Docker Compose
cd docker
docker-compose up -d

# Or run backend services individually
# See backend repository for details
```

---

## Usage & Workflows

### User Registration & Login

1. Navigate to `/register` to create an account
2. Provide email, phone number, and password
3. After registration, log in at `/login`
4. The system redirects based on role:
   - **User**: `/events`
   - **Admin**: `/admin/events/new`
   - **Staff**: `/staff/scan`

### Purchasing a Ticket

1. Browse events at `/events`
2. Click an event to view details
3. Select "View Seats" to see the seat map
4. Click an available (green) seat
5. Click "Reserve Seat" to hold it for 5 minutes
6. Proceed to checkout and confirm purchase
7. View your ticket at `/tickets`

### Listing a Ticket for Resale

1. Go to `/tickets` and find an active ticket
2. Click "List on Marketplace"
3. Set your asking price
4. Confirm the listing
5. The ticket status changes to "Listed"

### Buying from the Marketplace

1. Browse listings at `/marketplace`
2. Click "Buy Now" on a listing
3. Complete buyer OTP verification
4. Wait for seller to accept and verify
5. Ticket transfers to your account upon completion

### Staff Check-In

1. Staff members access `/staff/scan`
2. Point camera at attendee's QR code
3. System displays result:
   - **PASS** (green): Check-in successful
   - **FAILED** (red): Invalid or expired QR
   - **WRONG VENUE** (yellow): Redirect to correct venue

---

## Testing

### Run Unit Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### Run E2E Tests (Playwright)

```bash
# Install Playwright browsers
npx playwright install

# Run tests in headed mode
npm run test:e2e

# Run tests in headless mode (CI)
npm run test:e2e:ci

# Generate HTML report
npx playwright show-report
```

### Test Files

| File | Coverage |
|------|----------|
| `tests/auth.spec.ts` | Registration, login, session management |
| `tests/events.spec.ts` | Event listing, filtering, details |
| `tests/purchase.spec.ts` | Seat hold, purchase, error handling |
| `tests/marketplace.spec.ts` | Listing, browsing, buying |
| `tests/admin.spec.ts` | Admin event creation, user management |

---

## Build & Deployment

### Production Build

```bash
npm run build
```

Output files are generated in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Vercel Deployment

The project is configured for automatic deployment to Vercel:

1. Push changes to the `main` branch
2. Vercel automatically builds and deploys
3. Preview deployments for pull requests

**Vercel Configuration** (`vercel.json`):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Environment-Specific Builds

```bash
# Development
npm run dev

# Staging
VITE_API_BASE_URL=https://staging-api.example.com npm run build

# Production
npm run build
```

---

## Project Structure

```
ticketremaster-f/
├── src/
│   ├── api/
│   │   └── client.ts          # Axios client with interceptors
│   ├── components/
│   │   ├── common/            # Shared components (Navbar, Toast)
│   │   ├── EventDatePicker/   # Seat selection components
│   │   ├── layout/            # Layout components (Footer)
│   │   ├── sections/          # Landing page sections
│   │   └── ui/                # UI primitives (Card, SearchBar)
│   ├── composables/           # Vue composables (toast, notifications)
│   ├── config/
│   │   └── theme.ts           # Theme tokens and CSS variables
│   ├── data/
│   │   └── mockEvents.ts      # Fallback event data
│   ├── router/
│   │   └── index.ts           # Vue Router configuration
│   ├── stores/
│   │   └── auth.ts            # Pinia auth store
│   ├── views/
│   │   ├── app/               # Main application views
│   │   └── LandingPage.vue    # Hero landing page
│   ├── App.vue                # Root component
│   └── main.ts                # Application entry point
├── tests/                     # Playwright E2E tests
├── public/                    # Static assets
├── docker/                    # Docker configuration
├── docs/                      # Documentation
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite configuration
├── playwright.config.ts       # Playwright test configuration
└── tsconfig.json              # TypeScript configuration
```

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Create new account |
| POST | `/auth/login` | No | Authenticate and get token |
| GET | `/auth/me` | Yes | Get current user profile |

### Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/events` | No | List events with pagination |
| GET | `/events/{eventId}` | No | Get event details |
| GET | `/events/{eventId}/seats` | No | Get seat map for event |
| POST | `/admin/events` | Admin | Create new event |

### Purchase

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/purchase/hold/{inventoryId}` | Yes | Hold a seat (5 min TTL) |
| POST | `/purchase/confirm/{inventoryId}` | Yes | Complete purchase |

### Credits

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/credits/balance` | Yes | Get credit balance |
| POST | `/credits/topup/initiate` | Yes | Start Stripe payment |
| POST | `/credits/topup/confirm` | Yes | Confirm payment completion |
| GET | `/credits/transactions` | Yes | Get transaction history |

### Marketplace

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/marketplace` | No | Browse resale listings |
| POST | `/marketplace/list` | Yes | List ticket for resale |
| DELETE | `/marketplace/{listingId}` | Yes | Remove listing |

### Transfer

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/transfer/initiate` | Yes | Start P2P transfer |
| POST | `/transfer/{transferId}/buyer-verify` | Yes | Buyer OTP verification |
| POST | `/transfer/{transferId}/seller-accept` | Yes | Seller accepts transfer |
| POST | `/transfer/{transferId}/seller-verify` | Yes | Seller OTP verification |
| GET | `/transfer/{transferId}` | Yes | Get transfer status |
| POST | `/transfer/{transferId}/cancel` | Yes | Cancel transfer |

### Tickets

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/tickets` | Yes | List user's tickets |
| GET | `/tickets/{ticketId}/qr` | Yes | Get QR code for ticket |

### Verification (Staff Only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/verify/scan` | Staff | Verify QR code |
| POST | `/verify/manual` | Staff | Manual ticket verification |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Vue 3 (Composition API) |
| Build Tool | Vite 7 |
| Routing | Vue Router 4 |
| State Management | Pinia 3 |
| HTTP Client | Axios |
| Styling | Vanilla CSS + CSS Variables |
| UI Icons | Lucide Vue, Heroicons |
| QR Codes | @chenfengyuan/vue-qrcode |
| Barcode Scanner | vue-barcode-reader |
| Payments | @stripe/stripe-js |
| 3D Graphics | Three.js |
| Animations | @vueuse/motion |
| Testing | Playwright |
| Deployment | Vercel |

---

## Troubleshooting

### Common Issues

**1. "Backend unavailable" message**
- The application is in offline mode
- Check that backend services are running
- Verify `VITE_API_BASE_URL` is correct

**2. Login fails with 401**
- Check credentials
- Ensure backend auth service is running
- Verify `VITE_KONG_API_KEY` is set (if using Kong)

**3. Stripe payment fails**
- Verify `VITE_STRIPE_PUBLIC_KEY` is set
- Check Stripe account is in test mode (for development)
- Ensure card details are valid

**4. QR scanner not working**
- Grant camera permissions in browser
- Use HTTPS (required for camera access in production)
- Try manual entry as fallback

### Getting Help

- Check the [docs/FRONTEND.md](docs/FRONTEND.md) for API contract details
- Review [docs/API.md](docs/API.md) for endpoint specifications
- Open an issue on GitHub for bugs or feature requests

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use Prettier for formatting
- Follow Vue 3 Composition API patterns
- Write TypeScript for type safety
- Add tests for new features

---

## License

This project is proprietary software. All rights reserved.
