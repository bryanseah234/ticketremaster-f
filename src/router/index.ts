import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

interface RouteMeta {
  requiresAuth?: boolean
  requiresAdmin?: boolean
  requiresStaff?: boolean
  title?: string
  subtitle?: string
  sections?: Array<{ heading: string; body: string }>
  props?: {
    title: string
    subtitle: string
    sections: Array<{ heading: string; body: string }>
  }
  [key: string]: unknown
  [key: symbol]: unknown
}

const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('@/views/LandingPage.vue') },
  { path: '/events', component: () => import('@/views/app/EventListView.vue') },
  { path: '/events/:eventId', component: () => import('@/views/app/EventDetailView.vue') },
  { path: '/login', component: () => import('@/views/app/LoginView.vue') },
  { path: '/demo-login', component: () => import('@/views/app/DemoLoginView.vue') },
  { path: '/register', component: () => import('@/views/app/RegisterView.vue') },
  { path: '/verify', component: () => import('@/views/app/VerifyView.vue') },
  { path: '/design', component: () => import('@/views/app/DesignSystemView.vue') },
  {
    path: '/about',
    component: () => import('@/views/app/InfoPageView.vue'),
    props: {
      title: 'About TicketRemaster',
      subtitle:
        'Trusted ticketing with verified resale built in.',
      sections: [
        {
          heading: 'Our mission',
          body: 'TicketRemaster helps fans access authentic tickets while giving organizers a secure resale marketplace.',
        },
        {
          heading: 'What we do',
          body: 'We combine primary ticketing, verified resale, and organizer tooling in a single platform.',
        },
        {
          heading: 'Why it matters',
          body: 'Fans get real tickets, organizers get control, and resellers operate in a transparent system.',
        },
        {
          heading: 'Built for scale',
          body: 'We serve venues and festivals across cities with reliable infrastructure and support.',
        },
      ],
    },
  },
  {
    path: '/careers',
    component: () => import('@/views/app/InfoPageView.vue'),
    props: {
      title: 'Careers',
      subtitle: 'Build the future of live events with us.',
      sections: [
        {
          heading: 'Open roles',
          body: 'We are hiring across engineering, design, and operations. Reach out with your portfolio and role of interest.',
        },
        {
          heading: 'Culture',
          body: 'We value customer trust, product craft, and reliable execution.',
        },
        {
          heading: 'Benefits',
          body: 'Flexible work, learning budgets, and team retreats built around live experiences.',
        },
        {
          heading: 'How we hire',
          body: 'Transparent process with clear expectations and quick feedback at every stage.',
        },
      ],
    },
  },
  {
    path: '/help',
    component: () => import('@/views/app/InfoPageView.vue'),
    props: {
      title: 'Help Center',
      subtitle:
        'Get support for buying, selling, and managing tickets.',
      sections: [
        {
          heading: 'Buying tickets',
          body: 'Browse events, select seats, and check out securely using credits or card top-up.',
        },
        {
          heading: 'Selling tickets',
          body: 'List verified tickets and manage resale offers with protected transfers.',
        },
        {
          heading: 'Account access',
          body: 'Use your email and phone to sign in, verify, and manage ticket ownership.',
        },
        {
          heading: 'Payments and refunds',
          body: 'We process secure payments and issue fast refunds if a listing cannot be fulfilled.',
        },
      ],
    },
  },
  { path: '/resale-guarantees', component: () => import('@/views/app/ResaleGuaranteesView.vue') },
  {
    path: '/terms',
    component: () => import('@/views/app/InfoPageView.vue'),
    props: {
      title: 'Terms of Service',
      subtitle: 'Guidelines for safe and fair use of TicketRemaster.',
      sections: [
        {
          heading: 'Usage policy',
          body: 'Use the platform responsibly and comply with all event policies.',
        },
        {
          heading: 'Payments',
          body: 'All transactions are processed securely and subject to verification checks.',
        },
        {
          heading: 'Resale rules',
          body: 'Listings must reflect owned seats and comply with local resale regulations.',
        },
        {
          heading: 'Account responsibilities',
          body: 'Keep your credentials secure and report suspicious activity immediately.',
        },
      ],
    },
  },
  {
    path: '/privacy',
    component: () => import('@/views/app/InfoPageView.vue'),
    props: {
      title: 'Privacy Policy',
      subtitle: 'We protect your personal data and ticket history.',
      sections: [
        {
          heading: 'Data collection',
          body: 'We collect account and transaction data needed to deliver ticketing services.',
        },
        {
          heading: 'Data security',
          body: 'We use encryption and access controls to safeguard your information.',
        },
        {
          heading: 'Data sharing',
          body: 'We only share data with venues and partners required to fulfill ticketing services.',
        },
        {
          heading: 'Your choices',
          body: 'You can request access, updates, or deletion of your data at any time.',
        },
      ],
    },
  },
  { path: '/venues', component: () => import('@/views/app/VenuesView.vue') },
  {
    path: '/events/:eventId/seats',
    component: () => import('@/views/app/SeatSelectionView.vue'),
    meta: { requiresAuth: true } as RouteMeta,
  },
  {
    path: '/checkout/:orderId',
    component: () => import('@/views/app/CheckoutView.vue'),
    meta: { requiresAuth: true } as RouteMeta,
  },
  {
    path: '/tickets',
    component: () => import('@/views/app/MyTicketsView.vue'),
    meta: { requiresAuth: true } as RouteMeta,
  },
  {
    path: '/tickets/:ticketId',
    component: () => import('@/views/app/TicketDetailView.vue'),
    meta: { requiresAuth: true } as RouteMeta,
  },
  {
    path: '/transfer/initiate',
    component: () => import('@/views/app/TransferInitiateView.vue'),
    meta: { requiresAuth: true } as RouteMeta,
  },
  {
    path: '/transfer/:transferId',
    component: () => import('@/views/app/TransferConfirmView.vue'),
  },
  {
    path: '/credits/topup',
    component: () => import('@/views/app/CreditTopupView.vue'),
    meta: { requiresAuth: true } as RouteMeta,
  },
  {
    path: '/profile',
    component: () => import('@/views/app/ProfileView.vue'),
    meta: { requiresAuth: true } as RouteMeta,
  },
  { path: '/marketplace', component: () => import('@/views/app/MarketplaceView.vue') },
  { path: '/ticket-qr/:qrHash', component: () => import('@/views/app/TicketQrView.vue') },
  {
    path: '/staff/scan',
    component: () => import('@/views/app/StaffScannerView.vue'),
    meta: { requiresAuth: true, requiresStaff: true } as RouteMeta,
  },
  {
    path: '/admin/events/new',
    component: () => import('@/views/app/AdminEventCreateView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true } as RouteMeta,
  },
  {
    path: '/admin/events/:eventId/dashboard',
    component: () => import('@/views/app/AdminEventDashboardView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true } as RouteMeta,
  },
  {
    path: '/admin/users',
    component: () => import('@/views/app/AdminUserManagementView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true } as RouteMeta,
  },
  { path: '/:pathMatch(.*)*', component: () => import('@/views/app/NotFoundView.vue') },
]

const router = createRouter({ history: createWebHistory(), routes })

// Enforce auth and admin access rules before navigation
router.beforeEach((to) => {
  const auth = useAuthStore()
  const meta = to.meta as RouteMeta
  if (meta.requiresAuth && !auth.isLoggedIn) return '/login'
  if (meta.requiresAdmin && !auth.isAdmin) return '/events'
  if (meta.requiresStaff && !auth.isStaff) return '/events'
  return true
})

export default router
