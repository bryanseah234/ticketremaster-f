<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { isDemoMode, mockAdminUser, mockStaffUser, mockUser } from '@/services/mockData'

interface UserRecord {
  userId: string
  email: string
  role: string
  isFlagged: boolean
  phoneNumber?: string
  venueId?: string | null
  createdAt: string
}

const toast = useToast()
const users = ref<UserRecord[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const filter = ref<'all' | 'flagged' | 'clean'>('all')

const demoUsers: UserRecord[] = [
  mockAdminUser,
  mockStaffUser,
  mockUser,
  {
    userId: 'demo-flagged-001',
    email: 'flagged@ticketremaster.com',
    role: 'user',
    isFlagged: true,
    phoneNumber: '+6512345678',
    venueId: null,
    createdAt: new Date().toISOString(),
  },
].map((user) => ({
  userId: user.userId,
  email: user.email,
  role: user.role,
  isFlagged: user.isFlagged,
  phoneNumber: user.phoneNumber,
  venueId: user.venueId || null,
  createdAt: user.createdAt,
}))

const filteredUsers = computed(() => {
  const needle = search.value.trim().toLowerCase()
  return users.value.filter((user) => {
    if (filter.value === 'flagged' && !user.isFlagged) return false
    if (filter.value === 'clean' && user.isFlagged) return false
    if (!needle) return true
    return (
      user.email.toLowerCase().includes(needle) ||
      user.userId.toLowerCase().includes(needle) ||
      (user.phoneNumber || '').toLowerCase().includes(needle)
    )
  })
})

const loadUsers = async () => {
  loading.value = true
  error.value = ''
  try {
    if (isDemoMode()) {
      users.value = demoUsers
      return
    }
    const endpoint =
      search.value.trim().length > 0
        ? `/admin/users/search?q=${encodeURIComponent(search.value.trim())}`
        : `/admin/users${filter.value === 'all' ? '' : `?flagged=${filter.value === 'flagged' ? 'true' : 'false'}`}`

    const { data } = await api.get(endpoint)
    users.value = Array.isArray(data) ? data : data?.users || []
  } catch (e: any) {
    error.value = e?.response?.data?.error?.message || 'Failed to fetch users'
    if (!users.value.length) users.value = demoUsers
  } finally {
    loading.value = false
  }
}

const promoteToStaff = async (user: UserRecord) => {
  if (!window.confirm(`Promote ${user.email} to staff?`)) return
  try {
    await api.patch(`/users/${user.userId}`, { role: 'staff' })
    user.role = 'staff'
    toast.push('User promoted to staff.', 'success', 2400)
  } catch (e: any) {
    toast.push(e?.response?.data?.error?.message || 'Failed to promote user.', 'error', 3000)
  }
}

const demoteToUser = async (user: UserRecord) => {
  if (!window.confirm(`Demote ${user.email} back to user?`)) return
  try {
    await api.patch(`/users/${user.userId}`, { role: 'user' })
    user.role = 'user'
    toast.push('User demoted to user.', 'success', 2400)
  } catch (e: any) {
    toast.push(e?.response?.data?.error?.message || 'Failed to demote user.', 'error', 3000)
  }
}

const toggleFlag = async (user: UserRecord) => {
  const nextFlag = !user.isFlagged
  if (!window.confirm(`${nextFlag ? 'Flag' : 'Unflag'} ${user.email}?`)) return
  try {
    await api.patch(`/admin/users/${user.userId}/flag`, { isFlagged: nextFlag })
    user.isFlagged = nextFlag
    toast.push(nextFlag ? 'User flagged.' : 'User unflagged.', 'success', 2400)
  } catch (e: any) {
    toast.push(e?.response?.data?.error?.message || 'Failed to update user flag.', 'error', 3000)
  }
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' })

onMounted(loadUsers)
</script>

<template>
  <section class="admin-users-page">
    <header class="hero panel">
      <span class="eyebrow">Admin Oversight</span>
      <div class="hero-row">
        <div>
          <h1>User Management</h1>
          <p>Review accounts, promote staff, and handle flagged profiles from a single control room.</p>
        </div>
        <button class="secondary" :disabled="loading" @click="loadUsers">Refresh</button>
      </div>
    </header>

    <section class="toolbar panel">
      <label class="search-field">
        <span>Search</span>
        <input v-model="search" placeholder="Email, phone, or user id" @keyup.enter="loadUsers" />
      </label>
      <div class="filter-row">
        <button :class="{ active: filter === 'all' }" @click="filter = 'all'; loadUsers()">All</button>
        <button :class="{ active: filter === 'flagged' }" @click="filter = 'flagged'; loadUsers()">Flagged</button>
        <button :class="{ active: filter === 'clean' }" @click="filter = 'clean'; loadUsers()">Clean</button>
      </div>
    </section>

    <div v-if="loading" class="state-shell panel">Loading users…</div>
    <div v-else-if="error && !users.length" class="state-shell panel error">{{ error }}</div>

    <section v-else class="grid-shell">
      <article class="summary-card panel">
        <span class="meta-label">Accounts Loaded</span>
        <strong>{{ users.length }}</strong>
      </article>
      <article class="summary-card panel">
        <span class="meta-label">Flagged Profiles</span>
        <strong>{{ users.filter((user) => user.isFlagged).length }}</strong>
      </article>
      <article class="summary-card panel">
        <span class="meta-label">Staff Accounts</span>
        <strong>{{ users.filter((user) => user.role === 'staff').length }}</strong>
      </article>
    </section>

    <section v-if="!loading && filteredUsers.length === 0" class="state-shell panel">
      No users matched the current filters.
    </section>

    <section v-else class="users-grid">
      <article v-for="user in filteredUsers" :key="user.userId" class="user-card panel" :class="{ flagged: user.isFlagged }">
        <div class="user-head">
          <div>
            <h2>{{ user.email }}</h2>
            <p>{{ user.userId }}</p>
          </div>
          <span class="role-pill" :class="user.role">{{ user.role }}</span>
        </div>

        <div class="user-meta">
          <div><span class="meta-label">Created</span><strong>{{ formatDate(user.createdAt) }}</strong></div>
          <div><span class="meta-label">Phone</span><strong>{{ user.phoneNumber || 'Not available' }}</strong></div>
          <div><span class="meta-label">Venue</span><strong>{{ user.venueId || 'Unassigned' }}</strong></div>
          <div><span class="meta-label">Status</span><strong>{{ user.isFlagged ? 'Flagged' : 'Normal' }}</strong></div>
        </div>

        <div class="actions">
          <button v-if="user.role === 'user'" class="secondary" @click="promoteToStaff(user)">Promote To Staff</button>
          <button v-if="user.role === 'staff'" class="secondary" @click="demoteToUser(user)">Demote To User</button>
          <button v-if="user.role !== 'admin'" :class="user.isFlagged ? 'secondary' : ''" @click="toggleFlag(user)">
            {{ user.isFlagged ? 'Unflag User' : 'Flag User' }}
          </button>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.admin-users-page, .hero, .toolbar { display: grid; gap: 1rem; }
.eyebrow, .meta-label {
  font-size: .7rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase;
}
.eyebrow { color: var(--primary); }
.meta-label { color: var(--text-dim); display: block; margin-bottom: .35rem; }
.hero-row { display: flex; justify-content: space-between; gap: 1rem; align-items: start; flex-wrap: wrap; }
.hero h1 {
  margin: 0 0 .4rem; font-family: var(--font-display); font-size: clamp(2.6rem, 5vw, 4.6rem); line-height: .95; letter-spacing: -.05em;
}
.hero p { margin: 0; max-width: 40rem; color: var(--text-muted); line-height: 1.7; }
.toolbar { grid-template-columns: minmax(0,1fr) auto; align-items: end; }
.search-field { display: grid; gap: .35rem; }
.search-field span { color: var(--text-dim); font-size: .72rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
.filter-row, .actions, .hero-row { display: flex; gap: .75rem; flex-wrap: wrap; }
.filter-row button {
  padding: .8rem 1rem; border-radius: 999px; border: 1px solid rgba(255,255,255,.06);
  background: rgba(255,255,255,.03); color: var(--text-dim); font-size: .75rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
}
.filter-row button.active { border-color: rgba(249,115,22,.4); background: rgba(249,115,22,.14); color: var(--primary); }
.grid-shell { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 1rem; }
.summary-card strong { display: block; font-size: 2rem; margin-top: .3rem; }
.state-shell { padding: 1.4rem; text-align: center; color: var(--text-muted); }
.state-shell.error { color: #ff8f84; }
.users-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1rem; }
.user-card { display: grid; gap: 1rem; }
.user-card.flagged { border-color: rgba(255,143,132,.22); background: rgba(120,30,24,.12); }
.user-head { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
.user-head h2 { margin: 0 0 .25rem; font-size: 1.15rem; }
.user-head p { margin: 0; color: var(--text-muted); font-size: .82rem; word-break: break-all; }
.role-pill {
  width: fit-content; padding: .45rem .75rem; border-radius: 999px; background: rgba(255,255,255,.05);
  color: var(--text); font-size: .68rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
}
.role-pill.admin { color: #f3c57c; }
.role-pill.staff { color: #87c9ff; }
.role-pill.user { color: var(--text-muted); }
.user-meta { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1rem; padding-top: .5rem; border-top: 1px solid rgba(255,255,255,.05); }
.user-meta strong { display: block; }
@media (max-width: 980px) {
  .toolbar, .grid-shell, .users-grid, .user-meta { grid-template-columns: 1fr; }
}
</style>
