<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  IdentificationIcon,
} from '@heroicons/vue/24/outline'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { isDemoMode } from '@/services/mockData'
import { useToast } from '@/composables/useToast'
import AccountSidebar from '@/components/account/AccountSidebar.vue'

const auth = useAuthStore()
const toast = useToast()
const profile = ref<Record<string, unknown> | null>(null)

const displayUser = computed(() => (profile.value || auth.state.user || null) as Record<string, unknown> | null)

const fullName = computed(() => {
  const explicitName = (displayUser.value?.fullName as string) || (displayUser.value?.name as string)
  if (explicitName) return explicitName
  const email = (displayUser.value?.email as string) || 'TicketRemaster Guest'
  return email
    .split('@')[0]
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
})

const phoneValue = computed(
  () =>
    ((displayUser.value?.phoneNumber as string) || (displayUser.value?.phone as string) || '+65 0000 0000')
      .replace(/(\+\d{2})(\d{4})(\d{4})/, '$1 $2 $3'),
)

const roleTone = computed(() => {
  if (auth.isAdmin) return 'Administrator account'
  if (auth.isStaff) return 'Staff operations account'
  return 'Customer account'
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

const notifyReadonly = (feature: string) => {
  toast.info(`${feature} is still read-only in this build.`, 3200)
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <section class="page profile-page">
    <header class="profile-header">
      <h1>User <span>Profile</span></h1>
    </header>

    <div class="profile-layout">
      <AccountSidebar active-key="profile" />

      <div class="profile-content">
        <article class="glass account-card">
          <div class="watermark-shell" aria-hidden="true">
            <IdentificationIcon class="watermark-icon" />
          </div>

          <div class="card-heading">
            <div class="icon-shell">
              <IdentificationIcon class="card-icon" />
            </div>
            <div>
              <h2>Account Details</h2>
              <p>{{ roleTone }}</p>
            </div>
          </div>

          <div class="field-grid">
            <div class="field-stack">
              <label for="profile-full-name">Full Name</label>
              <input id="profile-full-name" name="fullName" :value="fullName" readonly />
            </div>

            <div class="field-stack">
              <label for="profile-email">Email Address</label>
              <input id="profile-email" name="email" :value="(displayUser?.email as string) || 'demo@ticketremaster.com'" readonly />
            </div>

            <div class="field-stack field-full">
              <label for="profile-phone">Phone Number</label>
              <input id="profile-phone" name="phone" :value="phoneValue" readonly />
            </div>
          </div>

          <button class="primary-action" type="button" @click="notifyReadonly('Profile editing')">Update Information</button>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.profile-page {
  display: grid;
  gap: 1.5rem;
}

.profile-header {
  text-align: center;
}

.profile-header h1 {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: clamp(2.7rem, 7vw, 4.35rem);
  font-weight: 800;
  letter-spacing: -0.07em;
}

.profile-header span {
  color: var(--primary);
}

.profile-layout {
  display: grid;
  grid-template-columns: var(--account-sidebar-width) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.profile-content {
  display: grid;
  gap: 1.2rem;
}

.account-card {
  position: relative;
  overflow: hidden;
  max-width: 56rem;
  padding: 1.8rem;
  border-radius: 1.5rem;
  background: rgba(34, 31, 30, 0.84);
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.18);
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-heading {
  margin-bottom: 1.35rem;
}

.card-heading h2 {
  font-size: 1.45rem;
  letter-spacing: -0.03em;
  font-weight: 800;
}

.card-heading p {
  margin-top: 0.2rem;
  color: var(--textMuted);
  font-size: 0.88rem;
}

.icon-shell {
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.08));
  color: var(--primary);
}

.card-icon {
  width: 1.15rem;
  height: 1.15rem;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  max-width: 48rem;
}

.field-full {
  grid-column: 1 / -1;
}

.field-stack {
  display: grid;
  gap: 0.4rem;
}

.field-stack label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.52);
}

.field-stack input {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  min-height: 3.4rem;
}

.primary-action {
  margin-top: 1.35rem;
  width: fit-content;
  border-radius: 0.95rem;
  padding-inline: 1.4rem;
  padding-block: 0.9rem;
}

.watermark-shell {
  position: absolute;
  top: 1.5rem;
  right: 1.6rem;
  opacity: 0.06;
  pointer-events: none;
}

.watermark-icon {
  width: 4rem;
  height: 4rem;
}

@media (max-width: 980px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
