import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '@/views/LandingPage.vue'
import EventListView from '@/views/app/EventListView.vue'
import EventDetailView from '@/views/app/EventDetailView.vue'
import LoginView from '@/views/app/LoginView.vue'
import RegisterView from '@/views/app/RegisterView.vue'
import VerifyView from '@/views/app/VerifyView.vue'
import SeatSelectionView from '@/views/app/SeatSelectionView.vue'
import CheckoutView from '@/views/app/CheckoutView.vue'
import MyTicketsView from '@/views/app/MyTicketsView.vue'
import TicketDetailView from '@/views/app/TicketDetailView.vue'
import TransferInitiateView from '@/views/app/TransferInitiateView.vue'
import TransferConfirmView from '@/views/app/TransferConfirmView.vue'
import CreditTopupView from '@/views/app/CreditTopupView.vue'
import ProfileView from '@/views/app/ProfileView.vue'
import MarketplaceView from '@/views/app/MarketplaceView.vue'
import AdminEventCreateView from '@/views/app/AdminEventCreateView.vue'
import AdminEventDashboardView from '@/views/app/AdminEventDashboardView.vue'
import DesignSystemView from '@/views/app/DesignSystemView.vue'
import NotFoundView from '@/views/app/NotFoundView.vue'
import InfoPageView from '@/views/app/InfoPageView.vue'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', component: LandingPage },
  { path: '/events', component: EventListView },
  { path: '/events/:eventId', component: EventDetailView },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/verify', component: VerifyView },
  { path: '/design', component: DesignSystemView },
  { path: '/about', component: InfoPageView, props: { title: 'About TicketRemaster', subtitle: 'Trusted ticketing with verified resale built in.', sections: [{ heading: 'Our mission', body: 'TicketRemaster helps fans access authentic tickets while giving organizers a secure resale marketplace.' }, { heading: 'What we do', body: 'We combine primary ticketing, verified resale, and organizer tooling in a single platform.' }] } },
  { path: '/careers', component: InfoPageView, props: { title: 'Careers', subtitle: 'Build the future of live events with us.', sections: [{ heading: 'Open roles', body: 'We are hiring across engineering, design, and operations. Reach out with your portfolio and role of interest.' }, { heading: 'Culture', body: 'We value customer trust, product craft, and reliable execution.' }] } },
  { path: '/help', component: InfoPageView, props: { title: 'Help Center', subtitle: 'Get support for buying, selling, and managing tickets.', sections: [{ heading: 'Buying tickets', body: 'Browse events, select seats, and check out securely using credits or card top-up.' }, { heading: 'Selling tickets', body: 'List verified tickets and manage resale offers with protected transfers.' }] } },
  { path: '/resale-guarantees', component: InfoPageView, props: { title: 'Resale Guarantees', subtitle: 'Every listing is verified for buyer confidence.', sections: [{ heading: 'Verified listings', body: 'Sellers must own the ticket before listing. Seats are validated at checkout.' }, { heading: 'Buyer protection', body: 'If a listing cannot be fulfilled, you receive a full refund or replacement ticket.' }] } },
  { path: '/terms', component: InfoPageView, props: { title: 'Terms of Service', subtitle: 'Guidelines for safe and fair use of TicketRemaster.', sections: [{ heading: 'Usage policy', body: 'Use the platform responsibly and comply with all event policies.' }, { heading: 'Payments', body: 'All transactions are processed securely and subject to verification checks.' }] } },
  { path: '/privacy', component: InfoPageView, props: { title: 'Privacy Policy', subtitle: 'We protect your personal data and ticket history.', sections: [{ heading: 'Data collection', body: 'We collect account and transaction data needed to deliver ticketing services.' }, { heading: 'Data security', body: 'We use encryption and access controls to safeguard your information.' }] } },
  { path: '/venues', component: InfoPageView, props: { title: 'Venues', subtitle: 'Explore venues powered by TicketRemaster.', sections: [{ heading: 'Venue profiles', body: 'Each venue includes seating maps, amenities, and accessibility details.' }, { heading: 'Partner venues', body: 'We work with trusted partners across global cities.' }] } },
  { path: '/events/:eventId/seats', component: SeatSelectionView, meta: { requiresAuth: true } },
  { path: '/checkout/:orderId', component: CheckoutView, meta: { requiresAuth: true } },
  { path: '/tickets', component: MyTicketsView, meta: { requiresAuth: true } },
  { path: '/tickets/:seatId', component: TicketDetailView, meta: { requiresAuth: true } },
  { path: '/tickets/:seatId/transfer', component: TransferInitiateView, meta: { requiresAuth: true } },
  { path: '/transfer/:transferId', component: TransferConfirmView, meta: { requiresAuth: true } },
  { path: '/credits/topup', component: CreditTopupView, meta: { requiresAuth: true } },
  { path: '/profile', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/marketplace', component: MarketplaceView },
  { path: '/admin/events/new', component: AdminEventCreateView, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/events/:eventId/dashboard', component: AdminEventDashboardView, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/:pathMatch(.*)*', component: NotFoundView },
]

const router = createRouter({ history: createWebHistory(), routes })

// Enforce auth and admin access rules before navigation
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn.value) return '/login'
  if (to.meta.requiresAdmin && !auth.isAdmin.value) return '/events'
  return true
})

export default router
