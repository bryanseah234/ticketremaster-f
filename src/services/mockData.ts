/**
 * Mock Data Service for Offline UI Development
 * Provides realistic mock data when backend is unavailable.
 * Aligned with real seeded backend data (venues, events, users).
 */
import type {
  User,
  Event,
  EventSummary,
  Ticket,
  SeatWithInventory,
  Venue,
  MarketplaceListing,
  Transfer,
  AuthUser,
} from '@/types'
import { resolveEventImage } from '@/utils/eventMedia'

// ── Mock Users ─────────────────────────────────────────────────────

export const mockUser: User = {
  userId: 'demo-user-001',
  email: 'user@ticketremaster.local',
  phoneNumber: '+6500000003',
  role: 'user',
  isFlagged: false,
  createdAt: '2026-01-01T00:00:00Z',
  favoriteEvents: ['evt_001', 'evt_005'],
}

export const mockAdminUser: User = {
  userId: 'demo-admin-001',
  email: 'admin@ticketremaster.local',
  phoneNumber: '+6500000001',
  role: 'admin',
  isFlagged: false,
  createdAt: '2026-01-01T00:00:00Z',
  venueId: 'ven_001',
}

export const mockStaffUser: User = {
  userId: 'demo-staff-001',
  email: 'staff@ticketremaster.local',
  phoneNumber: '+6500000002',
  role: 'staff',
  isFlagged: false,
  createdAt: '2026-01-01T00:00:00Z',
  venueId: 'ven_001',
}

// ── Mock Venues ────────────────────────────────────────────────────

export const mockVenues: Venue[] = [
  {
    venueId: 'ven_001',
    name: 'Esplanade Concert Hall',
    address: '1 Esplanade Drive, Singapore',
    capacity: 1600,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    venueId: 'ven_002',
    name: 'Singapore Indoor Stadium',
    address: '2 Stadium Walk, Singapore',
    capacity: 12000,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    venueId: 'ven_003',
    name: 'Capitol Theatre',
    address: '17 Stamford Road, Singapore',
    capacity: 800,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    venueId: 'ven_004',
    name: 'Sands Theatre',
    address: '10 Bayfront Avenue, B1-69/70 The Shoppes at Marina Bay Sands, Singapore',
    capacity: 1680,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    venueId: 'ven_005',
    name: 'National Stadium',
    address: '1 Stadium Drive, Singapore',
    capacity: 55000,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    venueId: 'ven_006',
    name: 'Gardens by the Bay',
    address: '18 Marina Gardens Drive, Singapore',
    capacity: 10000,
    createdAt: '2026-01-01T00:00:00Z',
  },
]

// ── Venue lookup helper ────────────────────────────────────────────

const venueById = Object.fromEntries(mockVenues.map(v => [v.venueId, v]))

// ── Mock Events ────────────────────────────────────────────────────

