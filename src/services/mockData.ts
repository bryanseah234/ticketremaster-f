/**
 * Mock Data Service for Offline UI Development
 * Provides realistic mock data when backend is unavailable.
 * Used for UI development and demo purposes only.
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

// ── Mock Users ─────────────────────────────────────────────────────

export const mockUser: User = {
  userId: 'demo-user-001',
  email: 'demo@ticketremaster.com',
  phoneNumber: '+1234567890',
  role: 'user',
  isFlagged: false,
  createdAt: '2024-01-01T00:00:00Z',
  favoriteEvents: ['demo-event-001', 'demo-event-002'],
}

export const mockAdminUser: User = {
  userId: 'demo-admin-001',
  email: 'admin@ticketremaster.com',
  phoneNumber: '+1234567891',
  role: 'admin',
  isFlagged: false,
  createdAt: '2024-01-01T00:00:00Z',
  venueId: 'demo-venue-001',
}

export const mockStaffUser: User = {
  userId: 'demo-staff-001',
  email: 'staff@ticketremaster.com',
  phoneNumber: '+1234567892',
  role: 'staff',
  isFlagged: false,
  createdAt: '2024-01-01T00:00:00Z',
  venueId: 'demo-venue-001',
}

// ── Mock Venues ────────────────────────────────────────────────────

export const mockVenues: Venue[] = [
  {
    venueId: 'demo-venue-001',
    name: 'Madison Square Garden',
    address: '4 Pennsylvania Plaza',
    city: 'New York',
    country: 'USA',
    capacity: 20789,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    venueId: 'demo-venue-002',
    name: 'Wembley Stadium',
    address: 'Wembley',
    city: 'London',
    country: 'UK',
    capacity: 90000,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    venueId: 'demo-venue-003',
    name: 'Tokyo Dome',
    address: '1-3-61 Koraku, Bunkyo City',
    city: 'Tokyo',
    country: 'Japan',
    capacity: 55000,
    createdAt: '2024-01-01T00:00:00Z',
  },
]

// ── Mock Events (≥6, varied types) ────────────────────────────────

export const mockEvents: EventSummary[] = [
  {
    eventId: 'demo-event-001',
    name: 'Taylor Swift - Eras Tour',
    date: '2025-06-15T19:30:00Z',
    venueId: 'demo-venue-001',
    price: 149.99,
    type: 'concert',
    image: '/hero-concert.jpeg',
    venue: {
      venueId: 'demo-venue-001',
      name: 'Madison Square Garden',
      address: '4 Pennsylvania Plaza, New York',
    },
    seatsAvailable: 1250,
  },
  {
    eventId: 'demo-event-002',
    name: 'NBA Finals - Game 1',
    date: '2025-06-20T20:00:00Z',
    venueId: 'demo-venue-001',
    price: 299.99,
    type: 'sports',
    image: '/resell.jpg',
    venue: {
      venueId: 'demo-venue-001',
      name: 'Madison Square Garden',
      address: '4 Pennsylvania Plaza, New York',
    },
    seatsAvailable: 500,
  },
  {
    eventId: 'demo-event-003',
    name: 'Hamilton - West End',
    date: '2025-07-01T14:00:00Z',
    venueId: 'demo-venue-002',
    price: 89.99,
    type: 'theater',
    venue: {
      venueId: 'demo-venue-002',
      name: 'Wembley Stadium',
      address: 'Wembley, London',
    },
    seatsAvailable: 2000,
  },
  {
    eventId: 'demo-event-004',
    name: 'TechCrunch Disrupt',
    date: '2025-09-15T09:00:00Z',
    venueId: 'demo-venue-003',
    price: 499.99,
    type: 'conference',
    venue: {
      venueId: 'demo-venue-003',
      name: 'Tokyo Dome',
      address: '1-3-61 Koraku, Bunkyo City, Tokyo',
    },
    seatsAvailable: 5000,
  },
  {
    eventId: 'demo-event-005',
    name: 'Summer Music Festival',
    date: '2025-08-01T12:00:00Z',
    venueId: 'demo-venue-002',
    price: 79.99,
    type: 'festival',
    venue: {
      venueId: 'demo-venue-002',
      name: 'Wembley Stadium',
      address: 'Wembley, London',
    },
    seatsAvailable: 10000,
  },
  {
    eventId: 'demo-event-006',
    name: 'Tokyo Jazz Night',
    date: '2025-10-10T20:00:00Z',
    venueId: 'demo-venue-003',
    price: 59.99,
    type: 'other',
    venue: {
      venueId: 'demo-venue-003',
      name: 'Tokyo Dome',
      address: '1-3-61 Koraku, Bunkyo City, Tokyo',
    },
    seatsAvailable: 800,
  },
]

// ── Mock Seats (≥40, SeatWithInventory shape) ──────────────────────

export const mockSeats: SeatWithInventory[] = [
  // Venue 001 — Floor section, rows A-E
  { seatId: 'demo-seat-001', rowNumber: 'A', seatNumber: '1', venueId: 'demo-venue-001', section: 'Floor', inventoryId: 'demo-inv-001', status: 'available', price: 149.99 },
  { seatId: 'demo-seat-002', rowNumber: 'A', seatNumber: '2', venueId: 'demo-venue-001', section: 'Floor', inventoryId: 'demo-inv-002', status: 'sold', price: 149.99 },
  { seatId: 'demo-seat-003', rowNumber: 'A', seatNumber: '3', venueId: 'demo-venue-001', section: 'Floor', inventoryId: 'demo-inv-003', status: 'available', price: 149.99 },
  { seatId: 'demo-seat-004', rowNumber: 'A', seatNumber: '4', venueId: 'demo-venue-001', section: 'Floor', inventoryId: 'demo-inv-004', status: 'available', price: 149.99 },
  { seatId: 'demo-seat-005', rowNumber: 'B', seatNumber: '1', venueId: 'demo-venue-001', section: 'Floor', inventoryId: 'demo-inv-005', status: 'held', price: 149.99 },
  { seatId: 'demo-seat-006', rowNumber: 'B', seatNumber: '2', venueId: 'demo-venue-001', section: 'Floor', inventoryId: 'demo-inv-006', status: 'available', price: 149.99 },
  { seatId: 'demo-seat-007', rowNumber: 'B', seatNumber: '3', venueId: 'demo-venue-001', section: 'Floor', inventoryId: 'demo-inv-007', status: 'available', price: 149.99 },
  { seatId: 'demo-seat-008', rowNumber: 'C', seatNumber: '1', venueId: 'demo-venue-001', section: 'Floor', inventoryId: 'demo-inv-008', status: 'sold', price: 149.99 },
  // Venue 001 — Lower Bowl, rows A-E
  { seatId: 'demo-seat-009', rowNumber: 'A', seatNumber: '1', venueId: 'demo-venue-001', section: 'Lower Bowl', inventoryId: 'demo-inv-009', status: 'available', price: 99.99 },
  { seatId: 'demo-seat-010', rowNumber: 'A', seatNumber: '2', venueId: 'demo-venue-001', section: 'Lower Bowl', inventoryId: 'demo-inv-010', status: 'available', price: 99.99 },
  { seatId: 'demo-seat-011', rowNumber: 'A', seatNumber: '3', venueId: 'demo-venue-001', section: 'Lower Bowl', inventoryId: 'demo-inv-011', status: 'sold', price: 99.99 },
  { seatId: 'demo-seat-012', rowNumber: 'B', seatNumber: '1', venueId: 'demo-venue-001', section: 'Lower Bowl', inventoryId: 'demo-inv-012', status: 'available', price: 99.99 },
  { seatId: 'demo-seat-013', rowNumber: 'B', seatNumber: '2', venueId: 'demo-venue-001', section: 'Lower Bowl', inventoryId: 'demo-inv-013', status: 'available', price: 99.99 },
  { seatId: 'demo-seat-014', rowNumber: 'C', seatNumber: '1', venueId: 'demo-venue-001', section: 'Lower Bowl', inventoryId: 'demo-inv-014', status: 'held', price: 99.99 },
  { seatId: 'demo-seat-015', rowNumber: 'C', seatNumber: '2', venueId: 'demo-venue-001', section: 'Lower Bowl', inventoryId: 'demo-inv-015', status: 'available', price: 99.99 },
  { seatId: 'demo-seat-016', rowNumber: 'D', seatNumber: '1', venueId: 'demo-venue-001', section: 'Lower Bowl', inventoryId: 'demo-inv-016', status: 'available', price: 99.99 },
  { seatId: 'demo-seat-017', rowNumber: 'D', seatNumber: '2', venueId: 'demo-venue-001', section: 'Lower Bowl', inventoryId: 'demo-inv-017', status: 'sold', price: 99.99 },
  { seatId: 'demo-seat-018', rowNumber: 'E', seatNumber: '1', venueId: 'demo-venue-001', section: 'Lower Bowl', inventoryId: 'demo-inv-018', status: 'available', price: 99.99 },
  // Venue 001 — Upper Bowl, rows A-E
  { seatId: 'demo-seat-019', rowNumber: 'A', seatNumber: '1', venueId: 'demo-venue-001', section: 'Upper Bowl', inventoryId: 'demo-inv-019', status: 'available', price: 59.99 },
  { seatId: 'demo-seat-020', rowNumber: 'A', seatNumber: '2', venueId: 'demo-venue-001', section: 'Upper Bowl', inventoryId: 'demo-inv-020', status: 'available', price: 59.99 },
  { seatId: 'demo-seat-021', rowNumber: 'B', seatNumber: '1', venueId: 'demo-venue-001', section: 'Upper Bowl', inventoryId: 'demo-inv-021', status: 'sold', price: 59.99 },
  { seatId: 'demo-seat-022', rowNumber: 'B', seatNumber: '2', venueId: 'demo-venue-001', section: 'Upper Bowl', inventoryId: 'demo-inv-022', status: 'available', price: 59.99 },
  { seatId: 'demo-seat-023', rowNumber: 'C', seatNumber: '1', venueId: 'demo-venue-001', section: 'Upper Bowl', inventoryId: 'demo-inv-023', status: 'available', price: 59.99 },
  // Venue 002 — Floor section, rows A-E
  { seatId: 'demo-seat-024', rowNumber: 'A', seatNumber: '1', venueId: 'demo-venue-002', section: 'Floor', inventoryId: 'demo-inv-024', status: 'available', price: 89.99 },
  { seatId: 'demo-seat-025', rowNumber: 'A', seatNumber: '2', venueId: 'demo-venue-002', section: 'Floor', inventoryId: 'demo-inv-025', status: 'available', price: 89.99 },
  { seatId: 'demo-seat-026', rowNumber: 'A', seatNumber: '3', venueId: 'demo-venue-002', section: 'Floor', inventoryId: 'demo-inv-026', status: 'sold', price: 89.99 },
  { seatId: 'demo-seat-027', rowNumber: 'B', seatNumber: '1', venueId: 'demo-venue-002', section: 'Floor', inventoryId: 'demo-inv-027', status: 'available', price: 89.99 },
  { seatId: 'demo-seat-028', rowNumber: 'B', seatNumber: '2', venueId: 'demo-venue-002', section: 'Floor', inventoryId: 'demo-inv-028', status: 'held', price: 89.99 },
  { seatId: 'demo-seat-029', rowNumber: 'C', seatNumber: '1', venueId: 'demo-venue-002', section: 'Floor', inventoryId: 'demo-inv-029', status: 'available', price: 89.99 },
  { seatId: 'demo-seat-030', rowNumber: 'C', seatNumber: '2', venueId: 'demo-venue-002', section: 'Floor', inventoryId: 'demo-inv-030', status: 'available', price: 89.99 },
  // Venue 002 — Lower Bowl, rows A-E
  { seatId: 'demo-seat-031', rowNumber: 'A', seatNumber: '1', venueId: 'demo-venue-002', section: 'Lower Bowl', inventoryId: 'demo-inv-031', status: 'available', price: 69.99 },
  { seatId: 'demo-seat-032', rowNumber: 'A', seatNumber: '2', venueId: 'demo-venue-002', section: 'Lower Bowl', inventoryId: 'demo-inv-032', status: 'sold', price: 69.99 },
  { seatId: 'demo-seat-033', rowNumber: 'B', seatNumber: '1', venueId: 'demo-venue-002', section: 'Lower Bowl', inventoryId: 'demo-inv-033', status: 'available', price: 69.99 },
  { seatId: 'demo-seat-034', rowNumber: 'B', seatNumber: '2', venueId: 'demo-venue-002', section: 'Lower Bowl', inventoryId: 'demo-inv-034', status: 'available', price: 69.99 },
  { seatId: 'demo-seat-035', rowNumber: 'C', seatNumber: '1', venueId: 'demo-venue-002', section: 'Lower Bowl', inventoryId: 'demo-inv-035', status: 'available', price: 69.99 },
  { seatId: 'demo-seat-036', rowNumber: 'D', seatNumber: '1', venueId: 'demo-venue-002', section: 'Lower Bowl', inventoryId: 'demo-inv-036', status: 'held', price: 69.99 },
  { seatId: 'demo-seat-037', rowNumber: 'D', seatNumber: '2', venueId: 'demo-venue-002', section: 'Lower Bowl', inventoryId: 'demo-inv-037', status: 'available', price: 69.99 },
  { seatId: 'demo-seat-038', rowNumber: 'E', seatNumber: '1', venueId: 'demo-venue-002', section: 'Lower Bowl', inventoryId: 'demo-inv-038', status: 'available', price: 69.99 },
  { seatId: 'demo-seat-039', rowNumber: 'E', seatNumber: '2', venueId: 'demo-venue-002', section: 'Lower Bowl', inventoryId: 'demo-inv-039', status: 'sold', price: 69.99 },
  { seatId: 'demo-seat-040', rowNumber: 'E', seatNumber: '3', venueId: 'demo-venue-002', section: 'Lower Bowl', inventoryId: 'demo-inv-040', status: 'available', price: 69.99 },
]

// ── Mock Tickets (all 4 TicketStatus values) ───────────────────────

export const mockTickets: Ticket[] = [
  {
    ticketId: 'demo-ticket-001',
    eventId: 'demo-event-001',
    seatId: 'demo-seat-001',
    ownerId: 'demo-user-001',
    status: 'active',
    price: 149.99,
    purchasedAt: '2025-01-15T10:30:00Z',
    event: mockEvents[0],
    seat: mockSeats[0],
    venue: { venueId: 'demo-venue-001', name: 'Madison Square Garden', address: '4 Pennsylvania Plaza, New York' },
  },
  {
    ticketId: 'demo-ticket-002',
    eventId: 'demo-event-002',
    seatId: 'demo-seat-009',
    ownerId: 'demo-user-001',
    status: 'used',
    price: 299.99,
    purchasedAt: '2025-02-20T14:45:00Z',
    event: mockEvents[1],
    seat: mockSeats[8],
    venue: { venueId: 'demo-venue-001', name: 'Madison Square Garden', address: '4 Pennsylvania Plaza, New York' },
  },
  {
    ticketId: 'demo-ticket-003',
    eventId: 'demo-event-003',
    seatId: 'demo-seat-024',
    ownerId: 'demo-user-001',
    status: 'cancelled',
    price: 89.99,
    purchasedAt: '2025-03-01T09:00:00Z',
    event: mockEvents[2],
    seat: mockSeats[23],
    venue: { venueId: 'demo-venue-002', name: 'Wembley Stadium', address: 'Wembley, London' },
  },
  {
    ticketId: 'demo-ticket-004',
    eventId: 'demo-event-001',
    seatId: 'demo-seat-003',
    ownerId: 'demo-user-001',
    status: 'listed',
    price: 149.99,
    purchasedAt: '2025-01-20T11:00:00Z',
    event: mockEvents[0],
    seat: mockSeats[2],
    venue: { venueId: 'demo-venue-001', name: 'Madison Square Garden', address: '4 Pennsylvania Plaza, New York' },
  },
]

// ── Mock Listings (all 4 ListingStatus values) ─────────────────────

export const mockListings: MarketplaceListing[] = [
  {
    listingId: 'demo-listing-001',
    ticketId: 'demo-ticket-004',
    sellerId: 'demo-user-001',
    sellerName: 'demo',
    eventId: 'demo-event-001',
    price: 199.99,
    status: 'active',
    createdAt: '2025-03-01T09:00:00Z',
    event: mockEvents[0],
  },
  {
    listingId: 'demo-listing-002',
    ticketId: 'demo-ticket-005',
    sellerId: 'demo-seller-002',
    sellerName: 'seller2',
    eventId: 'demo-event-002',
    price: 349.99,
    status: 'sold',
    createdAt: '2025-03-05T11:30:00Z',
    soldAt: '2025-03-10T14:00:00Z',
    event: mockEvents[1],
  },
  {
    listingId: 'demo-listing-003',
    ticketId: 'demo-ticket-006',
    sellerId: 'demo-seller-003',
    sellerName: 'seller3',
    eventId: 'demo-event-003',
    price: 120.00,
    status: 'cancelled',
    createdAt: '2025-03-08T10:00:00Z',
    event: mockEvents[2],
  },
  {
    listingId: 'demo-listing-004',
    ticketId: 'demo-ticket-007',
    sellerId: 'demo-seller-004',
    sellerName: 'seller4',
    eventId: 'demo-event-005',
    price: 95.00,
    status: 'expired',
    createdAt: '2025-02-01T08:00:00Z',
    event: mockEvents[4],
  },
]

// ── Mock Transfers ─────────────────────────────────────────────────

export const mockTransfers: Transfer[] = [
  {
    transferId: 'demo-transfer-001',
    ticketId: 'demo-ticket-001',
    fromUserId: 'demo-user-001',
    toUserEmail: 'recipient@example.com',
    status: 'pending',
    createdAt: '2025-03-10T16:00:00Z',
    expiresAt: '2025-03-17T16:00:00Z',
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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const mockServices = {
  async login(email: string, _password: string): Promise<{ user: AuthUser; token: string }> {
    await delay(defaultConfig.delay!)
    if (email === 'demo@ticketremaster.com') {
      return {
        user: {
          userId: mockUser.userId,
          email: mockUser.email,
          phoneNumber: mockUser.phoneNumber,
          role: mockUser.role as AuthUser['role'],
          isFlagged: mockUser.isFlagged,
          isAdmin: false,
        },
        token: 'demo-jwt-token',
      }
    }
    if (email === 'admin@ticketremaster.com') {
      return {
        user: {
          userId: mockAdminUser.userId,
          email: mockAdminUser.email,
          phoneNumber: mockAdminUser.phoneNumber,
          role: mockAdminUser.role as AuthUser['role'],
          isFlagged: mockAdminUser.isFlagged,
          isAdmin: true,
        },
        token: 'demo-jwt-token',
      }
    }
    if (email === 'staff@ticketremaster.com') {
      return {
        user: {
          userId: mockStaffUser.userId,
          email: mockStaffUser.email,
          phoneNumber: mockStaffUser.phoneNumber,
          role: mockStaffUser.role as AuthUser['role'],
          isFlagged: mockStaffUser.isFlagged,
          isAdmin: false,
        },
        token: 'demo-jwt-token',
      }
    }
    throw new Error('Invalid credentials')
  },

  async register(data: { email: string; password: string; phoneNumber: string }): Promise<{ user: AuthUser; token: string }> {
    await delay(defaultConfig.delay!)
    return {
      user: {
        userId: 'demo-user-new',
        email: data.email,
        role: 'user',
        isFlagged: false,
        isAdmin: false,
      },
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
    const paginated = filtered.slice(start, start + limit)
    return {
      events: paginated,
      pagination: { page, limit, total: filtered.length },
    }
  },

  async getEvent(eventId: string): Promise<Event> {
    await delay(defaultConfig.delay!)
    const event = mockEvents.find(e => e.eventId === eventId)
    if (!event) throw new Error('Event not found')
    return {
      ...event,
      description: 'This is a demo event description. In a real application, this would come from the backend.',
      createdAt: '2024-01-01T00:00:00Z',
      cancelledAt: undefined,
      updatedAt: undefined,
      venue: event.venue ? { ...event.venue, createdAt: '2024-01-01T00:00:00Z' } : undefined,
    } as Event
  },

  async getUpcomingEvents(params?: { page?: number; limit?: number }): Promise<{ events: EventSummary[]; pagination: { page: number; limit: number; total: number } }> {
    await delay(defaultConfig.delay!)
    const now = new Date()
    const upcoming = mockEvents.filter(e => new Date(e.date) > now)
    const page = params?.page || 1
    const limit = params?.limit || 10
    const start = (page - 1) * limit
    const paginated = upcoming.slice(start, start + limit)
    return {
      events: paginated,
      pagination: { page, limit, total: upcoming.length },
    }
  },

  async searchEvents(query: string, params?: { page?: number; limit?: number }): Promise<{ events: EventSummary[]; pagination: { page: number; limit: number; total: number } }> {
    await delay(defaultConfig.delay!)
    const q = query.toLowerCase()
    const filtered = mockEvents.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.venue?.name.toLowerCase().includes(q)
    )
    const page = params?.page || 1
    const limit = params?.limit || 10
    const start = (page - 1) * limit
    const paginated = filtered.slice(start, start + limit)
    return {
      events: paginated,
      pagination: { page, limit, total: filtered.length },
    }
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
    return {
      listings: mockListings.slice(0, limit),
      pagination: { page, limit, total: mockListings.length },
    }
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
  return !!(window as unknown as Record<string, unknown>).__demoMode
}

export function setDemoMode(enabled: boolean): void {
  ;(window as unknown as Record<string, unknown>).__demoMode = enabled
}

export function getDemoBannerMessage(): string {
  return 'Demo Mode: Showing mock data. Backend features like login, purchases, and real-time updates are disabled.'
}
