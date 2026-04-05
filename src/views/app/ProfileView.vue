<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { isDemoMode } from '@/services/mockData'
import ProfileField from '@/components/ui/ProfileField.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const auth = useAuthStore()
const router = useRouter()

const balance = ref<number | null>(null)
const profile = ref<Record<string, unknown> | null>(null)
const transactions = ref<any[]>([])
const loadingTxns = ref(false)

const displayUser = computed(() => profile.value || auth.state.user)

function relativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) return '—'
  const diff = Date.now() - new Date(isoDate).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)
  if (years >= 1) return `${years} year${years > 1 ? 's' : ''} ago`
  if (months >= 1) return `${months} month${months > 1 ? 's' : ''} ago`
  if (days >= 1) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours >= 1) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes >= 1) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'just now'
}

const createdAtRelative = computed(() => relativeTime((displayUser.value as Record<string, unknown>)?.createdAt as string | null))
const roleLabel = computed(() => {
  const role = displayUser.value?.role as string | undefined
  if (role === 'admin') return 'admin'
  if (role === 'staff') return 'staff'
  return 'user'
})

const loadProfile = async () => {
  if (isDemoMode()) {
    profile.value = null
    return
  }
  if (!auth.state.user?.userId) return
  try {
    const { data } = await api.get('/auth/me')
    profile.value = data?.data || data || null
  } catch {
    profile.value = null
  }
}

const loadBalance = async () => {
  if (auth.isStaff || auth.isAdmin) return
  if (isDemoMode()) {
    const stored = sessionStorage.getItem('demo_balance')
    balance.value = stored !== null ? parseFloat(stored) : 500
    return
  }
  try {
    const { data } = await api.get('/credits/balance')
    balance.value = data?.data?.creditBalance ?? data?.creditBalance ?? 0
  } catch {
    balance.value = null
  }
}

const loadTransactions = async () => {
  loadingTxns.value = true
  try {
    if (isDemoMode()) {
      transactions.value = [
        { id: 'demo-topup-001', reason: 'topup', delta: 100, createdAt: '2026-04-03T10:00:00Z' },
        { id: 'demo-purchase-001', reason: 'ticket_purchase', delta: -149.99, createdAt: '2026-04-01T18:30:00Z' },
      ]
      return
    }
    const { data } = await api.get('/credits/transactions')
    transactions.value = data?.data?.transactions || data?.data || []
  } catch {
    transactions.value = []
  } finally {
    loadingTxns.value = false
  }
}

const logout = () => {
  auth.clearSession()
  router.push('/login')
}

const txnLabel = (reason: string) => {
  if (reason === 'topup') return 'Top up'
  if (reason === 'ticket_purchase') return 'Ticket purchase'
  if (reason === 'p2p_sent') return 'Transfer sent'
  if (reason === 'p2p_received') return 'Transfer received'
  return reason
}

onMounted(() => {
  loadProfile()
  loadBalance()
  loadTransactions()
})
</script>

<template>
  <section class="page profile-page">
    <article class="glass profile-hero">
      <div class="hero-main">
        <div class="avatar">{{ (displayUser?.email as string)?.[0]?.toUpperCase() || '?' }}</div>
        <div class="hero-copy">
          <span class="badge">Profile</span>
          <h1 class="section-title">{{ displayUser?.email || 'Account' }}</h1>
          <div class="hero-tags">
            <StatusBadge :label="roleLabel" />
            <span v-if="(displayUser?.isFlagged as boolean)" class="badge flagged">Flagged</span>
          </div>
        </div>
      </div>
      <div class="hero-actions">
        <RouterLink v-if="!auth.isStaff && !auth.isAdmin" to="/credits/topup"><button>Top Up</button></RouterLink>
        <button class="secondary" @click="logout">Log Out</button>
      </div>
    </article>

    <div class="profile-grid">
      <article class="glass detail-card">
        <span class="badge">Account Details</span>
        <ProfileField label="Email" :value="(displayUser?.email as string) || null" />
        <ProfileField
          label="Phone"
          :value="((displayUser?.phoneNumber as string) || (displayUser?.phone as string)) || null"
          :masked="true"
          addLabel="phone"
        />
        <div class="profile-field">
          <span class="field-label">Role</span>
          <div class="field-value-wrap"><StatusBadge :label="roleLabel" /></div>
        </div>
        <div class="profile-field">
          <span class="field-label">Member Since</span>
          <div class="field-value-wrap"><span class="field-value">{{ createdAtRelative }}</span></div>
        </div>
      </article>

      <article class="glass side-card" v-if="!auth.isStaff && !auth.isAdmin">
        <span class="badge">Credits</span>
        <strong class="balance">${{ balance?.toLocaleString() ?? '—' }}</strong>
        <p class="small muted">Track your balance, top-up activity, and purchases from one place.</p>
        <RouterLink to="/tickets" class="inline-link">View My Tickets</RouterLink>
      </article>
    </div>

    <article v-if="!auth.isStaff && !auth.isAdmin" class="glass txn-card">
      <div class="txn-head">
        <span class="badge">Credit History</span>
        <p class="small muted" v-if="loadingTxns">Loading...</p>
      </div>

      <div v-if="!loadingTxns && transactions.length === 0" class="small muted">No transactions yet.</div>
      <div v-else class="txn-list">
        <div v-for="txn in transactions" :key="txn.txnId || txn.id" class="txn-row">
          <div>
            <p class="txn-label">{{ txnLabel(txn.reason) }}</p>
            <p class="small muted">{{ txn.createdAt ? new Date(txn.createdAt).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' }) : '—' }}</p>
          </div>
          <span :class="['txn-amount', txn.delta > 0 ? 'positive' : 'negative']">
            {{ txn.delta > 0 ? '+' : '' }}${{ Math.abs(txn.delta) }}
          </span>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.profile-page {
  display: grid;
  gap: 1rem;
}

.profile-hero,
.detail-card,
.side-card,
.txn-card {
  padding: 1.25rem;
}

.profile-hero,
.hero-main,
.hero-actions,
.hero-tags,
.profile-grid,
.txn-head,
.txn-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.profile-hero,
.txn-head,
.txn-row {
  justify-content: space-between;
  align-items: center;
}

.hero-main {
  align-items: center;
}

.avatar {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(249, 115, 22, 0.18);
  color: var(--primarySoft);
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: 1.7rem;
  font-weight: 800;
}

.hero-copy,
.detail-card,
.side-card,
.txn-card,
.txn-list {
  display: grid;
  gap: 0.8rem;
}

.profile-grid {
  align-items: start;
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
}

.balance {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: 2rem;
  color: var(--primarySoft);
}

.inline-link {
  color: var(--primarySoft);
  font-weight: 600;
}

.profile-field {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--outlineSoft);
}

.profile-field:last-child {
  border-bottom: 0;
}

.field-label {
  min-width: 120px;
  color: var(--textMuted);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-value-wrap {
  flex: 1;
}

.txn-list {
  gap: 0;
}

.txn-row {
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--outlineSoft);
}

.txn-row:last-child {
  border-bottom: 0;
}

.txn-label {
  margin-bottom: 0.15rem;
}

.txn-amount {
  font-weight: 700;
}

.positive { color: var(--success); }
.negative { color: var(--error); }

.flagged {
  background: rgba(255, 140, 122, 0.16);
  color: var(--error);
}

@media (max-width: 860px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