export const mockEvents: EventSummary[] = [
  {
    eventId: 'evt_001',
    name: 'Taylor Swift | The Eras Tour',
    date: '2026-06-15T19:30:00',
    venueId: 'ven_001',
    price: 248.00,
    type: 'concert',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/eras-tour/800/450', eventId: 'evt_001', type: 'concert', context: 'event' }),
    venue: venueById['ven_001'],
    seatsAvailable: 1200,
  },
  {
    eventId: 'evt_002',
    name: "SSO Gala: Beethoven's 9th",
    date: '2026-07-20T20:00:00',
    venueId: 'ven_001',
    price: 85.00,
    type: 'other',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/sso-beethoven/800/450', eventId: 'evt_002', type: 'other', context: 'event' }),
    venue: venueById['ven_001'],
    seatsAvailable: 800,
  },
  {
    eventId: 'evt_003',
    name: 'DAY6 10th Anniversary Tour <The DECADE>',
    date: '2026-08-18T18:00:00',
    venueId: 'ven_001',
    price: 158.00,
    type: 'concert',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/day6-decade/800/450', eventId: 'evt_003', type: 'concert', context: 'event' }),
    venue: venueById['ven_001'],
    seatsAvailable: 900,
  },
  {
    eventId: 'evt_004',
    name: 'Harry Styles: Together, Together',
    date: '2026-08-26T20:00:00',
    venueId: 'ven_002',
    price: 150.00,
    type: 'concert',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/harry-styles/800/450', eventId: 'evt_004', type: 'concert', context: 'event' }),
    venue: venueById['ven_002'],
    seatsAvailable: 8000,
  },
  {
    eventId: 'evt_005',
    name: 'Coldplay: Music of the Spheres',
    date: '2026-09-05T20:00:00',
    venueId: 'ven_002',
    price: 188.00,
    type: 'concert',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/coldplay-spheres/800/450', eventId: 'evt_005', type: 'concert', context: 'event' }),
    venue: venueById['ven_002'],
    seatsAvailable: 7500,
  },
  {
    eventId: 'evt_006',
    name: 'Singapore Jazz Festival 2026',
    date: '2026-05-10T18:00:00',
    venueId: 'ven_002',
    price: 75.00,
    type: 'festival',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/sg-jazz-2026/800/450', eventId: 'evt_006', type: 'festival', context: 'event' }),
    venue: venueById['ven_002'],
    seatsAvailable: 5000,
  },
  {
    eventId: 'evt_007',
    name: 'A.R. Rahman Live in Concert',
    date: '2026-10-25T19:00:00',
    venueId: 'ven_003',
    price: 95.00,
    type: 'concert',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/ar-rahman/800/450', eventId: 'evt_007', type: 'concert', context: 'event' }),
    venue: venueById['ven_003'],
    seatsAvailable: 600,
  },
  {
    eventId: 'evt_008',
    name: 'Hans Zimmer Live',
    date: '2026-11-21T20:00:00',
    venueId: 'ven_003',
    price: 88.00,
    type: 'other',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/hans-zimmer/800/450', eventId: 'evt_008', type: 'other', context: 'event' }),
    venue: venueById['ven_003'],
    seatsAvailable: 500,
  },
  {
    eventId: 'evt_009',
    name: "Guns N' Roses - World Tour 2026",
    date: '2026-07-01T20:00:00',
    venueId: 'ven_004',
    price: 125.00,
    type: 'concert',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/gnr-2026/800/450', eventId: 'evt_009', type: 'concert', context: 'event' }),
    venue: venueById['ven_004'],
    seatsAvailable: 1200,
  },
  {
    eventId: 'evt_010',
    name: 'Mountbatten Festival of Music 2026',
    date: '2026-09-30T19:30:00',
    venueId: 'ven_004',
    price: 65.00,
    type: 'other',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/mountbatten-2026/800/450', eventId: 'evt_010', type: 'other', context: 'event' }),
    venue: venueById['ven_004'],
    seatsAvailable: 1000,
  },
  {
    eventId: 'evt_011',
    name: 'HSBC SVNS Singapore 2026',
    date: '2026-10-31T10:00:00',
    venueId: 'ven_005',
    price: 59.00,
    type: 'sports',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/hsbc-svns-2026/800/450', eventId: 'evt_011', type: 'sports', context: 'event' }),
    venue: venueById['ven_005'],
    seatsAvailable: 40000,
  },
  {
    eventId: 'evt_012',
    name: 'Singapore Grand Prix 2026',
    date: '2026-09-20T20:00:00',
    venueId: 'ven_005',
    price: 198.00,
    type: 'sports',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/f1-sg-2026/800/450', eventId: 'evt_012', type: 'sports', context: 'event' }),
    venue: venueById['ven_005'],
    seatsAvailable: 35000,
  },
  {
    eventId: 'evt_013',
    name: 'Legally Blonde \u2013 The Musical',
    date: '2026-07-29T19:30:00',
    venueId: 'ven_001',
    price: 98.00,
    type: 'theatre',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/legally-blonde-sg/800/450', eventId: 'evt_013', type: 'theatre', context: 'event' }),
    venue: venueById['ven_001'],
    seatsAvailable: 1000,
  },
  {
    eventId: 'evt_014',
    name: 'CATS \u2013 The Musical',
    date: '2026-11-06T19:30:00',
    venueId: 'ven_003',
    price: 115.00,
    type: 'theatre',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/cats-musical-sg/800/450', eventId: 'evt_014', type: 'theatre', context: 'event' }),
    venue: venueById['ven_003'],
    seatsAvailable: 600,
  },
  {
    eventId: 'evt_015',
    name: 'Singapore Garden Festival 2026',
    date: '2026-07-04T09:00:00',
    venueId: 'ven_006',
    price: 35.00,
    type: 'festival',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/sg-garden-fest-2026/800/450', eventId: 'evt_015', type: 'festival', context: 'event' }),
    venue: venueById['ven_006'],
    seatsAvailable: 8000,
  },
  {
    eventId: 'evt_016',
    name: 'i Light Singapore 2026',
    date: '2026-06-06T19:00:00',
    venueId: 'ven_006',
    price: 25.00,
    type: 'festival',
    image: resolveEventImage({ image: 'https://picsum.photos/seed/ilight-sg-2026/800/450', eventId: 'evt_016', type: 'festival', context: 'event' }),
    venue: venueById['ven_006'],
    seatsAvailable: 7000,
  },
]

