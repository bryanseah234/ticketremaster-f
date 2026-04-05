<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  CheckBadgeIcon,
  QrCodeIcon,
  UserCircleIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { isDemoMode } from '@/services/mockData'

const auth = useAuthStore()

const storedMeta = (() => {
  const raw = sessionStorage.getItem('verification_success_meta')
  if (!raw) return null
  try {
    return JSON.parse(raw) as {
      email?: string
      phoneNumber?: string
      userId?: string
      fullName?: string
      verifiedAt?: string
    }
  } catch {
    return null
  }
})()

const demoOnly = computed(() => isDemoMode())
const accountEmail = computed(() => auth.state.user?.email || storedMeta?.email || 'demo@ticketremaster.com')
const accountPhone = computed(() => auth.state.user?.phoneNumber || storedMeta?.phoneNumber || '+65 0000 0000')
const accountId = computed(() => auth.state.user?.userId || storedMeta?.userId || 'usr_demo')
const accountName = computed(() => storedMeta?.fullName || accountEmail.value.split('@')[0])
const verifiedAt = computed(() => {
  const value = storedMeta?.verifiedAt
  if (value) {
    return new Date(value).toLocaleString('en-SG', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    })
  }

  return new Date().toLocaleString('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  })
})

const primaryAction = computed(() => (demoOnly.value ? '/demo-login' : '/events'))
const primaryLabel = computed(() => (demoOnly.value ? 'Open Demo Personas' : 'Continue to Events'))
const secondaryAction = computed(() => (demoOnly.value ? '/help' : '/profile'))
const secondaryLabel = computed(() => (demoOnly.value ? 'Support Center' : 'Open Profile'))
</script>

<template>
  <section class="page verification-page">
    <header class="verification-header">
      <h1>Verification <span>{{ demoOnly ? 'Ready' : 'Successful' }}</span></h1>
      <p>{{ demoOnly ? 'Demo access is prepared with seeded account safeguards' : 'Your account has been authenticated and granted access' }}</p>
    </header>

    <div class="verification-layout">
      <aside class="glass verification-sidebar">
        <RouterLink to="/profile" class="side-link">
          <UserCircleIcon class="side-icon" />
          <span>Profile</span>
        </RouterLink>
        <RouterLink :to="primaryAction" class="side-link active">
          <QrCodeIcon class="side-icon" />
          <span>{{ demoOnly ? 'Demo Access' : 'Verified' }}</span>
        </RouterLink>
      </aside>

      <div class="verification-content">
        <article class="glass verification-card">
          <div class="glow"></div>

          <div class="detail-grid">
            <div class="detail-item">
              <label>Account Name</label>
              <strong>{{ accountName }}</strong>
            </div>

            <div class="detail-item">
              <label>User ID</label>
              <strong>{{ accountId }}</strong>
            </div>

            <div class="detail-item">
              <label>Email Address</label>
              <strong>{{ accountEmail }}</strong>
            </div>

            <div class="detail-item">
              <label>{{ demoOnly ? 'Demo Access' : 'Verified At' }}</label>
              <strong>{{ demoOnly ? 'Offline-safe seeded session' : verifiedAt }}</strong>
            </div>
          </div>

          <div class="divider"></div>

          <div class="action-row">
            <RouterLink :to="primaryAction" class="action-link">
              <button type="button">{{ primaryLabel }}</button>
            </RouterLink>
            <RouterLink :to="secondaryAction" class="action-link">
              <button class="secondary" type="button">{{ secondaryLabel }}</button>
            </RouterLink>
          </div>
        </article>

        <div class="security-meta">
          <CheckBadgeIcon class="meta-icon" />
          <span>{{ demoOnly ? 'offline demo protocol active' : 'end-to-end encrypted verification protocol v4.2' }}</span>
        </div>

        <article class="glass verification-footnote">
          <span class="eyebrow">{{ demoOnly ? 'Offline Demo Mode' : 'Verified Contact' }}</span>
          <p>
            {{ demoOnly ? 'Only the three seeded personas remain available until the backend reconnects.' : `Primary phone on file: ${accountPhone}` }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.verification-page {
  display: grid;
  gap: 1.8rem;
}

.verification-header {
  text-align: center;
}

.verification-header h1 {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: clamp(2.4rem, 6vw, 4.4rem);
  font-weight: 900;
  letter-spacing: -0.08em;
  text-transform: uppercase;
}

.verification-header span {
  color: var(--primary);
}

.verification-header p {
  margin-top: 0.45rem;
  color: var(--textMuted);
  font-size: 0.98rem;
}

.verification-layout {
  display: grid;
  grid-template-columns: var(--account-sidebar-width) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.verification-sidebar {
  position: sticky;
  top: 6.8rem;
  display: grid;
  gap: 0.35rem;
  padding: 0.75rem;
  border-radius: 1.35rem;
  background: rgba(34, 31, 30, 0.84);
}

.side-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.92rem 1rem;
  border-radius: 1rem;
  color: var(--textMuted);
  font-weight: 600;
}

.side-link.active {
  background: rgba(249, 115, 22, 0.16);
  color: var(--primarySoft);
  border: 1px solid rgba(249, 115, 22, 0.2);
}

.side-icon,
.meta-icon {
  width: 1rem;
  height: 1rem;
}

.verification-content {
  display: grid;
  gap: 1rem;
}

.verification-card,
.verification-footnote {
  position: relative;
  border-radius: 1.55rem;
  background: rgba(34, 31, 30, 0.84);
  border-color: rgba(255, 255, 255, 0.06);
}

.verification-card {
  overflow: hidden;
  padding: clamp(1.5rem, 4vw, 2.4rem);
}

.glow {
  position: absolute;
  top: -5rem;
  right: -5rem;
  width: 12rem;
  height: 12rem;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.12);
  filter: blur(90px);
}

.detail-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.3rem 2rem;
}

.detail-item {
  display: grid;
  gap: 0.35rem;
}

.detail-item label {
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.detail-item strong {
  font-size: 1.02rem;
  line-height: 1.45;
}

.divider {
  position: relative;
  z-index: 1;
  height: 1px;
  margin: 1.6rem 0;
  background: rgba(255, 255, 255, 0.08);
}

.action-row {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.action-link {
  flex: 1 1 15rem;
}

.action-link button {
  width: 100%;
  border-radius: 0.88rem;
  padding-block: 0.98rem;
}

.security-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.45rem;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.verification-footnote {
  padding: 1rem 1.1rem;
}

.eyebrow {
  color: var(--primary);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.verification-footnote p {
  margin-top: 0.35rem;
  color: var(--textMuted);
  line-height: 1.55;
}

@media (max-width: 900px) {
  .verification-layout {
    grid-template-columns: 1fr;
  }

  .verification-sidebar {
    position: static;
  }
}

@media (max-width: 720px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
