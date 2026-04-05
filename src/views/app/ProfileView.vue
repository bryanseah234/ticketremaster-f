<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  CreditCardIcon,
  DevicePhoneMobileIcon,
  IdentificationIcon,
  LifebuoyIcon,
  LockClosedIcon,
  QrCodeIcon,
  TicketIcon,
  UserCircleIcon,
} from '@heroicons/vue/24/outline'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { isDemoMode } from '@/services/mockData'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const profile = ref<Record<string, unknown> | null>(null)

const displayUser = computed(() => (profile.value || auth.state.user || null) as Record<string, unknown> | null)

const sidebarLinks = computed(() =>
  auth.isStaff
    ? [
        { key: 'profile', to: '/profile', label: 'Profile', icon: UserCircleIcon },
        { key: 'scanner', to: '/staff/scan', label: 'Scanner', icon: QrCodeIcon },
        { key: 'support', to: '/help', label: 'Support', icon: LifebuoyIcon },
      ]
    : [
        { key: 'profile', to: '/profile', label: 'Profile', icon: UserCircleIcon },
        { key: 'credits', to: '/credits/topup', label: 'Credits', icon: CreditCardIcon },
        { key: 'tickets', to: '/tickets', label: 'Tickets', icon: TicketIcon },
      ],
)

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

const secondaryNote = computed(() =>
  isDemoMode()
    ? 'Enabled via seeded demo protections'
    : 'Enabled via your registered device',
)

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

const logout = () => {
  auth.clearSession()
  router.push('/login')
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <section class="page profile-page">
    <header class="profile-header">
      <h1>User<span>Profile</span></h1>
    </header>

    <div class="profile-layout">
      <aside class="glass account-sidebar">
        <nav class="sidebar-nav">
          <RouterLink
            v-for="item in sidebarLinks"
            :key="item.key"
            :to="item.to"
            class="side-link"
            :class="{ active: item.key === 'profile' }"
          >
            <component :is="item.icon" class="side-icon" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <button class="sidebar-logout" type="button" @click="logout">Log Out</button>
      </aside>

      <div class="profile-content">
        <article class="glass account-card">
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

        <article class="glass security-card">
          <div class="security-copy">
            <div class="icon-shell muted">
              <LockClosedIcon class="card-icon" />
            </div>
            <div>
              <h2>Security &amp; Password</h2>
              <p>Update your password to keep your assets secure.</p>
            </div>
          </div>

          <button class="secondary" type="button" @click="notifyReadonly('Password changes')">Change Password</button>
        </article>

        <div class="preference-grid">
          <article class="panel preference-card">
            <DevicePhoneMobileIcon class="preference-icon" />
            <div>
              <strong>Two-Factor Auth</strong>
              <span>{{ secondaryNote }}</span>
            </div>
          </article>

          <article class="panel preference-card">
            <TicketIcon class="preference-icon" />
            <div>
              <strong>Device Management</strong>
              <span>{{ isDemoMode() ? '3 seeded sessions in Demo Mode' : 'Sessions monitored across your active devices' }}</span>
            </div>
          </article>
        </div>

        <article v-if="!auth.isStaff" class="glass wallet-shortcut">
          <div>
            <span class="eyebrow">Wallet</span>
            <h3>Jump straight to credits or your ticket vault without leaving the profile surface.</h3>
          </div>

          <div class="wallet-actions">
            <RouterLink to="/credits/topup"><button type="button">Open Credits</button></RouterLink>
            <RouterLink to="/tickets"><button class="secondary" type="button">View Tickets</button></RouterLink>
          </div>
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
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.account-sidebar {
  position: sticky;
  top: 6.8rem;
  display: grid;
  gap: 1rem;
  padding: 0.85rem;
  border-radius: 1.35rem;
  background: rgba(34, 31, 30, 0.84);
}

.sidebar-nav {
  display: grid;
  gap: 0.35rem;
}

.side-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 0.95rem;
  border-radius: 1rem;
  color: var(--textMuted);
  font-weight: 600;
}

.side-link.active {
  background: rgba(249, 115, 22, 0.16);
  color: var(--primarySoft);
  border: 1px solid rgba(249, 115, 22, 0.22);
}

.side-icon {
  width: 1rem;
  height: 1rem;
}

.sidebar-logout {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--text);
}

.profile-content {
  display: grid;
  gap: 1.2rem;
}

.account-card,
.security-card,
.wallet-shortcut {
  padding: 1.5rem;
  border-radius: 1.5rem;
  background: rgba(34, 31, 30, 0.84);
  border-color: rgba(255, 255, 255, 0.06);
}

.card-heading,
.security-copy {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-heading {
  margin-bottom: 1.2rem;
}

.card-heading h2,
.security-copy h2 {
  font-size: 1.45rem;
  letter-spacing: -0.03em;
}

.card-heading p,
.security-copy p {
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

.icon-shell.muted {
  background: rgba(255, 255, 255, 0.06);
}

.card-icon {
  width: 1.15rem;
  height: 1.15rem;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.field-full {
  grid-column: 1 / -1;
}

.field-stack {
  display: grid;
  gap: 0.4rem;
}

.field-stack input {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.05);
}

.primary-action {
  margin-top: 1.35rem;
}

.security-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.preference-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.preference-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem 1.05rem;
  border-radius: 1.3rem;
}

.preference-icon {
  width: 1.05rem;
  height: 1.05rem;
  color: var(--primary);
}

.preference-card strong {
  display: block;
  margin-bottom: 0.2rem;
  font-size: 0.95rem;
}

.preference-card span {
  color: var(--textMuted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.wallet-shortcut {
  display: grid;
  gap: 1rem;
}

.eyebrow {
  color: var(--primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.wallet-shortcut h3 {
  margin-top: 0.35rem;
  font-size: 1.15rem;
  line-height: 1.45;
}

.wallet-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

@media (max-width: 980px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }

  .account-sidebar {
    position: static;
  }
}

@media (max-width: 720px) {
  .field-grid,
  .preference-grid {
    grid-template-columns: 1fr;
  }

  .security-card {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