// ── Mock Seats (SeatWithInventory shape, rows A-D x 10 cols) ───────

export const mockSeats: SeatWithInventory[] = (() => {
  const rows = ['A', 'B', 'C', 'D']
  const cols = 10
  const statuses: Array<'available' | 'held' | 'sold'> = ['available', 'available', 'available', 'available', 'available', 'held', 'sold', 'available', 'available', 'available']
  const seats: SeatWithInventory[] = []
  let i = 1
  for (const row of rows) {
    for (let col = 1; col <= cols; col++) {
      seats.push({
        seatId: `demo-seat-${String(i).padStart(3, '0')}`,
        rowNumber: row,
        seatNumber: String(col),
        venueId: 'ven_001',
        inventoryId: `demo-inv-${String(i).padStart(3, '0')}`,
        status: statuses[(col - 1) % statuses.length],
        price: 248.00,
      })
      i++
    }
  }
  return seats
})()

// ── Mock Tickets ───────────────────────────────────────────────────

export const mockTickets: Ticket[] = [
  {
    ticketId: 'demo-ticket-001',
    eventId: 'evt_001',
    seatId: 'demo-seat-001',
    ownerId: 'demo-user-001',
    status: 'active',
    price: 248.00,
    purchasedAt: '2026-03-01T10:30:00Z',
    event: { ...mockEvents[0], image: resolveEventImage({ image: 'https://picsum.photos/seed/eras-tour/800/450', eventId: 'evt_001', type: 'concert', context: 'ticket' }) },
    seat: mockSeats[0],
    venue: venueById['ven_001'],
  },
  {
    ticketId: 'demo-ticket-002',
    eventId: 'evt_011',
    seatId: 'demo-seat-011',
    ownerId: 'demo-user-001',
    status: 'used',
    price: 59.00,
    purchasedAt: '2026-02-10T14:45:00Z',
    event: { ...mockEvents[10], image: resolveEventImage({ image: 'https://picsum.photos/seed/hsbc-svns-2026/800/450', eventId: 'evt_011', type: 'sports', context: 'ticket' }) },
    seat: mockSeats[10],
    venue: venueById['ven_005'],
  },
  {
    ticketId: 'demo-ticket-003',
    eventId: 'evt_013',
    seatId: 'demo-seat-021',
    ownerId: 'demo-user-001',
    status: 'cancelled',
    price: 98.00,
    purchasedAt: '2026-03-05T09:00:00Z',
    event: { ...mockEvents[12], image: resolveEventImage({ image: 'https://picsum.photos/seed/legally-blonde-sg/800/450', eventId: 'evt_013', type: 'theatre', context: 'ticket' }) },
    seat: mockSeats[20],
    venue: venueById['ven_001'],
  },
  {
    ticketId: 'demo-ticket-004',
    eventId: 'evt_005',
    seatId: 'demo-seat-031',
    ownerId: 'demo-user-001',
    status: 'listed',
    price: 188.00,
    purchasedAt: '2026-02-20T11:00:00Z',
    event: { ...mockEvents[4], image: resolveEventImage({ image: 'https://picsum.photos/seed/coldplay-spheres/800/450', eventId: 'evt_005', type: 'concert', context: 'ticket' }) },
    seat: mockSeats[30],
    venue: venueById['ven_002'],
  },
]

// ── Mock Listings ──────────────────────────────────────────────────

