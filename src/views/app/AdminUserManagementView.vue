<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api/client'

interface User {
  userId: string
  email: string
  role: string
  isFlagged: boolean
  createdAt: string
}

const users = ref<User[]>([])
const loading = ref(true)
const error = ref('')

const fetchUsers = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/users')
    users.value = data || []
  } catch (e: any) {
    error.value = e?.response?.data?.error?.message || 'Failed to fetch users'
  } finally {
    loading.value = false
  }
}

const promoteToStaff = async (user: User) => {
  if (!confirm(`Promote ${user.email} to staff?`)) return
  try {
    await api.patch(`/users/${user.userId}`, { role: 'staff' })
    user.role = 'staff'
  } catch (e: any) {
    alert(e?.response?.data?.error?.message || 'Failed to promote user')
  }
}

const demoteToUser = async (user: User) => {
  if (!confirm(`Demote ${user.email} back to user?`)) return
  try {
    await api.patch(`/users/${user.userId}`, { role: 'user' })
    user.role = 'user'
  } catch (e: any) {
    alert(e?.response?.data?.error?.message || 'Failed to demote user')
  }
}

const toggleFlag = async (user: User) => {
  const action = user.isFlagged ? 'Unflag' : 'Flag'
  if (!confirm(`${action} user ${user.email}?`)) return
  try {
    await api.patch(`/users/${user.userId}`, { isFlagged: !user.isFlagged })
    user.isFlagged = !user.isFlagged
  } catch (e: any) {
    alert(e?.response?.data?.error?.message || `Failed to ${action.toLowerCase()} user`)
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <section class="page admin-users">
    <div class="row" style="justify-content:space-between;align-items:flex-end;margin-bottom:1.5rem">
      <div>
        <!-- <span class="badge">Admin Tools</span> -->
        <h1 class="section-title">User Management</h1>
      </div>
      <button class="btn-secondary" @click="fetchUsers" :disabled="loading">
        Refresh
      </button>
    </div>

    <div v-if="loading" class="loading-state">Loading users...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>
    
    <div v-else class="table-container glass">
      <table class="data-table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="user in users" 
            :key="user.userId"
            :class="{ 'row-flagged': user.isFlagged }"
          >
            <td class="mono small">{{ user.userId.substring(0, 8) }}...</td>
            <td>{{ user.email }}</td>
            <td>
              <span class="role-badge" :class="user.role">{{ user.role }}</span>
            </td>
            <td>
              <div class="actions">
                <button 
                  v-if="user.role === 'user'" 
                  class="btn-sm btn-outline"
                  @click="promoteToStaff(user)"
                >
                  Promote to Staff
                </button>
                <button 
                  v-if="user.role === 'staff'" 
                  class="btn-sm btn-demote"
                  @click="demoteToUser(user)"
                >
                  Demote to User
                </button>
                <button 
                  v-if="user.role !== 'admin'"
                  class="btn-sm" 
                  :class="user.isFlagged ? 'btn-danger' : 'btn-warning'"
                  @click="toggleFlag(user)"
                >
                  {{ user.isFlagged ? 'Unflag' : 'Flag' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="users.length === 0" class="empty-state">
        No users found.
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-users {
  max-width: 1000px;
}

.table-container {
  border-radius: 12px;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th,
.data-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.data-table th {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
  background: rgba(0, 0, 0, 0.2);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr {
  transition: background-color 0.2s ease;
}

.data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.row-flagged {
  background: rgba(239, 68, 68, 0.1) !important;
}
.row-flagged:hover {
  background: rgba(239, 68, 68, 0.15) !important;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.role-badge.admin {
  background: rgba(168, 85, 247, 0.15);
  color: #d8b4fe;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.role-badge.staff {
  background: rgba(56, 189, 248, 0.15);
  color: #7dd3fc;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.role-badge.user {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-outline {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}
.btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-demote {
  background: rgba(56, 189, 248, 0.1);
  color: #7dd3fc;
  border: 1px solid rgba(56, 189, 248, 0.25);
}
.btn-demote:hover {
  background: rgba(56, 189, 248, 0.2);
}

.btn-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.btn-warning:hover {
  background: rgba(245, 158, 11, 0.25);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.btn-danger:hover {
  background: rgba(239, 68, 68, 0.25);
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.error-state {
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.1);
}
</style>
