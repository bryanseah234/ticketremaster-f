/**
 * Application-wide type definitions for TicketRemaster
 */

// ── User Types ──────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin' | 'staff'

export interface User {
  userId: string
  email: string
  phoneNumber?: string
  role: UserRole
  isFlagged: boolean
  venueId?: string
  createdAt: string
  updatedAt?: string
  favoriteEvents?: string[]
}

export interface AuthUser {
  userId: string
  email: string
  fullName?: string
  name?: string // legacy alias for backend/display payloads
  phoneNumber?: string
  phone?: string // legacy alias for backward compat
  venueId?: string // for staff scanner venue context
  isFlagged?: boolean
  isAdmin?: boolean
  role?: UserRole
}

// ── Venue Types ─────────────────────────────────────────────────────

export interface Venue {
  venueId: string
  name: string
  address?: string
  city?: string
  country?: string
  capacity?: number
  createdAt: string
}

// ── Event Types ─────────────────────────────────────────────────────

export type EventType = 'concert' | 'sports' | 'theatre' | 'classical' | 'festival' | 'other'

export interface Event {
  eventId: string
  venueId: string
  name: string
  date: string
  description?: string
  type: EventType
  image?: string
  price: number
  createdAt: string
  updatedAt?: string
  cancelledAt?: string
  venue?: Venue
  seatsAvailable?: number
}

export interface EventSummary {
  eventId: string
  name: string
  date: string
  venueId: string
  price: number
  type: EventType
  image?: string
  venue?: { venueId: string; name: string; address?: string }
  seatsAvailable?: number
}

// ── Seat Types ──────────────────────────────────────────────────────

export type SeatStatus = 'available' | 'held' | 'sold' | 'reserved'

export interface Seat {
  seatId: string
  rowNumber: string
  seatNumber: string
  venueId: string
  section?: string
  accessibility?: boolean
}

export interface SeatInventory {
  inventoryId: string
  seatId: string
  eventId: string
  status: SeatStatus
  heldUntil?: string
  price?: number
}

export interface SeatWithInventory extends Seat {
  inventoryId: string
  status: SeatStatus
  heldUntil?: string
  price?: number
}

// ── Ticket Types ────────────────────────────────────────────────────

export type TicketStatus = 'active' | 'used' | 'cancelled' | 'listed' | 'transferred'

export interface Ticket {
  ticketId: string
  eventId: string
  seatId: string
  ownerId: string
  purchaseId?: string
  status: TicketStatus
  price?: number
  qrHash?: string
  purchasedAt: string
  transferredAt?: string
  event?: EventSummary
  seat?: Seat
  venue?: { venueId: string; name: string; address?: string }
}

// ── Purchase Types ──────────────────────────────────────────────────

export type PurchaseStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired'

export interface Purchase {
  purchaseId: string
  userId: string
  eventId: string
  seatIds: string[]
  totalAmount: number
  status: PurchaseStatus
  holdsUntil?: string
  confirmedAt?: string
  cancelledAt?: string
  tickets?: Ticket[]
}

// ── Transfer Types ──────────────────────────────────────────────────

export type TransferStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'completed' | 'pending_seller_acceptance' | 'pending_buyer_otp' | 'pending_seller_otp' | 'failed'

export interface Transfer {
  transferId: string
  ticketId: string
  fromUserId: string
  toUserEmail: string
  toUserId?: string
  status: TransferStatus
  otpRequired?: boolean
  otpVerified?: boolean
  createdAt: string
  expiresAt: string
  completedAt?: string
}

// ── Marketplace Types ───────────────────────────────────────────────

export type ListingStatus = 'active' | 'sold' | 'cancelled' | 'expired'

export interface MarketplaceListing {
  listingId: string
  ticketId: string
  sellerId: string
  sellerName?: string
  eventId: string
  price: number
  status: ListingStatus
  createdAt: string
  soldAt?: string
  event?: EventSummary
}

// ── Credit Types ────────────────────────────────────────────────────

export interface CreditTransaction {
  transactionId: string
  userId: string
  amount: number
  type: 'topup' | 'purchase' | 'refund' | 'transfer'
  status: 'pending' | 'completed' | 'failed'
  reference?: string
  createdAt: string
}

export interface CreditBalance {
  userId: string
  balance: number
  currency: string
  updatedAt: string
}

// ── API Response Types ──────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages?: number
  }
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error?: {
    code: string
    message: string
    status?: number
    traceId?: string
    details?: Record<string, unknown>
  }
  error_code?: string
  message?: string
}

// ── Notification Types ──────────────────────────────────────────────

export type NotificationItemType =
  | 'seller_pending_acceptance'
  | 'seller_pending_otp'
  | 'buyer_pending_otp'
  | 'transfer_completed'
  | 'ticket_update'

export interface NotificationCenterItem {
  id: string
  type: NotificationItemType
  title: string
  body: string
  createdAt: string
  primaryTo: string
  transferId?: string
  ticketId?: string
}

// ── WebSocket Types ─────────────────────────────────────────────────

export type WebSocketEventType =
  | 'seat_update'
  | 'ticket_update'
  | 'transfer_update'
  | 'purchase_update'
  | 'user_update'
  | 'event_update'

export interface WebSocketMessage {
  type: WebSocketEventType
  payload: unknown
  timestamp: string
  traceId?: string
}

export interface SeatUpdateMessage extends WebSocketMessage {
  type: 'seat_update'
  payload: {
    eventId: string
    seatId: string
    inventoryId: string
    status: SeatStatus
    heldUntil?: string
  }
}

export interface TicketUpdateMessage extends WebSocketMessage {
  type: 'ticket_update'
  payload: {
    ticketId: string
    status: TicketStatus
    ownerId?: string
  }
}

// ── Form Types ──────────────────────────────────────────────────────

export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  phoneNumber: string
  role?: UserRole
  venueId?: string
}

export interface EventCreateForm {
  name: string
  type: EventType
  venueId: string
  event_date: string
  description?: string
  image?: string
  pricing_tiers: Record<string, number>
}

export interface UserFlagForm {
  isFlagged: boolean
  reason?: string
}

// ── UI Types ────────────────────────────────────────────────────────

export interface Toast {
  id: string | number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export interface BreadcrumbItem {
  label: string
  to?: string
  disabled?: boolean
}

// ── Environment Types ───────────────────────────────────────────────

export interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_STRIPE_PUBLIC_KEY: string
  readonly VITE_KONG_API_KEY: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_SENTRY_ENVIRONMENT: string
  readonly VITE_SENTRY_RELEASE: string
  readonly VITE_POSTHOG_API_KEY: string
  readonly VITE_POSTHOG_HOST: string
  readonly VITE_WS_URL: string
}

export interface ImportMeta {
  readonly env: ImportMetaEnv
}