export const mockListings: MarketplaceListing[] = [
  {
    listingId: 'demo-listing-001',
    ticketId: 'demo-ticket-004',
    sellerId: 'demo-user-001',
    sellerName: 'user',
    eventId: 'evt_005',
    price: 220.00,
    status: 'active',
    createdAt: '2026-03-01T09:00:00Z',
    event: { ...mockEvents[4], image: resolveEventImage({ image: 'https://picsum.photos/seed/coldplay-spheres/800/450', eventId: 'evt_005', type: 'concert', context: 'marketplace' }) },
  },
  {
    listingId: 'demo-listing-002',
    ticketId: 'demo-ticket-005',
    sellerId: 'demo-seller-002',
    sellerName: 'seller2',
    eventId: 'evt_001',
    price: 280.00,
    status: 'active',
    createdAt: '2026-03-05T11:30:00Z',
    event: { ...mockEvents[0], image: resolveEventImage({ image: 'https://picsum.photos/seed/eras-tour/800/450', eventId: 'evt_001', type: 'concert', context: 'marketplace' }) },
  },
  {
    listingId: 'demo-listing-003',
    ticketId: 'demo-ticket-006',
    sellerId: 'demo-seller-003',
    sellerName: 'seller3',
    eventId: 'evt_013',
    price: 120.00,
    status: 'active',
    createdAt: '2026-03-08T10:00:00Z',
    event: { ...mockEvents[12], image: resolveEventImage({ image: 'https://picsum.photos/seed/legally-blonde-sg/800/450', eventId: 'evt_013', type: 'theatre', context: 'marketplace' }) },
  },
  {
    listingId: 'demo-listing-004',
    ticketId: 'demo-ticket-007',
    sellerId: 'demo-seller-004',
    sellerName: 'seller4',
    eventId: 'evt_015',
    price: 45.00,
    status: 'active',
    createdAt: '2026-02-01T08:00:00Z',
    event: { ...mockEvents[14], image: resolveEventImage({ image: 'https://picsum.photos/seed/sg-garden-fest-2026/800/450', eventId: 'evt_015', type: 'festival', context: 'marketplace' }) },
  },
]

// ── Mock Transfers ─────────────────────────────────────────────────

export const mockTransfers: Transfer[] = [
  {
    transferId: 'demo-transfer-001',
    ticketId: 'demo-ticket-001',
    fromUserId: 'demo-user-001',
    toUserEmail: 'friend@example.com',
    status: 'pending',
    createdAt: '2026-03-10T16:00:00Z',
    expiresAt: '2026-03-17T16:00:00Z',
  },
]

// ── Mock Service Functions ─────────────────────────────────────────

export interface MockServiceConfig {
  delay?: number
  offlineMode?: boolean
}

const defaultConfig: MockServiceConfig = {
  delay: 500,
  offlineMode: true,
}

