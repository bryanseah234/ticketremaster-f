import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import {
  savePendingRegistration,
  readPendingRegistration,
  clearPendingRegistration,
} from '@/utils/registrationState'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { isDemoMode } from '@/services/mockData'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ push: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
}))

vi.mock('@/utils/eventMedia', () => ({
  resolveEventImage: vi.fn().mockReturnValue('/mock-image.jpg'),
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: vi.fn().mockReturnValue({ params: { transferId: 'demo-transfer-001', orderId: 'demo-order-001' }, query: {} }),
    useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
    RouterLink: { template: '<a><slot /></a>' },
    onBeforeRouteLeave: vi.fn(),
  }
})

vi.mock('@/components/account/AccountSidebar.vue', () => ({
  default: { template: '<div class="account-sidebar-stub" />' },
}))

const mockData = vi.hoisted(() => ({
  marketplaceListings: [
    {
      listingId: 'listing-self-001',
      ticketId: 'ticket-self-001',
      sellerId: 'user-self-001',
      eventId: 'evt-001',
      price: 180,
      status: 'active',
      createdAt: new Date().toISOString(),
      event: {
        eventId: 'evt-001',
        name: 'Neon Nights',
        date: new Date().toISOString(),
        venueId: 'ven-001',
        price: 180,
        type: 'concert',
        image: '/mock-image.jpg',
      },
    },
  ],
  venues: [
    { venueId: 'ven-001', name: 'Esplanade Concert Hall', address: '1 Esplanade Drive' },
  ],
  events: [
    { eventId: 'evt-001', venueId: 'ven-001', name: 'Neon Nights', date: new Date().toISOString() },
  ],
}))

vi.mock('@/services/mockData', () => ({
  isDemoMode: vi.fn().mockReturnValue(true),
  mockEvents: [],
  mockTransfers: [],
  mockUser: { userId: 'u1', email: 'user@test.com', phoneNumber: '+6511111111', role: 'user', isFlagged: false, isAdmin: false },
  mockAdminUser: { userId: 'a1', email: 'admin@test.com', phoneNumber: '+6511111112', role: 'admin', isFlagged: false, isAdmin: true },
  mockStaffUser: { userId: 's1', email: 'staff@test.com', phoneNumber: '+6511111113', role: 'staff', isFlagged: false, isAdmin: false, venueId: 'ven-001' },
  setDemoMode: vi.fn(),
  mockServices: {
    getMarketplaceListings: vi.fn().mockResolvedValue({
      listings: mockData.marketplaceListings,
      pagination: { page: 1, limit: 10, total: 1 },
    }),
    getMyTickets: vi.fn().mockResolvedValue({ tickets: [] }),
    getVenues: vi.fn().mockResolvedValue({ venues: mockData.venues }),
    getEvents: vi.fn().mockResolvedValue({ events: mockData.events, pagination: { page: 1, limit: 200, total: 1 } }),
  },
}))

function createTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

function seedAuthUser(overrides: Record<string, any> = {}) {
  const auth = useAuthStore()
  auth.state.accessToken = 'demo-token'
  auth.state.user = {
    userId: 'user-self-001',
    email: 'user@test.com',
    phoneNumber: '+6511111111',
    role: 'user',
    isFlagged: false,
    isAdmin: false,
    ...overrides,
  } as any
}

