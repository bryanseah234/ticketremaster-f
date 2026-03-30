<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { mockEvents } from '@/data/mockEvents'
const auth = useAuthStore()
const router = useRouter()

const balance = ref<number | null>(null)
const profile = ref<any>(null)
const transactions = ref<any[]>([])
const loadingProfile = ref(false)
const loadingTxns = ref(false)

const favoriteIds = ref<string[]>(JSON.parse(localStorage.getItem('favoriteEvents') || '[]'))
const favoriteEvents = computed(() => {
  const byId = new Map(mockEvents.map((e) => [e.eventId, e]))
  return favoriteIds.value.map((id) => byId.get(id) || { eventId: id, name: 'Unknown event', eventDate: '' })
})

const displayUser = computed(() => profile.value || auth.state.user)

const roleLabel = computed(() => {
  const role = displayUser.value?.role
  if (role === 'admin') return 'Admin'
  if (role === 'staff') return 'Staff'
  return 'Member'
})

const memberSince = computed(() => {
  const date = profile.value?.createdAt
  if (!date) return null
  return new Date(date).toLocaleDateString('en-SG', { year: 'numeric', month: 'long' })
})

const loadProfile = async () => {
  if (!auth.state.user?.userId) return
  loadingProfile.value = true
  try {
    const { data } = await api.get(`/users/${auth.state.user.userId}`)
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
    <!-- Header: Full-width User Profile section -->
    <article class="profile-header glass card">
      <div class="profile-content">
        <div class="avatar">{{ displayUser?.email?.[0]?.toUpperCase() || '?' }}</div>
        <div class="profile-info">
          <h1 class="profile-email">{{ displayUser?.email || '—' }}</h1>
          <div class="profile-badges">
            <span class="badge">{{ roleLabel }}</span>
            <span v-if="memberSince" class="small muted">Member since {{ memberSince }}</span>
            <span v-if="displayUser?.isFlagged" class="badge flagged">Flagged</span>
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

    <!-- Account Details: Full-width horizontal bar -->
    <article class="account-bar glass card">
      <div class="account-item">
        <span class="account-label">Email</span>
        <span class="account-value">{{ displayUser?.email || '—' }}</span>
      </div>
      <div class="account-divider"></div>
      <div class="account-item">
        <span class="account-label">Phone</span>
        <span class="account-value">{{ displayUser?.phone || displayUser?.phoneNumber || '—' }}</span>
      </div>
      <div class="account-divider"></div>
      <div class="account-item">
        <span class="account-label">Role</span>
        <span class="account-value">{{ roleLabel }}</span>
      </div>
      <div class="account-divider"></div>
      <div class="account-item" v-if="balance !== null && !auth.isStaff && !auth.isAdmin">
        <span class="account-label">Balance</span>
        <span class="account-value balance">${{ balance.toLocaleString() }}</span>
      </div>
    </article>

    <div class="layout" :class="{ 'admin-layout': auth.isAdmin }">
      <!-- Left column: Credit History -->
      <div class="left-col">
        <article v-if="!auth.isStaff && !auth.isAdmin" class="glass card">
          <h2 class="card-title">Credit History</h2>
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

      <!-- Right column: My Tickets and Favourite Events (2-column grid) -->
      <div v-if="!auth.isAdmin" class="right-col">
        <!-- My Tickets -->
        <article class="glass card tickets-card">
          <h2 class="card-title">My Tickets</h2>
          <div class="tickets-grid">
            <div class="ticket-item placeholder">
              <div class="ticket-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
                  <path d="M9 9h6M9 13h6"/>
                </svg>
              </div>
              <span class="ticket-label">No tickets yet</span>
              <RouterLink to="/events" class="ticket-link">Browse Events →</RouterLink>
            </div>
            <!-- Example ticket item (shown when tickets exist) -->
            <div class="ticket-item">
              <div class="ticket-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
                  <path d="M9 9h6M9 13h6"/>
                </svg>
              </div>
              <span class="ticket-label">Your tickets appear here</span>
            </div>
          </div>
        </article>

        <!-- Favourite Events -->
        <article class="glass card">
          <h2 class="card-title">Favourite Events</h2>
          <div v-if="favoriteEvents.length === 0" class="muted small">No favourites saved yet.</div>
          <div v-else class="txn-list">
            <div v-for="event in favoriteEvents" :key="event.eventId" class="txn-row">
              <div>
                <p class="txn-label">{{ event.name }}</p>
                <p v-if="event.eventDate" class="small muted">{{ new Date(event.eventDate).toLocaleDateString() }}</p>
              </div>
              <RouterLink :to="`/events/${event.eventId}`"><button class="secondary" style="padding:.3rem .8rem;font-size:.82rem;">View</button></RouterLink>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Profile Header - Full width top row */
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

.profile-actions .primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.profile-actions .danger {
  background: rgba(239,68,68,.15);
  border: 1px solid rgba(239,68,68,.4);
  color: #f87171;
}

.profile-actions .danger:hover {
  background: rgba(239,68,68,.25);
}

/* Account Details - Full-width horizontal bar */
.account-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  padding: 1.2rem 1.5rem;
  margin-bottom: 1.2rem;
  border-radius: 1rem;
}

.account-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 1rem;
}

.account-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.account-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-value.balance {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--accent);
}

.account-divider {
  width: 1px;
  background: var(--border);
  align-self: stretch;
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

.left-col, .right-col {
  display: grid;
  gap: 1.2rem;
}

/* Cards */
.card {
  padding: 1.2rem;
  display: grid;
  gap: 0.9rem;
  border-radius: 1rem;
}

.card-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

/* Tickets Grid - 2 columns */
.tickets-card {
  grid-column: span 1;
}

.tickets-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;
}

.ticket-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
  background: var(--surface-2);
  border-radius: 0.75rem;
  gap: 0.5rem;
}

.ticket-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--muted);
}

.ticket-icon svg {
  width: 100%;
  height: 100%;
}

.ticket-label {
  font-size: 0.82rem;
  color: var(--muted);
}

.ticket-link {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
}

.ticket-link:hover {
  text-decoration: underline;
}

/* Transaction List */
.txn-list { display: grid; gap: 0; }
.txn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border);
}
.txn-row:last-child { border-bottom: none; }
.txn-label { font-size: 0.92rem; margin-bottom: 0.15rem; }
.txn-amount { font-weight: 600; font-size: 0.95rem; }
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
  background: rgba(249,115,22,.15);
  color: var(--accent);
  border: 1px solid rgba(249,115,22,.3);
}
.badge.flagged {
  background: rgba(239,68,68,.2);
  color: #f87171;
  border-color: rgba(239,68,68,.3);
}

/* Responsive */
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
  
  .account-bar {
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
  }
  
  .account-divider {
    display: none;
  }
  
  .account-item {
    padding: 0;
  }
  
  .tickets-grid {
    grid-template-columns: 1fr;
  }
}
</style>
