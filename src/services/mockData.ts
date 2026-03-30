export const mockStaffUser: User = {
  userId: 'demo-staff-001',
  email: 'staff@ticketremaster.com',
  phoneNumber: '+1234567892',
  role: 'staff',
  isFlagged: false,
  createdAt: '2024-01-01T00:00:00Z',
  venueId: 'demo-venue-001',
}/**
 * Mock Data Service for Offline UI Development
 * Provides realistic mock data when backend is unavailable.
 * Used for UI development and demo purposes only.
 */
import type {
  User,
  Event,
  EventSummary,
  Ticket,
  Seat,
  Venue,
  MarketplaceListing,
  Transfer,
  AuthUser,
} from '@/types'

// ── Mock Data ──────────────────────────────────────────────────────

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
]

export const mockSeats: Seat[] = [
  { seatId: 'demo-seat-001', rowNumber: 'A', seatNumber: '1', venueId: 'demo-venue-001', section: 'Floor' },
  { seatId: 'demo-seat-002', rowNumber: 'A', seatNumber: '2', venueId: 'demo-venue-001', section: 'Floor' },
  { seatId: 'demo-seat-003', rowNumber: 'A', seatNumber: '3', venueId: 'demo-venue-001', section: 'Floor' },
  { seatId: 'demo-seat-004', rowNumber: 'B', seatNumber: '1', venueId: 'demo-venue-001', section: 'Floor' },
  { seatId: 'demo-seat-005', rowNumber: 'B', seatNumber: '2', venueId: 'demo-venue-001', section: 'Floor' },
  { seatId: 'demo-seat-006', rowNumber: 'B', seatNumber: '3', venueId: 'demo-venue-001', section: 'Floor' },
  { seatId: 'demo-seat-007', rowNumber: 'C', seatNumber: '1', venueId: 'demo-venue-001', section: 'Lower Bowl' },
  { seatId: 'demo-seat-008', rowNumber: 'C', seatNumber: '2', venueId: 'demo-venue-001', section: 'Lower Bowl' },
  { seatId: 'demo-seat-009', rowNumber: 'C', seatNumber: '3', venueId: 'demo-venue-001', section: 'Lower Bowl' },
  { seatId: 'demo-seat-010', rowNumber: 'D', seatNumber: '1', venueId: 'demo-venue-001', section: 'Lower Bowl' },
]

export const mockTickets: Ticket[] = [
  {
    ticketId: 'demo-ticket-001',
    eventId: 'demo-event-001',
    seatId: 'demo-seat-001',
    ownerId: 'demo-user-001',
    status: 'valid',
    purchasedAt: '2025-01-15T10:30:00Z',
    event: mockEvents[0],
    seat: mockSeats[0],
  },
  {
    ticketId: 'demo-ticket-002',
    eventId: 'demo-event-002',
    seatId: 'demo-seat-002',
    ownerId: 'demo-user-001',
    status: 'valid',
    purchasedAt: '2025-02-20T14:45:00Z',
    event: mockEvents[1],
    seat: mockSeats[1],
  },
]

export const mockListings: MarketplaceListing[] = [
  {
    listingId: 'demo-listing-001',
    ticketId: 'demo-ticket-003',
    sellerId: 'demo-seller-001',
    eventId: 'demo-event-001',
    price: 199.99,
    status: 'active',
    createdAt: '2025-03-01T09:00:00Z',
    event: mockEvents[0],
  },
  {
    listingId: 'demo-listing-002',
    ticketId: 'demo-ticket-004',
    sellerId: 'demo-seller-002',
    eventId: 'demo-event-002',
    price: 349.99,
    status: 'active',
    createdAt: '2025-03-05T11:30:00Z',
    event: mockEvents[1],
  },
]

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
  delay?: number // Simulate network latency
  offlineMode?: boolean
}

const defaultConfig: MockServiceConfig = {
  delay: 500, // 500ms simulated latency
  offlineMode: true,
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const mockServices = {
  // Auth
  async login(email: string, _password: string): Promise<{ user: AuthUser; token: string }> {
    await delay(defaultConfig.delay!)
    if (email === 'demo@ticketremaster.com' || email === 'admin@ticketremaster.com') {
      const user = email.includes('admin') ? mockAdminUser : mockUser
      return {
        user: {
          userId: user.userId,
          email: user.email,
          role: user.role as AuthUser['role'],
          isFlagged: user.isFlagged,
          isAdmin: user.role === 'admin',
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

  // Events
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
    const eventWithCreatedAt = {
      ...event,
      description: 'This is a demo event description. In a real application, this would come from the backend.',
      createdAt: '2024-01-01T00:00:00Z',
      cancelledAt: undefined,
      updatedAt: undefined,
      venue: event.venue ? { ...event.venue, createdAt: '2024-01-01T00:00:00Z' } : undefined,
    } as Event
    return eventWithCreatedAt
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

  // Venues
  async getVenues(): Promise<{ venues: Venue[] }> {
    await delay(defaultConfig.delay!)
    return { venues: mockVenues }
  },

  // Seats
  async getSeats(_eventId: string): Promise<{ seats: Array<Seat & { inventoryId: string; status: string; price: number }> }> {
    await delay(defaultConfig.delay!)
    return {
      seats: mockSeats.map((seat, i) => ({
        ...seat,
        inventoryId: `demo-inventory-${i + 1}`,
        status: i % 3 === 0 ? 'sold' : 'available',
        price: 149.99,
      })),
    }
  },

  // Tickets
  async getMyTickets(): Promise<{ tickets: Ticket[] }> {
    await delay(defaultConfig.delay!)
    return { tickets: mockTickets }
  },

  // Marketplace
  async getMarketplaceListings(params?: { page?: number; limit?: number }): Promise<{ listings: MarketplaceListing[]; pagination: { page: number; limit: number; total: number } }> {
    await delay(defaultConfig.delay!)
    const page = params?.page || 1
    const limit = params?.limit || 10
    return {
      listings: mockListings.slice(0, limit),
      pagination: { page, limit, total: mockListings.length },
    }
  },

  // User
  async getUserProfile(_userId: string): Promise<User> {
    await delay(defaultConfig.delay!)
    return mockUser
  },

  // Transfers
  async getTransfers(): Promise<{ transfers: Transfer[] }> {
    await delay(defaultConfig.delay!)
    return { transfers: mockTransfers }
  },
}

// ── Demo Mode Detection ────────────────────────────────────────────

export function isDemoMode(): boolean {
  // Check URL params for demo mode
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('demo') === 'true') return true

  // Check if we can't reach the backend
  // This is set by the API client when it detects offline mode
  return !!(window as unknown as Record<string, unknown>).__demoMode
}

export function setDemoMode(enabled: boolean): void {
  ;(window as unknown as Record<string, unknown>).__demoMode = enabled
}

export function getDemoBannerMessage(): string {
  return 'Demo Mode: Showing mock data. Backend features like login, purchases, and real-time updates are disabled.'
}
