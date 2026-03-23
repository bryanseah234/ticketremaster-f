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
import ResaleGuaranteesView from '@/views/app/ResaleGuaranteesView.vue'
import VenuesView from '@/views/app/VenuesView.vue'
import StaffScannerView from '@/views/app/StaffScannerView.vue'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', component: LandingPage },
  { path: '/events', component: EventListView },
  { path: '/events/:eventId', component: EventDetailView },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/verify', component: VerifyView },
  { path: '/design', component: DesignSystemView },
  { path: '/about', component: InfoPageView, props: { title: 'About TicketRemaster', subtitle: 'Trusted ticketing with verified resale built in.', sections: [{ heading: 'Our mission', body: 'TicketRemaster helps fans access authentic tickets while giving organizers a secure resale marketplace.' }, { heading: 'What we do', body: 'We combine primary ticketing, verified resale, and organizer tooling in a single platform.' }, { heading: 'Why it matters', body: 'Fans get real tickets, organizers get control, and resellers operate in a transparent system.' }, { heading: 'Built for scale', body: 'We serve venues and festivals across cities with reliable infrastructure and support.' }] } },
  { path: '/careers', component: InfoPageView, props: { title: 'Careers', subtitle: 'Build the future of live events with us.', sections: [{ heading: 'Open roles', body: 'We are hiring across engineering, design, and operations. Reach out with your portfolio and role of interest.' }, { heading: 'Culture', body: 'We value customer trust, product craft, and reliable execution.' }, { heading: 'Benefits', body: 'Flexible work, learning budgets, and team retreats built around live experiences.' }, { heading: 'How we hire', body: 'Transparent process with clear expectations and quick feedback at every stage.' }] } },
  { path: '/help', component: InfoPageView, props: { title: 'Help Center', subtitle: 'Get support for buying, selling, and managing tickets.', sections: [{ heading: 'Buying tickets', body: 'Browse events, select seats, and check out securely using credits or card top-up.' }, { heading: 'Selling tickets', body: 'List verified tickets and manage resale offers with protected transfers.' }, { heading: 'Account access', body: 'Use your email and phone to sign in, verify, and manage ticket ownership.' }, { heading: 'Payments and refunds', body: 'We process secure payments and issue fast refunds if a listing cannot be fulfilled.' }] } },
  { path: '/resale-guarantees', component: ResaleGuaranteesView },
  { path: '/terms', component: InfoPageView, props: { title: 'Terms of Service', subtitle: 'Guidelines for safe and fair use of TicketRemaster.', sections: [{ heading: 'Usage policy', body: 'Use the platform responsibly and comply with all event policies.' }, { heading: 'Payments', body: 'All transactions are processed securely and subject to verification checks.' }, { heading: 'Resale rules', body: 'Listings must reflect owned seats and comply with local resale regulations.' }, { heading: 'Account responsibilities', body: 'Keep your credentials secure and report suspicious activity immediately.' }] } },
  { path: '/privacy', component: InfoPageView, props: { title: 'Privacy Policy', subtitle: 'We protect your personal data and ticket history.', sections: [{ heading: 'Data collection', body: 'We collect account and transaction data needed to deliver ticketing services.' }, { heading: 'Data security', body: 'We use encryption and access controls to safeguard your information.' }, { heading: 'Data sharing', body: 'We only share data with venues and partners required to fulfill ticketing services.' }, { heading: 'Your choices', body: 'You can request access, updates, or deletion of your data at any time.' }] } },
  { path: '/venues', component: VenuesView },
  { path: '/events/:eventId/seats', component: SeatSelectionView, meta: { requiresAuth: true } },
  { path: '/checkout/:orderId', component: CheckoutView, meta: { requiresAuth: true } },
  { path: '/tickets', component: MyTicketsView, meta: { requiresAuth: true } },
  { path: '/tickets/:seatId', component: TicketDetailView, meta: { requiresAuth: true } },
  { path: '/tickets/:seatId/transfer', component: TransferInitiateView, meta: { requiresAuth: true } },
  { path: '/transfer/:transferId', component: TransferConfirmView }, // meta: { requiresAuth: true }
  { path: '/credits/topup', component: CreditTopupView, meta: { requiresAuth: true } },
  { path: '/profile', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/marketplace', component: MarketplaceView },
  { path: '/staff/scan', component: StaffScannerView, meta: { requiresAuth: true, requiresStaff: true } },
  { path: '/admin/events/new', component: AdminEventCreateView, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/events/:eventId/dashboard', component: AdminEventDashboardView, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/:pathMatch(.*)*', component: NotFoundView },
]

const router = createRouter({ history: createWebHistory(), routes })

// Enforce auth and admin access rules before navigation
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
  if (to.meta.requiresAdmin && !auth.isAdmin) return '/events'
  if (to.meta.requiresStaff && !auth.isStaff) return '/events'
  return true
})

export default router
