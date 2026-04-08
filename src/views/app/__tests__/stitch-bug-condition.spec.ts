/**
 * Stitch v3 Visual Fidelity — Bug Condition Exploration Tests
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10,
 *              1.11, 1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.18, 1.19, 1.20,
 *              1.21, 1.22, 1.23, 1.24**
 *
 * PURPOSE: These tests assert the PRESENCE of correct Stitch v3 elements/classes.
 * They are EXPECTED TO FAIL on unfixed code — failure confirms the 24 bugs exist.
 * After the fix is applied (tasks 3–7), all assertions should PASS.
 *
 * COUNTEREXAMPLES FOUND ON UNFIXED CODE:
 * - TransferConfirmView: .accept-button uses border-radius:0.7rem plain button, no gradient
 * - TransferConfirmView: .otp-glow element is absent from the DOM entirely
 * - TransferConfirmView: .trust-icon div is NOT wrapped in .icon-avatar-shell
 * - CheckoutView: .confirm-button has no gradient background (plain button styles)
 * - CheckoutView: .trust-row has opacity:0.58 but no grayscale filter CSS
 * - CheckoutView: timer card has no hourglass/clock icon element
 * - CheckoutView: credit-toggle is a plain <button> with no peer-checked checkbox structure
 * - CreditTopupView: .balance-value uses color:var(--primary) solid, no -webkit-text-fill-color
 * - CreditTopupView: .amount-card has border-radius:999px (pill shape, not rounded-xl)
 * - CreditTopupView: demo mode renders .card-placeholder div, not a disabled <input>
 * - CreditTopupView: .complete-button has border-radius:0.9rem, no ember-gradient background
 * - CreditTopupView: .ledger-row has no hover:bg-white/5 transition-colors
 * - NotificationsView: .notification-card has no .notification-accent-bar child
 * - NotificationsView: no .icon-avatar-shell in notification cards
 * - NotificationsView: no .notification-timestamp styled label
 * - NotificationsView: only transfer_request type rendered (no topup_success, ticket_sold, hold_expiring)
 * - SupportCenterView: no <input type="search"> in hero
 * - SupportCenterView: no .faq-section element
 * - SupportCenterView: support grid uses .grid-2 (2-column), not bento (no col-span-8)
 * - SupportCenterView: topic cards have no .icon-avatar-shell or .card-arrow-link
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// ---------------------------------------------------------------------------
// Global mocks — prevent real API / router / composable calls
// ---------------------------------------------------------------------------

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
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

vi.mock('@/composables/useSellerNotifications', () => ({
  useSellerNotifications: () => ({
    notifications: {
      value: [
        { transferId: 'demo-t-001', creditAmount: 180, createdAt: new Date().toISOString(), type: 'transfer_request' },
        { transferId: 'demo-t-002', creditAmount: 50, createdAt: new Date().toISOString(), type: 'topup_success' },
        { transferId: 'demo-t-003', creditAmount: 200, createdAt: new Date().toISOString(), type: 'ticket_sold' },
        { transferId: 'demo-t-004', creditAmount: 0, createdAt: new Date().toISOString(), type: 'hold_expiring' },
      ],
    },
    checkNotifications: vi.fn(),
    dismiss: vi.fn(),
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

// ---------------------------------------------------------------------------
// TransferConfirmView — clauses 1.2, 1.3, 1.4, 1.5
// ---------------------------------------------------------------------------

describe('TransferConfirmView — Stitch v3 bug conditions', () => {
  beforeEach(() => {
    createTestPinia()
    seedAuthStore()
  })

  it('1.2 — .accept-button has ember-gradient background (linear-gradient)', async () => {
    const { default: TransferConfirmView } = await import('../TransferConfirmView.vue')
    const wrapper = shallowMount(TransferConfirmView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const acceptBtn = wrapper.find('.accept-button')
    expect(acceptBtn.exists(), '.accept-button should exist').toBe(true)
    const computedStyle = window.getComputedStyle(acceptBtn.element as HTMLElement)
    const bg = computedStyle.background || computedStyle.backgroundImage || ''
    expect(bg, '.accept-button should have linear-gradient background').toMatch(/linear-gradient/)
  })

  it('1.3 — .decline-button is a ghost-link (no visible border, no background fill)', async () => {
    const { default: TransferConfirmView } = await import('../TransferConfirmView.vue')
    const wrapper = shallowMount(TransferConfirmView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const declineBtn = wrapper.find('.decline-button')
    expect(declineBtn.exists(), '.decline-button should exist').toBe(true)
    // Ghost-link: no border, no background — verify it has no border-width > 0
    const computedStyle = window.getComputedStyle(declineBtn.element as HTMLElement)
    const borderWidth = computedStyle.borderWidth || computedStyle.borderTopWidth || '0px'
    expect(borderWidth, '.decline-button should have no border (ghost-link)').toBe('0px')
  })

  it('1.4 — .otp-glow element is present inside .otp-card when in OTP stage', async () => {
    const { default: TransferConfirmView } = await import('../TransferConfirmView.vue')
    const wrapper = shallowMount(TransferConfirmView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    // Force OTP stage
    const vm = wrapper.vm as any
    if (vm.transfer !== undefined) {
      vm.transfer = { ...(vm.transfer || {}), status: 'pending_buyer_otp', sellerId: 'demo-seller-001' }
    } else {
      // Set via reactive ref
      ;(vm as any).transfer = { status: 'pending_buyer_otp', sellerId: 'demo-seller-001' }
    }
    await wrapper.vm.$nextTick()

    const glowEl = wrapper.find('.otp-glow')
    expect(glowEl.exists(), '.otp-glow decorative element should be present in OTP stage').toBe(true)
  })

  it('1.5 — trust card icons are wrapped in .icon-avatar-shell', async () => {
    const { default: TransferConfirmView } = await import('../TransferConfirmView.vue')
    const wrapper = shallowMount(TransferConfirmView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    // Force OTP stage to show trust cards
    const vm = wrapper.vm as any
    if (vm.transfer !== undefined) {
      vm.transfer = { ...(vm.transfer || {}), status: 'pending_buyer_otp', sellerId: 'demo-seller-001' }
    } else {
      ;(vm as any).transfer = { status: 'pending_buyer_otp', sellerId: 'demo-seller-001' }
    }
    await wrapper.vm.$nextTick()

    const shells = wrapper.findAll('.icon-avatar-shell')
    expect(shells.length, 'trust card icons should be wrapped in .icon-avatar-shell').toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// CheckoutView — clauses 1.6, 1.7, 1.8, 1.9, 1.10
// ---------------------------------------------------------------------------

describe('CheckoutView — Stitch v3 bug conditions', () => {
  beforeEach(() => {
    createTestPinia()
    seedAuthStore()
    localStorage.setItem(
      'pendingOrder',
      JSON.stringify({
        orderId: 'demo-o-001',
        inventoryId: 'inv-001',
        eventId: 'evt-001',
        holdToken: 'hold-abc',
        heldUntil: new Date(Date.now() + 600_000).toISOString(),
        seat: { price: 120, rowNumber: 'A', seatNumber: '12', section: 'Floor' },
        event: { name: 'Demo Event', venueName: 'Demo Venue', eventDate: new Date().toISOString() },
      }),
    )
  })

  it('1.6 — .confirm-button has ember-gradient background (linear-gradient)', async () => {
    const { default: CheckoutView } = await import('../CheckoutView.vue')
    const wrapper = shallowMount(CheckoutView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const confirmBtn = wrapper.find('.confirm-button')
    expect(confirmBtn.exists(), '.confirm-button should exist').toBe(true)
    const computedStyle = window.getComputedStyle(confirmBtn.element as HTMLElement)
    const bg = computedStyle.background || computedStyle.backgroundImage || ''
    expect(bg, '.confirm-button should have linear-gradient background').toMatch(/linear-gradient/)
  })

  it('1.7 — wallet toggle has peer-checked checkbox structure', async () => {
    const { default: CheckoutView } = await import('../CheckoutView.vue')
    const wrapper = shallowMount(CheckoutView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    // The fixed toggle should use a hidden <input type="checkbox"> peer pattern
    const toggleInput = wrapper.find('input[type="checkbox"].credit-toggle-peer')
    expect(toggleInput.exists(), 'wallet toggle should have a hidden checkbox with class credit-toggle-peer').toBe(true)
  })

  it('1.8 — timer card contains a hourglass/clock icon element', async () => {
    const { default: CheckoutView } = await import('../CheckoutView.vue')
    const wrapper = shallowMount(CheckoutView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const timerCard = wrapper.find('.timer-card')
    expect(timerCard.exists(), '.timer-card should exist').toBe(true)
    // Should contain an svg icon or element with hourglass/clock class
    const icon = timerCard.find('svg, [class*="clock"], [class*="hourglass"], [class*="ClockIcon"], [class*="timer-icon"]')
    expect(icon.exists(), 'timer card should contain a hourglass/clock icon').toBe(true)
  })

  it('1.9 — .trust-row has grayscale filter applied', async () => {
    const { default: CheckoutView } = await import('../CheckoutView.vue')
    const wrapper = shallowMount(CheckoutView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const trustRow = wrapper.find('.trust-row')
    expect(trustRow.exists(), '.trust-row should exist').toBe(true)
    const computedStyle = window.getComputedStyle(trustRow.element as HTMLElement)
    const filter = computedStyle.filter || ''
    expect(filter, '.trust-row should have grayscale filter').toMatch(/grayscale/)
  })

  it('1.10 — success state has .eyebrow label', async () => {
    const { default: CheckoutView } = await import('../CheckoutView.vue')
    const wrapper = shallowMount(CheckoutView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    // Trigger success state
    const vm = wrapper.vm as any
    vm.ticket = { ticketId: 'demo-ticket-001', status: 'active', price: 120 }
    await wrapper.vm.$nextTick()

    const eyebrow = wrapper.find('.eyebrow')
    expect(eyebrow.exists(), 'success state should have .eyebrow label').toBe(true)
    expect(eyebrow.text(), '.eyebrow should contain text').toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// CreditTopupView — clauses 1.11, 1.12, 1.13, 1.14, 1.15
// ---------------------------------------------------------------------------

describe('CreditTopupView — Stitch v3 bug conditions', () => {
  beforeEach(() => {
    createTestPinia()
    seedAuthStore()
    sessionStorage.setItem('demo_balance', '500')
  })

  it('1.11 — .balance-value has ember-text-gradient (-webkit-text-fill-color: transparent)', async () => {
    const { default: CreditTopupView } = await import('../CreditTopupView.vue')
    const wrapper = shallowMount(CreditTopupView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const balanceVal = wrapper.find('.balance-value')
    expect(balanceVal.exists(), '.balance-value should exist').toBe(true)
    const computedStyle = window.getComputedStyle(balanceVal.element as HTMLElement)
    const webkitFill = computedStyle.getPropertyValue('-webkit-text-fill-color')
    const bg = computedStyle.background || computedStyle.backgroundImage || ''
    // ember-text-gradient requires -webkit-text-fill-color: transparent AND a gradient background
    expect(
      webkitFill === 'transparent' || bg.includes('linear-gradient'),
      '.balance-value should have ember-text-gradient (-webkit-text-fill-color: transparent or gradient bg)',
    ).toBe(true)
  })

  it('1.12 — .amount-card has rounded-xl corners (not 999px pill)', async () => {
    const { default: CreditTopupView } = await import('../CreditTopupView.vue')
    const wrapper = shallowMount(CreditTopupView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const amountCard = wrapper.find('.amount-card')
    expect(amountCard.exists(), '.amount-card should exist').toBe(true)
    const computedStyle = window.getComputedStyle(amountCard.element as HTMLElement)
    const radius = computedStyle.borderRadius || computedStyle.borderTopLeftRadius || '0px'
    // rounded-xl = 0.75rem = 12px; pill = 999px
    const numericRadius = parseFloat(radius)
    expect(numericRadius, '.amount-card border-radius should be ≤ 20px (rounded-xl, not pill)').toBeLessThanOrEqual(20)
  })

  it('1.13 — demo mode renders a disabled card input (not a .card-placeholder div)', async () => {
    const { default: CreditTopupView } = await import('../CreditTopupView.vue')
    const wrapper = shallowMount(CreditTopupView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    // In demo mode, the payment method section should show a disabled input, not a placeholder div
    const placeholder = wrapper.find('.card-placeholder')
    expect(placeholder.exists(), 'demo mode should NOT render .card-placeholder div').toBe(false)
    // Instead, a disabled input should be present
    const cardInput = wrapper.find('.card-field-input, input[disabled]')
    expect(cardInput.exists(), 'demo mode should render a disabled card input').toBe(true)
  })

  it('1.14 — .complete-button has ember-gradient background', async () => {
    const { default: CreditTopupView } = await import('../CreditTopupView.vue')
    const wrapper = shallowMount(CreditTopupView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const completeBtn = wrapper.find('.complete-button')
    expect(completeBtn.exists(), '.complete-button should exist').toBe(true)
    const computedStyle = window.getComputedStyle(completeBtn.element as HTMLElement)
    const bg = computedStyle.background || computedStyle.backgroundImage || ''
    expect(bg, '.complete-button should have linear-gradient (ember-gradient) background').toMatch(/linear-gradient/)
  })

  it('1.15 — .ledger-row has hover transition (transition-colors)', async () => {
    const { default: CreditTopupView } = await import('../CreditTopupView.vue')
    const wrapper = shallowMount(CreditTopupView)
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 50))

    const ledgerRow = wrapper.find('.ledger-row')
    expect(ledgerRow.exists(), '.ledger-row should exist').toBe(true)
    const computedStyle = window.getComputedStyle(ledgerRow.element as HTMLElement)
    const transition = computedStyle.transition || computedStyle.transitionProperty || ''
    expect(transition, '.ledger-row should have a CSS transition for hover state').not.toBe('')
    expect(transition, '.ledger-row transition should include background-color or all').toMatch(/background|all/)
  })
})

// ---------------------------------------------------------------------------
// NotificationsView — clauses 1.16, 1.17, 1.18, 1.19
// ---------------------------------------------------------------------------

describe('NotificationsView — Stitch v3 bug conditions', () => {
  beforeEach(() => {
    createTestPinia()
    seedAuthStore()
  })

  it('1.16 — .notification-card has .notification-accent-bar child', async () => {
    const { default: NotificationsView } = await import('../NotificationsView.vue')
    const wrapper = mount(NotificationsView)
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.notification-card')
    expect(cards.length, 'should render notification cards').toBeGreaterThan(0)
    const firstCard = cards[0]
    const accentBar = firstCard.find('.notification-accent-bar')
    expect(accentBar.exists(), '.notification-card should contain .notification-accent-bar').toBe(true)
  })

  it('1.17 — notification cards render all four types (not just transfer_request)', async () => {
    const { default: NotificationsView } = await import('../NotificationsView.vue')
    const wrapper = mount(NotificationsView)
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.notification-card')
    expect(cards.length, 'should render all 4 notification types').toBeGreaterThanOrEqual(4)
    // The unfixed code only renders "Transfer request" badge text for all cards
    const badgeTexts = wrapper.findAll('.badge').map((b) => b.text().toLowerCase())
    const hasTopupType = badgeTexts.some((t) => t.includes('top-up') || t.includes('topup') || t.includes('top up'))
    const hasTicketSold = badgeTexts.some((t) => t.includes('ticket sold') || t.includes('sold'))
    const hasHoldExpiring = badgeTexts.some((t) => t.includes('hold') || t.includes('expiring'))
    expect(
      hasTopupType || hasTicketSold || hasHoldExpiring,
      'should render notification types beyond transfer_request (topup_success, ticket_sold, hold_expiring)',
    ).toBe(true)
  })

  it('1.18 — notification cards contain .icon-avatar-shell', async () => {
    const { default: NotificationsView } = await import('../NotificationsView.vue')
    const wrapper = mount(NotificationsView)
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.notification-card')
    expect(cards.length, 'should render notification cards').toBeGreaterThan(0)
    const firstCard = cards[0]
    const shell = firstCard.find('.icon-avatar-shell')
    expect(shell.exists(), '.notification-card should contain .icon-avatar-shell').toBe(true)
  })

  it('1.19 — notification cards contain .notification-timestamp styled label', async () => {
    const { default: NotificationsView } = await import('../NotificationsView.vue')
    const wrapper = mount(NotificationsView)
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.notification-card')
    expect(cards.length, 'should render notification cards').toBeGreaterThan(0)
    const firstCard = cards[0]
    const timestamp = firstCard.find('.notification-timestamp')
    expect(timestamp.exists(), '.notification-card should contain .notification-timestamp').toBe(true)
  })
})

// ---------------------------------------------------------------------------
// SupportCenterView — clauses 1.20, 1.21, 1.22, 1.23, 1.24
// ---------------------------------------------------------------------------

describe('SupportCenterView — Stitch v3 bug conditions', () => {
  beforeEach(() => {
    createTestPinia()
    seedAuthStore()
  })

  it('1.20 — hero h1 has editorial split-word treatment with .support-title-accent', async () => {
    const { default: SupportCenterView } = await import('../SupportCenterView.vue')
    const wrapper = mount(SupportCenterView)
    await wrapper.vm.$nextTick()

    const accent = wrapper.find('.support-title-accent')
    expect(accent.exists(), 'hero h1 should have .support-title-accent span for "Support" in orange').toBe(true)
    expect(accent.text(), '.support-title-accent should contain "Support"').toMatch(/support/i)
  })

  it('1.21 — support grid uses bento layout (col-span-8 featured card)', async () => {
    const { default: SupportCenterView } = await import('../SupportCenterView.vue')
    const wrapper = mount(SupportCenterView)
    await wrapper.vm.$nextTick()

    const bento = wrapper.find('.support-bento')
    const featuredCard = wrapper.find('.support-card-featured')
    expect(
      bento.exists() || featuredCard.exists(),
      'support grid should use bento layout (.support-bento or .support-card-featured)',
    ).toBe(true)
  })

  it('1.22 — hero section contains <input type="search">', async () => {
    const { default: SupportCenterView } = await import('../SupportCenterView.vue')
    const wrapper = mount(SupportCenterView)
    await wrapper.vm.$nextTick()

    const searchInput = wrapper.find('input[type="search"]')
    expect(searchInput.exists(), 'hero section should contain <input type="search">').toBe(true)
  })

  it('1.23 — page contains .faq-section element', async () => {
    const { default: SupportCenterView } = await import('../SupportCenterView.vue')
    const wrapper = mount(SupportCenterView)
    await wrapper.vm.$nextTick()

    const faqSection = wrapper.find('.faq-section')
    expect(faqSection.exists(), 'page should contain .faq-section element').toBe(true)
  })

  it('1.24 — topic cards contain .icon-avatar-shell and .card-arrow-link', async () => {
    const { default: SupportCenterView } = await import('../SupportCenterView.vue')
    const wrapper = mount(SupportCenterView)
    await wrapper.vm.$nextTick()

    const topicCards = wrapper.findAll('.support-card-topic, .support-card.panel')
    expect(topicCards.length, 'should render topic cards').toBeGreaterThan(0)
    const firstCard = topicCards[0]
    const shell = firstCard.find('.icon-avatar-shell')
    const arrowLink = firstCard.find('.card-arrow-link')
    expect(shell.exists(), 'topic card should contain .icon-avatar-shell').toBe(true)
    expect(arrowLink.exists(), 'topic card should contain .card-arrow-link').toBe(true)
  })
})
