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
const loadingProfile = ref(false)
const loadingTxns = ref(false)

// Merged display user: prefer fetched profile, fall back to auth store
const displayUser = computed(() => profile.value || auth.state.user)

// ── Relative timestamp ─────────────────────────────────────────────

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
const createdAtISO = computed(() => {
  const d = (displayUser.value as Record<string, unknown>)?.createdAt as string | null
  if (!d) return ''
  return new Date(d).toISOString()
})

// ── Role label ─────────────────────────────────────────────────────

const roleLabel = computed(() => {
  const role = displayUser.value?.role as string | undefined
  if (role === 'admin') return 'admin'
  if (role === 'staff') return 'staff'
  return 'user'
})

// ── Data loading ───────────────────────────────────────────────────

const loadProfile = async () => {
  // In demo mode, auth.state.user is already populated by demoLogin — skip API call
  if (isDemoMode()) {
    profile.value = null // rely on displayUser computed falling back to auth.state.user
    return
  }
  if (!auth.state.user?.userId) return
  loadingProfile.value = true
  try {
    const { data } = await api.get('/auth/me')
    profile.value = data?.data || data || null
  } catch {
    // fall back to auth store user
  } finally {
    loadingProfile.value = false
  }
}

const loadBalance = async () => {
  if (auth.isStaff || auth.isAdmin) return
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
  <section class="page">
    <!-- Header -->
    <article class="profile-header glass card">
      <div class="profile-content">
        <div class="avatar">{{ (displayUser?.email as string)?.[0]?.toUpperCase() || '?' }}</div>
        <div class="profile-info">
          <h1 class="profile-email">{{ displayUser?.email || '—' }}</h1>
          <div class="profile-badges">
            <StatusBadge :label="roleLabel" />
            <span v-if="(displayUser?.isFlagged as boolean)" class="badge flagged">⚠ Flagged</span>
          </div>
        </div>
        <div class="profile-actions">
          <RouterLink to="/credits/topup" v-if="!auth.isStaff && !auth.isAdmin">
            <button class="primary">Top Up</button>
          </RouterLink>
          <button class="danger" @click="logout">Log Out</button>
        </div>
      </div>
    </article>

    <!-- Account Details -->
    <article class="glass card account-details">
      <h2 class="card-title">Account Details</h2>

      <!-- Email: read-only identifier -->
      <ProfileField
        label="Email"
        :value="(displayUser?.email as string) || null"
      />

      <!-- Phone: masked, Add CTA when null -->
      <ProfileField
        label="Phone"
        :value="((displayUser?.phoneNumber as string) || (displayUser?.phone as string)) || null"
        :masked="true"
        addLabel="phone"
      />

      <!-- Role: StatusBadge -->
      <div class="profile-field">
        <span class="field-label">Role</span>
        <div class="field-value-wrap">
          <StatusBadge :label="roleLabel" />
        </div>
      </div>

      <!-- Created At: relative + ISO tooltip -->
      <div class="profile-field">
        <span class="field-label">Member since</span>
        <div class="field-value-wrap">
          <span
            class="field-value"
            :title="createdAtISO"
          >{{ createdAtRelative }}</span>
        </div>
      </div>

      <!-- isFlagged: warning badge only when true -->
      <div v-if="(displayUser?.isFlagged as boolean) === true" class="profile-field">
        <span class="field-label">Account status</span>
        <div class="field-value-wrap">
          <span class="badge flagged">⚠ Account flagged</span>
        </div>
      </div>
    </article>

    <div class="layout" :class="{ 'admin-layout': auth.isAdmin }">
      <!-- Left column: Credit History -->
      <div class="left-col">
        <article v-if="!auth.isStaff && !auth.isAdmin" class="glass card">
          <h2 class="card-title">Credit History</h2>
          <div v-if="balance !== null" class="balance-row">
            <span class="balance-label">Balance</span>
            <span class="balance-value">${{ balance.toLocaleString() }}</span>
          </div>
          <div v-if="loadingTxns" class="muted small">Loading...</div>
          <div v-else-if="transactions.length === 0" class="muted small">No transactions yet.</div>
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
      </div>

      <!-- Right column -->
      <div v-if="!auth.isAdmin" class="right-col">
        <article class="glass card">
          <h2 class="card-title">My Tickets</h2>
          <div class="muted small">
            <RouterLink to="/tickets" class="ticket-link">View your tickets →</RouterLink>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Profile Header */
.profile-header {
  padding: 1.5rem;
  margin-bottom: 1.2rem;
}

.profile-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 1.8rem;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-email {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 0.4rem 0;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-badges {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.profile-actions {
  display: flex;
  gap: 0.8rem;
  flex-shrink: 0;
}

.profile-actions button {
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.profile-actions .primary {
  background: var(--accent);
  border: 2px solid var(--accent);
  color: var(--accent-ink);
}

.profile-actions .danger {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.profile-actions .danger:hover {
  background: rgba(239, 68, 68, 0.25);
}

/* Account Details */
.account-details {
  margin-bottom: 1.2rem;
}

/* Shared profile-field row (mirrors ProfileField.vue layout for custom rows) */
.profile-field {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--border);
}

.profile-field:last-child {
  border-bottom: none;
}

.field-label {
  font-size: 0.82rem;
  color: var(--muted);
  min-width: 120px;
  flex-shrink: 0;
}

.field-value-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.field-value {
  font-size: 0.9rem;
  color: var(--text);
  cursor: default;
}

/* Balance row inside credit card */
.balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0 0.75rem;
  border-bottom: 1px solid var(--border);
}

.balance-label {
  font-size: 0.82rem;
  color: var(--muted);
}

.balance-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--accent);
}

/* Layout */
.layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.2rem;
  align-items: start;
}

.layout.admin-layout {
  grid-template-columns: 1fr;
}

.left-col,
.right-col {
  display: grid;
  gap: 1.2rem;
}

/* Cards */
.card {
  padding: 1.2rem;
  display: grid;
  gap: 0;
  border-radius: 1rem;
}

.card-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.75rem 0;
}

/* Transaction List */
.txn-list {
  display: grid;
  gap: 0;
}

.txn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border);
}

.txn-row:last-child {
  border-bottom: none;
}

.txn-label {
  font-size: 0.92rem;
  margin-bottom: 0.15rem;
}

.txn-amount {
  font-weight: 600;
  font-size: 0.95rem;
}

.positive { color: var(--success); }
.negative { color: #f87171; }

.muted { color: var(--muted); }
.small { font-size: 0.82rem; }

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.15);
  color: var(--accent);
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.badge.flagged {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}

.ticket-link {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent);
}

.ticket-link:hover {
  text-decoration: underline;
}

@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }

  .profile-content {
    flex-direction: column;
    text-align: center;
  }

  .profile-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
