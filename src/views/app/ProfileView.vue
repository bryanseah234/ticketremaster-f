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
  if (auth.isStaff) return
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
    <div class="header-row">
      <div class="avatar">{{ displayUser?.email?.[0]?.toUpperCase() || '?' }}</div>
      <div>
        <h1 class="section-title" style="margin-bottom:.2rem;">{{ displayUser?.email || '—' }}</h1>
        <div class="row" style="gap:.5rem;">
          <span class="badge">{{ roleLabel }}</span>
          <span v-if="memberSince" class="small muted">Member since {{ memberSince }}</span>
          <span v-if="displayUser?.isFlagged" class="badge flagged">Flagged</span>
        </div>
      </div>
    </div>

    <div class="layout">
      <!-- Left column -->
      <div class="left-col">
        <!-- Account details -->
        <article class="glass card">
          <h2 class="card-title">Account Details</h2>
          <div class="field">
            <span class="field-label">Email</span>
            <span>{{ displayUser?.email || '—' }}</span>
          </div>
          <div class="field">
            <span class="field-label">Phone</span>
            <span>{{ displayUser?.phone || displayUser?.phoneNumber || '—' }}</span>
          </div>
          <div class="field">
            <span class="field-label">Role</span>
            <span>{{ roleLabel }}</span>
          </div>
        </article>

        <!-- Credits -->
        <article v-if="!auth.isStaff" class="glass card">
          <h2 class="card-title">Credits</h2>
          <div class="balance-row">
            <div>
              <p class="muted small">Available balance</p>
              <p class="balance-amount">
                <span v-if="balance !== null">${{ balance.toLocaleString() }}</span>
                <span v-else class="muted">—</span>
              </p>
            </div>
            <RouterLink to="/credits/topup">
              <button>Top Up</button>
            </RouterLink>
          </div>
        </article>

        <!-- Actions -->
        <article class="glass card">
          <h2 class="card-title">Actions</h2>
          <div class="actions-list">
            <button class="danger full-width" @click="logout">Log Out</button>
          </div>
        </article>
      </div>

      <!-- Right column -->
      <div class="right-col">
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

        <article v-if="!auth.isStaff" class="glass card">
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
    </div>
  </section>
</template>

<style scoped>
.header-row {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 2rem;
}

.avatar {
  width: 3.8rem;
  height: 3.8rem;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 1.5rem;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.2rem;
  align-items: start;
}

.left-col, .right-col {
  display: grid;
  gap: 1.2rem;
}

.card {
  padding: 1.2rem;
  display: grid;
  gap: .9rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .06em;
  font-size: .78rem;
}

.field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: .5rem 0;
  border-bottom: 1px solid var(--border);
  font-size: .92rem;
}
.field:last-child { border-bottom: none; }
.field-label { color: var(--muted); font-size: .85rem; }

.balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.balance-amount { font-size: 1.8rem; font-weight: 700; margin-top: .2rem; }

.actions-list { display: grid; gap: .6rem; }
.full-width { width: 100%; }
.danger { background: rgba(239,68,68,.15); border-color: rgba(239,68,68,.4); color: #f87171; }
.danger:hover { background: rgba(239,68,68,.25); }

.txn-list { display: grid; gap: 0; }
.txn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: .75rem 0;
  border-bottom: 1px solid var(--border);
}
.txn-row:last-child { border-bottom: none; }
.txn-label { font-size: .92rem; margin-bottom: .15rem; }
.txn-amount { font-weight: 600; font-size: .95rem; }
.positive { color: var(--success); }
.negative { color: #f87171; }

.muted { color: var(--muted); }
.badge.flagged { background: rgba(239,68,68,.2); color: #f87171; border-color: rgba(239,68,68,.3); }

@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }
}
</style>