const DEMO_MODE_KEY = 'ticketremaster_demo_mode'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const mockServices = {
  async login(email: string, _password: string): Promise<{ user: AuthUser; token: string }> {
    await delay(defaultConfig.delay!)
    if (email === 'user@ticketremaster.local' || email === 'demo@ticketremaster.com') {
      return {
        user: { userId: mockUser.userId, email: mockUser.email, phoneNumber: mockUser.phoneNumber, role: mockUser.role as AuthUser['role'], isFlagged: mockUser.isFlagged, isAdmin: false },
        token: 'demo-jwt-token',
      }
    }
    if (email === 'admin@ticketremaster.local' || email === 'admin@ticketremaster.com') {
      return {
        user: { userId: mockAdminUser.userId, email: mockAdminUser.email, phoneNumber: mockAdminUser.phoneNumber, role: mockAdminUser.role as AuthUser['role'], isFlagged: mockAdminUser.isFlagged, isAdmin: true },
        token: 'demo-jwt-token',
      }
    }
    if (email === 'staff@ticketremaster.local' || email === 'staff@ticketremaster.com') {
      return {
        user: { userId: mockStaffUser.userId, email: mockStaffUser.email, phoneNumber: mockStaffUser.phoneNumber, role: mockStaffUser.role as AuthUser['role'], isFlagged: mockStaffUser.isFlagged, isAdmin: false },
        token: 'demo-jwt-token',
      }
    }
    throw new Error('Invalid credentials')
  },

  async register(data: { email: string; password: string; phoneNumber: string }): Promise<{ user: AuthUser; token: string }> {
    await delay(defaultConfig.delay!)
    return {
      user: { userId: 'demo-user-new', email: data.email, role: 'user', isFlagged: false, isAdmin: false },
      token: 'demo-jwt-token',
    }
  },

  async getEvents(params?: { page?: number; limit?: number; type?: string }): Promise<{ events: EventSummary[]; pagination: { page: number; limit: number; total: number } }> {
    await delay(defaultConfig.delay!)
    let filtered = mockEvents
    if (params?.type && params.type !== 'all') {
      filtered = mockEvents.filter(e => e.type === params.type)
    }
    const page = params?.page || 1
    const limit = params?.limit || 10
    const start = (page - 1) * limit
    return { events: filtered.slice(start, start + limit), pagination: { page, limit, total: filtered.length } }
  },

  async getEvent(eventId: string): Promise<Event> {
    await delay(defaultConfig.delay!)
    const event = mockEvents.find(e => e.eventId === eventId)
    if (!event) throw new Error('Event not found')
    return {
      ...event,
      description: 'This is a demo event. In a live environment this would show the full event description from the backend.',
      createdAt: '2026-01-01T00:00:00Z',
      cancelledAt: undefined,
      updatedAt: undefined,
      venue: event.venue ? { ...event.venue, createdAt: '2026-01-01T00:00:00Z' } : undefined,
    } as Event
  },

  async getUpcomingEvents(params?: { page?: number; limit?: number }): Promise<{ events: EventSummary[]; pagination: { page: number; limit: number; total: number } }> {
    await delay(defaultConfig.delay!)
    const now = new Date()
    const upcoming = mockEvents.filter(e => new Date(e.date) > now)
    const page = params?.page || 1
    const limit = params?.limit || 10
    const start = (page - 1) * limit
    return { events: upcoming.slice(start, start + limit), pagination: { page, limit, total: upcoming.length } }
  },

  async searchEvents(query: string, params?: { page?: number; limit?: number }): Promise<{ events: EventSummary[]; pagination: { page: number; limit: number; total: number } }> {
    await delay(defaultConfig.delay!)
    const q = query.toLowerCase()
    const filtered = mockEvents.filter(e => e.name.toLowerCase().includes(q) || e.venue?.name.toLowerCase().includes(q))
    const page = params?.page || 1
    const limit = params?.limit || 10
    const start = (page - 1) * limit
    return { events: filtered.slice(start, start + limit), pagination: { page, limit, total: filtered.length } }
  },

  async getVenues(): Promise<{ venues: Venue[] }> {
    await delay(defaultConfig.delay!)
    return { venues: mockVenues }
  },

  async getSeats(_eventId: string): Promise<{ seats: SeatWithInventory[] }> {
    await delay(defaultConfig.delay!)
    return { seats: mockSeats }
  },

  async getMyTickets(): Promise<{ tickets: Ticket[] }> {
    await delay(defaultConfig.delay!)
    return { tickets: mockTickets }
  },

  async getMarketplaceListings(params?: { page?: number; limit?: number }): Promise<{ listings: MarketplaceListing[]; pagination: { page: number; limit: number; total: number } }> {
    await delay(defaultConfig.delay!)
    const page = params?.page || 1
    const limit = params?.limit || 10
    return { listings: mockListings.slice(0, limit), pagination: { page, limit, total: mockListings.length } }
  },

  async getUserProfile(_userId: string): Promise<User> {
    await delay(defaultConfig.delay!)
    return mockUser
  },

  async getTransfers(): Promise<{ transfers: Transfer[] }> {
    await delay(defaultConfig.delay!)
    return { transfers: mockTransfers }
  },
}

// ── Demo Mode Detection ────────────────────────────────────────────

export function isDemoMode(): boolean {
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('demo') === 'true') return true
  if (sessionStorage.getItem(DEMO_MODE_KEY) === 'true') return true
  return !!(window as unknown as Record<string, unknown>).__demoMode
}

export function setDemoMode(enabled: boolean): void {
  ;(window as unknown as Record<string, unknown>).__demoMode = enabled
  if (enabled) sessionStorage.setItem(DEMO_MODE_KEY, 'true')
  else sessionStorage.removeItem(DEMO_MODE_KEY)
}

export function getDemoBannerMessage(): string {
  return 'Demo Mode: Showing mock data. Backend features like login, purchases, and real-time updates are disabled.'
}