async function flushAsync() {
  await Promise.resolve()
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('Frontend UX Fixes — targeted coverage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    vi.mocked(isDemoMode).mockReturnValue(true)
    createTestPinia()
    seedAuthUser()
  })

  it('registration helper clears stale pending state after TTL expiry', () => {
    savePendingRegistration({
      userId: 'user-ttl-001',
      fullName: 'TTL User',
      email: 'ttl@example.com',
      phoneNumber: '+6512345678',
    })

    const raw = localStorage.getItem('pending_registration')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw as string)
    parsed.expiresAt = new Date(Date.now() - 60_000).toISOString()
    localStorage.setItem('pending_registration', JSON.stringify(parsed))

    const stale = readPendingRegistration()
    expect(stale).toBeNull()
    expect(localStorage.getItem('pending_registration')).toBeNull()

    clearPendingRegistration()
  })

  it('verify OTP grid click focuses the hidden OTP input', async () => {
    vi.mocked(isDemoMode).mockReturnValue(false)
    const { default: VerifyView } = await import('../VerifyView.vue')
    const wrapper = mount(VerifyView, { attachTo: document.body })
    await flushAsync()

    await wrapper.find('.otp-grid').trigger('click')
    const input = wrapper.find('.otp-hidden-input').element as HTMLInputElement
    expect(document.activeElement).toBe(input)
    wrapper.unmount()
  })

  it('verification success stays sidebar-free and keeps primary card layout', async () => {
    const { default: VerificationSuccessView } = await import('../VerificationSuccessView.vue')
    const wrapper = mount(VerificationSuccessView)
    await flushAsync()

    expect(wrapper.find('.verification-card').exists()).toBe(true)
    expect(wrapper.find('.account-sidebar-stub').exists()).toBe(false)
  })

  it('transfer stays sidebar-free and shows a waiting state to the buyer during seller OTP', async () => {
    const { default: TransferConfirmView } = await import('../TransferConfirmView.vue')
    const wrapper = shallowMount(TransferConfirmView)
    await flushAsync()

    const vm = wrapper.vm as any
    vm.transfer = {
      transferId: 'demo-transfer-001',
      status: 'pending_seller_otp',
      sellerId: 'different-seller-id',
      buyerId: 'user-self-001',
      eventName: 'Neon Nights',
      seatRow: '12',
      seatNumber: '08',
    }
    await nextTick()

    expect(wrapper.find('.otp-layout').exists()).toBe(false)
    expect(wrapper.find('.account-sidebar-stub').exists()).toBe(false)
    expect(wrapper.text()).toContain('Waiting for seller verification')
    expect(wrapper.find('.otp-grid').exists()).toBe(false)
  })

  it('notification store merges sources and dedupes by id', () => {
    const store = useNotificationStore()

    store.sellerPending = [
      {
        id: 'dup-001',
        type: 'seller_pending_acceptance',
        title: 'Seller pending',
        body: 'Seller pending item',
        createdAt: new Date(Date.now() - 60_000).toISOString(),
        transferId: 't-001',
      },
    ] as any
    store.buyerPending = [
      {
        id: 'dup-001',
        type: 'buyer_pending_otp',
        title: 'Buyer pending',
        body: 'Buyer pending item',
        createdAt: new Date().toISOString(),
        transferId: 't-001',
      },
    ] as any

    expect(store.allNotifications.length).toBe(1)
    expect(store.allNotifications[0].title).toBe('Buyer pending')

    store.addEphemeral({
      type: 'transfer_completed',
      title: 'Transfer Complete',
      body: 'Your transfer is complete.',
      createdAt: new Date().toISOString(),
      primaryTo: '/tickets',
      transferId: 't-001',
    })
    store.addEphemeral({
      type: 'transfer_completed',
      title: 'Transfer Complete',
      body: 'Your transfer is complete.',
      createdAt: new Date().toISOString(),
      primaryTo: '/tickets',
      transferId: 't-001',
    })

    expect(store.ephemeral.length).toBe(1)
  })

  it('notification store treats buyer pending 404 as empty without warning noise', async () => {
    const { default: api } = await import('@/api/client')
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(api.get).mockRejectedValueOnce({ response: { status: 404 } } as any)

    const store = useNotificationStore()
    await store.fetchBuyerPending()

    expect(store.buyerPending).toEqual([])
    expect(consoleWarn).not.toHaveBeenCalled()
  })

  it('checkout hydrates sparse pending orders with fallback event and seat pricing', async () => {
    localStorage.setItem(
      'pendingOrder',
      JSON.stringify({
        orderId: 'demo-order-001',
        inventoryId: 'demo-order-001',
        holdToken: 'hold-123',
        heldUntil: new Date(Date.now() + 300_000).toISOString(),
        eventId: 'evt_001',
        seat: {},
        event: {
          name: 'Recovered Event',
          price: 248,
          venueName: 'Esplanade Concert Hall',
          eventDate: '2026-06-15T19:30:00',
        },
      }),
    )

    const { default: CheckoutView } = await import('../CheckoutView.vue')
    const wrapper = shallowMount(CheckoutView)
    await flushAsync()

    const vm = wrapper.vm as any
    expect(vm.order?.event?.name).toBe('Recovered Event')
    expect(vm.order?.seat?.price).toBeGreaterThan(0)
    expect(vm.seatPrice).toBeGreaterThan(0)
  })

  it('scanner keeps verify controls locked until venue/event are confirmed', async () => {
    const { default: StaffScannerView } = await import('../StaffScannerView.vue')
    const wrapper = mount(StaffScannerView)
    await flushAsync()

    const selects = wrapper.findAll('select')
    expect(selects.length).toBe(2)

    const manualInput = wrapper.find('input[placeholder="Ticket ID"]')
    expect(manualInput.attributes('disabled')).toBeDefined()

    await selects[0].setValue('ven-001')
    await selects[1].setValue('evt-001')
    await nextTick()

    const confirmButton = wrapper
      .findAll('button')
      .find((btn) => /confirm selection|reconfirm selection/i.test(btn.text()))
    expect(confirmButton).toBeTruthy()
    await confirmButton!.trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('Scanning session')
    expect(wrapper.find('input[placeholder="Ticket ID"]').attributes('disabled')).toBeUndefined()
  })

  it('marketplace renders own listed ticket with readable disabled listed button', async () => {
    const { default: MarketplaceView } = await import('../MarketplaceView.vue')
    const wrapper = mount(MarketplaceView)
    await flushAsync()

    const listedButton = wrapper.find('.listed-button')
    expect(listedButton.exists()).toBe(true)
    expect(listedButton.attributes('disabled')).toBeDefined()
    expect((listedButton.attributes('style') || '').includes('opacity: 0.45')).toBe(false)
  })
})
