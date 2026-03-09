<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { mockEvents } from '@/data/mockEvents'

const auth = useAuthStore()
const router = useRouter()
const balance = ref(0)
const message = ref('')
const favoriteIds = ref<string[]>(JSON.parse(localStorage.getItem('favorite_events') || '[]'))

const favoriteEvents = computed(() => {
  const byId = new Map(mockEvents.map((event) => [event.event_id, event]))
  return favoriteIds.value.map((id) => byId.get(id) || { event_id: id, name: 'Unknown event', event_date: '' })
})

const load = async () => {
  try {
    const { data } = await api.get('/credits/balance')
    balance.value = data?.data?.credit_balance || 0
  } catch {
    message.value = 'Unable to fetch profile balance.'
  }
}

const logout = async () => {
  try {
    await api.post('/auth/logout')
  } catch {
    // no-op
  }
  auth.clearSession()
  router.push('/login')
}

onMounted(load)
</script>

<template>
  <section class="page" style="max-width:760px;">
    <article class="glass" style="padding:1rem;display:grid;gap:.75rem;">
      <h1 class="section-title">Profile</h1>
      <span class="badge">Read-only account details</span>
      <p class="small">Email: {{ auth.state.user?.email || '—' }}</p>
      <p class="small">Phone: {{ auth.state.user?.phone || '—' }}</p>
      <p class="small">Credit Balance: {{ balance }}</p>
      <p class="small">Flagged: {{ auth.state.user?.flagged ? 'Yes' : 'No' }}</p>
      <div class="glass" style="padding:.8rem;display:grid;gap:.4rem;">
        <p class="small">Favourited Events</p>
        <ul v-if="favoriteEvents.length" class="small" style="display:grid;gap:.25rem;">
          <li v-for="event in favoriteEvents" :key="event.event_id">
            {{ event.name }} <span v-if="event.event_date">· {{ new Date(event.event_date).toLocaleDateString() }}</span>
          </li>
        </ul>
        <p v-else class="small">No favourites saved yet.</p>
      </div>
      <button class="secondary" @click="logout">Logout</button>
      <p v-if="message" class="small" style="color:#fca5a5">{{ message }}</p>
    </article>
  </section>
</template>
