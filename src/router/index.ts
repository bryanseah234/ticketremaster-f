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
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', component: LandingPage },
  { path: '/events', component: EventListView },
  { path: '/events/:eventId', component: EventDetailView },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/verify', component: VerifyView },
  { path: '/design', component: DesignSystemView },
  { path: '/events/:eventId/seats', component: SeatSelectionView, meta: { requiresAuth: true } },
  { path: '/checkout/:orderId', component: CheckoutView, meta: { requiresAuth: true } },
  { path: '/tickets', component: MyTicketsView, meta: { requiresAuth: true } },
  { path: '/tickets/:seatId', component: TicketDetailView, meta: { requiresAuth: true } },
  { path: '/tickets/:seatId/transfer', component: TransferInitiateView, meta: { requiresAuth: true } },
  { path: '/transfer/:transferId', component: TransferConfirmView, meta: { requiresAuth: true } },
  { path: '/credits/topup', component: CreditTopupView, meta: { requiresAuth: true } },
  { path: '/profile', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/marketplace', component: MarketplaceView, meta: { requiresAuth: true } },
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
