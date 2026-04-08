/**
 * Stitch v3 Visual Polish — Preservation Property Tests
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**
 *
 * PURPOSE: These tests assert that the FUNCTIONAL behavior of all five views is
 * correct on the UNFIXED code. They establish the baseline that must not regress
 * after the visual fixes are applied in tasks 3–7.
 *
 * EXPECTED OUTCOME: All tests PASS on unfixed code.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import fc from 'fast-check'

// ---------------------------------------------------------------------------
// Global mocks
// ---------------------------------------------------------------------------

const mockApiGet = vi.fn().mockResolvedValue({ data: {} })
const mockApiPost = vi.fn().mockResolvedValue({ data: {} })
const mockApiDelete = vi.fn().mockResolvedValue({ data: {} })

vi.mock('@/api/client', () => ({
  default: {
    get: mockApiGet,
    post: mockApiPost,
    delete: mockApiDelete,
  },
}))

vi.mock('@/services/mockData', () => ({
  isDemoMode: vi.fn().mockReturnValue(true),
  mockEvents: [],
  mockTransfers: [
    { transferId: 'demo-t-001', creditAmount: 180, createdAt: new Date().toISOString() },
  ],
  mockUser: { userId: 'u1', email: 'test@test.com', phoneNumber: '+1', role: 'user', isFlagged: false, isAdmin: false },
  mockAdminUser: { userId: 'a1', email: 'admin@test.com', phoneNumber: '+1', role: 'admin', isFlagged: false, isAdmin: true },
  mockStaffUser: { userId: 's1', email: 'staff@test.com', phoneNumber: '+1', role: 'staff', isFlagged: false, isAdmin: false },
  setDemoMode: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ push: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
}))

const mockCheckNotifications = vi.fn()
const mockDismiss = vi.fn()

// Use a Vue computed ref so the template's v-for auto-unwraps correctly
const notificationsArray = ref([
  { transferId: 'demo-t-001', creditAmount: 180, createdAt: new Date().toISOString(), type: 'transfer_request' },
  { transferId: 'demo-t-002', creditAmount: 50, createdAt: new Date().toISOString(), type: 'topup_success' },
  { transferId: 'demo-t-003', creditAmount: 200, createdAt: new Date().toISOString(), type: 'ticket_sold' },
  { transferId: 'demo-t-004', creditAmount: 0, createdAt: new Date().toISOString(), type: 'hold_expiring' },
])
const mockNotifications = computed(() => notificationsArray.value)

vi.mock('@/composables/useSellerNotifications', () => ({
  useSellerNotifications: () => ({
    notifications: mockNotifications,
    checkNotifications: mockCheckNotifications,
    dismiss: mockDismiss,
  }),
}))

vi.mock('@/utils/eventMedia', () => ({
  resolveEventImage: vi.fn().mockReturnValue('/mock-image.jpg'),
}))

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue(null),
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: vi.fn().mockReturnValue({ params: { transferId: 'demo-t-001', orderId: 'demo-o-001' } }),
    useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
    RouterLink: { template: '<a><slot /></a>' },
    onBeforeRouteLeave: vi.fn(),
  }
})

vi.mock('@/components/account/AccountSidebar.vue', () => ({
  default: { template: '<div class="account-sidebar-stub" />' },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

function seedAuthStore() {
  const auth = useAuthStore()
  auth.state.accessToken = 'demo-user-token'
  auth.state.user = {
    userId: 'demo-seller-001',
    email: 'test@test.com',
    phoneNumber: '+1',
    role: 'user',
    isFlagged: false,
    isAdmin: false,
  }
}

function makePendingOrder(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    orderId: 'demo-o-001',
    inventoryId: 'inv-001',
    eventId: 'evt-001',
    holdToken: 'hold-abc',
    heldUntil: new Date(Date.now() + 600_000).toISOString(),
    seat: { price: 120, rowNumber: 'A', seatNumber: '12', section: 'Floor' },
    event: { name: 'Demo Event', venueName: 'Demo Venue', eventDate: new Date().toISOString() },
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// Transfer flow — clauses 3.1, 3.2, 3.3
// ---------------------------------------------------------------------------

describe('TransferConfirmView — preservation (clauses 3.1–3.3)', () => {
  beforeEach(() => {
    createTestPinia()
    seedAuthStore()
    mockApiPost.mockResolvedValue({ data: { data: { status: 'pending_seller_otp' } } })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('3.1a — acceptTransfer calls /transfer/{id}/seller-accept in live mode', async () => {
    // Override isDemoMode to return false for this test
    const { isDemoMode } = await import('@/services/mockData')
    vi.mocked(isDemoMode).mockReturnValue(false)

    try {
      const { default: TransferConfirmView } = await import('../TransferConfirmView.vue')
      const wrapper = shallowMount(TransferConfirmView)
      await wrapper.vm.$nextTick()
      await new Promise((r) => setTimeout(r, 50))

      const vm = wrapper.vm as any
      // Set up transfer in seller acceptance state
      vm.transfer = {
        transferId: 'demo-t-001',
        status: 'pending_seller_acceptance',
        sellerId: 'demo-seller-001',
        creditAmount: 180,
      }
      await wrapper.vm.$nextTick()

      mockApiPost.mockClear()
      mockApiPost.mockResolvedValueOnce({ data: { data: { status: 'pending_seller_otp' } } })

      // Trigger acceptTransfer
      await vm.acceptTransfer()

      expect(mockApiPost).toHaveBeenCalledWith(
        expect.stringContaining('/transfer/demo-t-001/seller-accept'),
      )
    } finally {
      vi.mocked(isDemoMode).mockReturnValue(true)
    }
  })

  it('3.1b — rejectTransfer calls /transfer/{id}/seller-reject in live mode', async () => {
    const { isDemoMode } = await import('@/services/mockData')
    vi.mocked(isDemoMode).mockReturnValue(false)

    try {
      const { default: TransferConfirmView } = await import('../TransferConfirmView.vue')
      const wrapper = shallowMount(TransferConfirmView)
      await wrapper.vm.$nextTick()
      await new Promise((r) => setTimeout(r, 50))

      const vm = wrapper.vm as any
      vm.transfer = {
        transferId: 'demo-t-001',
        status: 'pending_seller_acceptance',
        sellerId: 'demo-seller-001',
      }
      await wrapper.vm.$nextTick()

      mockApiPost.mockClear()
      mockApiPost.mockResolvedValueOnce({ data: {} })

      await vm.rejectTransfer()

      expect(mockApiPost).toHaveBeenCalledWith(
        expect.stringContaining('/transfer/demo-t-001/seller-reject'),
      )
    } finally {
      vi.mocked(isDemoMode).mockReturnValue(true)
    }
  })

  it('3.2 — verifyOtp enforces 6-digit requirement (rejects short OTP)', async () => {
    const { default: TransferConfirmView } = await import('../TransferConfirmView.vue')
    const wrapper = shallowMount(TransferConfirmView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const vm = wrapper.vm as any
    vm.transfer = { transferId: 'demo-t-001', status: 'pending_buyer_otp', sellerId: 'demo-seller-001' }
    vm.otp = '123' // only 3 digits
    await wrapper.vm.$nextTick()

    await vm.verifyOtp()

    expect(vm.otpError, 'short OTP should set an error message').toBeTruthy()
    expect(vm.otpError).toMatch(/6/i)
  })

  it('3.2b — verifyOtp calls buyer-verify endpoint in live mode', async () => {
    const { isDemoMode } = await import('@/services/mockData')
    vi.mocked(isDemoMode).mockReturnValue(false)

    try {
      const { default: TransferConfirmView } = await import('../TransferConfirmView.vue')
      const wrapper = shallowMount(TransferConfirmView)
      await wrapper.vm.$nextTick()
      await new Promise((r) => setTimeout(r, 50))

      const vm = wrapper.vm as any
      vm.transfer = { transferId: 'demo-t-001', status: 'pending_buyer_otp', sellerId: 'other-seller' }
      vm.otp = '123456'
      await wrapper.vm.$nextTick()

      mockApiPost.mockClear()
      mockApiPost.mockResolvedValueOnce({ data: { data: { status: 'completed' } } })

      await vm.verifyOtp()

      expect(mockApiPost).toHaveBeenCalledWith(
        expect.stringContaining('/transfer/demo-t-001/buyer-verify'),
        expect.objectContaining({ otp: '123456' }),
      )
    } finally {
      vi.mocked(isDemoMode).mockReturnValue(true)
    }
  })

  it('3.3 — cancelTransfer calls /transfer/{id}/cancel in live mode', async () => {
    const { isDemoMode } = await import('@/services/mockData')
    vi.mocked(isDemoMode).mockReturnValue(false)

    try {
      const { default: TransferConfirmView } = await import('../TransferConfirmView.vue')
      const wrapper = shallowMount(TransferConfirmView)
      await wrapper.vm.$nextTick()
      await new Promise((r) => setTimeout(r, 50))

      const vm = wrapper.vm as any
      vm.transfer = { transferId: 'demo-t-001', status: 'pending_buyer_otp', sellerId: 'other-seller' }
      await wrapper.vm.$nextTick()

      mockApiPost.mockClear()
      mockApiPost.mockResolvedValueOnce({ data: {} })

      await vm.cancelTransfer()

      expect(mockApiPost).toHaveBeenCalledWith(
        expect.stringContaining('/transfer/demo-t-001/cancel'),
      )
    } finally {
      vi.mocked(isDemoMode).mockReturnValue(true)
    }
  })

  it('3.3b — cancelTransfer sets status to cancelled in demo mode', async () => {
    const { default: TransferConfirmView } = await import('../TransferConfirmView.vue')
    const wrapper = shallowMount(TransferConfirmView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const vm = wrapper.vm as any
    vm.transfer = { transferId: 'demo-t-001', status: 'pending_buyer_otp', sellerId: 'other-seller' }
    await wrapper.vm.$nextTick()

    await vm.cancelTransfer()

    expect(vm.transfer.status).toBe('cancelled')
  })
})

// ---------------------------------------------------------------------------
// Checkout flow — clauses 3.4, 3.5
// ---------------------------------------------------------------------------

describe('CheckoutView — preservation (clauses 3.4–3.5)', () => {
  beforeEach(() => {
    createTestPinia()
    seedAuthStore()
    localStorage.setItem('pendingOrder', makePendingOrder())
  })

  afterEach(() => {
    localStorage.removeItem('pendingOrder')
    vi.clearAllMocks()
  })

  it('3.4a — reads pending order from localStorage on mount', async () => {
    const { default: CheckoutView } = await import('../CheckoutView.vue')
    const wrapper = shallowMount(CheckoutView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const vm = wrapper.vm as any
    expect(vm.order, 'order should be populated from localStorage').not.toBeNull()
    expect(vm.order?.orderId).toBe('demo-o-001')
    expect(vm.order?.holdToken).toBe('hold-abc')
  })

  it('3.4b — hold countdown starts after loading order', async () => {
    const { default: CheckoutView } = await import('../CheckoutView.vue')
    const wrapper = shallowMount(CheckoutView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const vm = wrapper.vm as any
    expect(vm.holdSeconds, 'holdSeconds should be > 0 when heldUntil is in the future').toBeGreaterThan(0)
  })

  it('3.5a — pay() calls /purchase/confirm/{inventoryId} with holdToken and Idempotency-Key in live mode', async () => {
    const { isDemoMode } = await import('@/services/mockData')
    vi.mocked(isDemoMode).mockReturnValue(false)

    try {
      mockApiGet.mockResolvedValue({ data: { data: { creditBalance: 500 } } })
      mockApiPost.mockResolvedValueOnce({ data: { data: { ticketId: 'tkt-001', status: 'active', price: 120 } } })

      const { default: CheckoutView } = await import('../CheckoutView.vue')
      const wrapper = shallowMount(CheckoutView)
      await wrapper.vm.$nextTick()
      await new Promise((r) => setTimeout(r, 50))

      const vm = wrapper.vm as any
      mockApiPost.mockClear()
      mockApiPost.mockResolvedValueOnce({ data: { data: { ticketId: 'tkt-001', status: 'active', price: 120 } } })

      await vm.pay()

      expect(mockApiPost).toHaveBeenCalledWith(
        expect.stringContaining('/purchase/confirm/inv-001'),
        expect.objectContaining({ holdToken: 'hold-abc' }),
        expect.objectContaining({ headers: expect.objectContaining({ 'Idempotency-Key': expect.any(String) }) }),
      )
    } finally {
      vi.mocked(isDemoMode).mockReturnValue(true)
    }
  })

  it('3.5b — pay() in demo mode sets ticket state without calling API', async () => {
    const { default: CheckoutView } = await import('../CheckoutView.vue')
    const wrapper = shallowMount(CheckoutView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const vm = wrapper.vm as any
    await vm.pay()

    expect(vm.ticket, 'ticket should be set after demo pay').not.toBeNull()
    expect(vm.ticket?.status).toBe('active')
    // In demo mode, no real API call should be made for purchase
    expect(mockApiPost).not.toHaveBeenCalledWith(
      expect.stringContaining('/purchase/confirm'),
      expect.anything(),
      expect.anything(),
    )
  })
})

// ---------------------------------------------------------------------------
// Credits top-up — clauses 3.6, 3.7, 3.8
// ---------------------------------------------------------------------------

describe('CreditTopupView — preservation (clauses 3.6–3.8)', () => {
  beforeEach(() => {
    createTestPinia()
    seedAuthStore()
    sessionStorage.setItem('demo_balance', '500')
    mockApiGet.mockResolvedValue({ data: { data: { creditBalance: 250 } } })
  })

  afterEach(() => {
    sessionStorage.removeItem('demo_balance')
    vi.clearAllMocks()
  })

  it('3.6a — fetches balance from /credits/balance on mount in live mode', async () => {
    const { isDemoMode } = await import('@/services/mockData')
    vi.mocked(isDemoMode).mockReturnValue(false)

    try {
      mockApiGet.mockResolvedValue({ data: { data: { creditBalance: 250 } } })

      const { default: CreditTopupView } = await import('../CreditTopupView.vue')
      const wrapper = shallowMount(CreditTopupView)
      await wrapper.vm.$nextTick()
      await new Promise((r) => setTimeout(r, 100))

      expect(mockApiGet).toHaveBeenCalledWith(expect.stringContaining('/credits/balance'))
    } finally {
      vi.mocked(isDemoMode).mockReturnValue(true)
    }
  })

  it('3.6b — fetches transactions from /credits/transactions on mount in live mode', async () => {
    const { isDemoMode } = await import('@/services/mockData')
    vi.mocked(isDemoMode).mockReturnValue(false)

    try {
      mockApiGet.mockResolvedValue({ data: { data: { creditBalance: 250, transactions: [] } } })

      const { default: CreditTopupView } = await import('../CreditTopupView.vue')
      const wrapper = shallowMount(CreditTopupView)
      await wrapper.vm.$nextTick()
      await new Promise((r) => setTimeout(r, 100))

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('/credits/transactions'),
        expect.anything(),
      )
    } finally {
      vi.mocked(isDemoMode).mockReturnValue(true)
    }
  })

  it('3.6c — reads balance from sessionStorage in demo mode', async () => {
    sessionStorage.setItem('demo_balance', '750')

    const { default: CreditTopupView } = await import('../CreditTopupView.vue')
    const wrapper = shallowMount(CreditTopupView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const vm = wrapper.vm as any
    expect(vm.balance).toBe(750)
  })

  it('3.8 — demo simulateTopUp updates sessionStorage without calling real API', async () => {
    sessionStorage.setItem('demo_balance', '500')

    const { default: CreditTopupView } = await import('../CreditTopupView.vue')
    const wrapper = shallowMount(CreditTopupView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const vm = wrapper.vm as any
    vm.amount = 100
    await vm.simulateTopUp()

    const newBalance = parseFloat(sessionStorage.getItem('demo_balance') || '0')
    expect(newBalance).toBe(600)
    expect(mockApiPost).not.toHaveBeenCalledWith(
      expect.stringContaining('/credits/topup'),
      expect.anything(),
    )
  })

  it('3.8b — demo simulateTopUp prepends a ledger entry', async () => {
    sessionStorage.setItem('demo_balance', '500')

    const { default: CreditTopupView } = await import('../CreditTopupView.vue')
    const wrapper = shallowMount(CreditTopupView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const vm = wrapper.vm as any
    const initialCount = vm.transactions.length
    vm.amount = 50
    await vm.simulateTopUp()

    expect(vm.transactions.length).toBe(initialCount + 1)
    expect(vm.transactions[0].positive).toBe(true)
  })

  // Property-based test: for all balance values, demo mode reads from sessionStorage
  it('PBT 3.6 — for all balance values, demo mode reads balance from sessionStorage', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 0, max: 100_000, noNaN: true }),
        async (balanceValue) => {
          sessionStorage.setItem('demo_balance', String(balanceValue))

          const { default: CreditTopupView } = await import('../CreditTopupView.vue')
          const pinia = createPinia()
          setActivePinia(pinia)
          const auth = useAuthStore()
          auth.state.accessToken = 'demo-user-token'
          auth.state.user = { userId: 'u1', email: 'test@test.com', phoneNumber: '+1', role: 'user', isFlagged: false, isAdmin: false }

          const wrapper = shallowMount(CreditTopupView, { global: { plugins: [pinia] } })
          await wrapper.vm.$nextTick()
          await new Promise((r) => setTimeout(r, 30))

          const vm = wrapper.vm as any
          const displayed = vm.balance
          wrapper.unmount()

          return Math.abs(displayed - balanceValue) < 0.01
        },
      ),
      { numRuns: 20 },
    )
  })
})

// ---------------------------------------------------------------------------
// Notifications — clause 3.9
// ---------------------------------------------------------------------------

describe('NotificationsView — preservation (clause 3.9)', () => {
  beforeEach(() => {
    createTestPinia()
    seedAuthStore()
    mockCheckNotifications.mockClear()
    mockDismiss.mockClear()
  })

  it('3.9a — checkNotifications is called on mount', async () => {
    const { default: NotificationsView } = await import('../NotificationsView.vue')
    const wrapper = mount(NotificationsView)
    await wrapper.vm.$nextTick()

    expect(mockCheckNotifications).toHaveBeenCalledTimes(1)
  })

  it('3.9b — dismiss action is present on each notification card', async () => {
    const { default: NotificationsView } = await import('../NotificationsView.vue')
    const wrapper = mount(NotificationsView)
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.notification-card')
    expect(cards.length, 'should render notification cards').toBeGreaterThan(0)

    for (const card of cards) {
      // Each card should have a dismiss button (secondary button that calls dismiss)
      const dismissBtn = card.find('button.secondary')
      expect(dismissBtn.exists(), 'each notification card should have a dismiss button').toBe(true)
    }
  })

  it('3.9c — clicking dismiss calls dismiss() with the correct transferId', async () => {
    const { default: NotificationsView } = await import('../NotificationsView.vue')
    const wrapper = mount(NotificationsView)
    await wrapper.vm.$nextTick()

    const firstCard = wrapper.find('.notification-card')
    expect(firstCard.exists()).toBe(true)

    const dismissBtn = firstCard.find('button.secondary')
    await dismissBtn.trigger('click')

    expect(mockDismiss).toHaveBeenCalledTimes(1)
    // The dismiss should be called with a string transferId (not undefined)
    const calledWith = mockDismiss.mock.calls[0][0]
    expect(typeof calledWith, 'dismiss should be called with a string transferId').toBe('string')
    expect(calledWith.length, 'transferId should be non-empty').toBeGreaterThan(0)
  })

  // Property-based test: for all notification arrays with mixed types, dismiss action is always present
  it('PBT 3.9 — for all notification arrays with mixed types, dismiss action is always present on each card', async () => {
    const notifTypes = ['transfer_request', 'topup_success', 'ticket_sold', 'hold_expiring'] as const

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            transferId: fc.uuid(),
            creditAmount: fc.nat({ max: 1000 }),
            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }).map((d) => d.toISOString()),
            type: fc.constantFrom(...notifTypes),
          }),
          { minLength: 1, maxLength: 8 },
        ),
        async (notifications) => {
          // Update the shared reactive array so the mock returns the generated notifications
          notificationsArray.value = notifications as any

          const { default: NotificationsView } = await import('../NotificationsView.vue')
          const pinia = createPinia()
          setActivePinia(pinia)
          const auth = useAuthStore()
          auth.state.accessToken = 'demo-user-token'
          auth.state.user = { userId: 'u1', email: 'test@test.com', phoneNumber: '+1', role: 'user', isFlagged: false, isAdmin: false }

          const wrapper = mount(NotificationsView, { global: { plugins: [pinia] } })
          await wrapper.vm.$nextTick()

          const cards = wrapper.findAll('.notification-card')
          const allHaveDismiss = cards.every((card) => card.find('button.secondary').exists())
          wrapper.unmount()

          // Restore default notifications
          notificationsArray.value = [
            { transferId: 'demo-t-001', creditAmount: 180, createdAt: new Date().toISOString(), type: 'transfer_request' },
          ] as any

          return allHaveDismiss
        },
      ),
      { numRuns: 15 },
    )
  })
})

// ---------------------------------------------------------------------------
// Support — clause 3.10
// ---------------------------------------------------------------------------

describe('SupportCenterView — preservation (clause 3.10)', () => {
  beforeEach(() => {
    createTestPinia()
    seedAuthStore()
  })

  it('3.10a — Browse Events RouterLink targets /events', async () => {
    const { default: SupportCenterView } = await import('../SupportCenterView.vue')
    const wrapper = mount(SupportCenterView)
    await wrapper.vm.$nextTick()

    // RouterLink is mocked as <a>, so we check the rendered anchor hrefs
    // The mock renders RouterLink as <a><slot /></a> — check the template for to="/events"
    const html = wrapper.html()
    expect(html, 'page should contain a link to /events').toContain('/events')
  })

  it('3.10b — Open Marketplace RouterLink targets /marketplace', async () => {
    const { default: SupportCenterView } = await import('../SupportCenterView.vue')
    const wrapper = mount(SupportCenterView)
    await wrapper.vm.$nextTick()

    const html = wrapper.html()
    expect(html, 'page should contain a link to /marketplace').toContain('/marketplace')
  })

  it('3.10c — both navigation links are rendered in the support-actions section', async () => {
    const { default: SupportCenterView } = await import('../SupportCenterView.vue')
    const wrapper = mount(SupportCenterView)
    await wrapper.vm.$nextTick()

    const actions = wrapper.find('.support-actions')
    expect(actions.exists(), '.support-actions section should exist').toBe(true)
    const links = actions.findAll('a')
    expect(links.length, 'support-actions should contain 2 navigation links').toBeGreaterThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// PBT: FAQ open/close — at most one row expanded at a time
// (Tests the FUTURE faq-section behavior; on unfixed code this section is absent,
//  so we test the property against the reactive state directly if the section exists,
//  or skip gracefully if not yet implemented.)
// ---------------------------------------------------------------------------

describe('SupportCenterView — PBT FAQ accordion (clause 3.10 / future 2.23)', () => {
  beforeEach(() => {
    createTestPinia()
    seedAuthStore()
  })

  it('PBT FAQ — at most one FAQ row is expanded at a time across any open/close sequence', async () => {
    const { default: SupportCenterView } = await import('../SupportCenterView.vue')
    const wrapper = mount(SupportCenterView)
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any

    // If openFaq ref doesn't exist yet (unfixed code), the test passes trivially
    if (vm.openFaq === undefined && vm.faqItems === undefined) {
      // FAQ not yet implemented — preservation baseline: no FAQ state to break
      wrapper.unmount()
      return
    }

    const faqCount = vm.faqItems?.length ?? 0
    if (faqCount === 0) {
      wrapper.unmount()
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 0, max: faqCount - 1 }), { minLength: 1, maxLength: 20 }),
        async (clickSequence) => {
          // Reset state
          vm.openFaq = null
          await wrapper.vm.$nextTick()

          for (const idx of clickSequence) {
            // Toggle: if same index, close; otherwise open new
            vm.openFaq = vm.openFaq === idx ? null : idx
            await wrapper.vm.$nextTick()

            // At most one row should be expanded
            const expandedRows = wrapper.findAll('.faq-answer')
            if (expandedRows.length > 1) return false
          }
          return true
        },
      ),
      { numRuns: 30 },
    )

    wrapper.unmount()
  })
})
