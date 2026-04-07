<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ArrowRightIcon, ComputerDesktopIcon, ShieldCheckIcon, UserIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import type { UserRole } from '@/types'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const loadingRole = ref<UserRole | null>(null)

const demoAccounts = [
  {
    email: 'demo@ticketremaster.com',
    role: 'user' as const,
    label: 'Demo User',
    caption: 'Marketplace & ticket wallet access',
    icon: UserIcon,
  },
  {
    email: 'admin@ticketremaster.com',
    role: 'admin' as const,
    label: 'Demo Admin',
    caption: 'Global oversight & editorial control',
    icon: ShieldCheckIcon,
  },
  {
    email: 'staff@ticketremaster.com',
    role: 'staff' as const,
    label: 'Demo Staff',
    caption: 'Operations & hospitality terminal',
    icon: ComputerDesktopIcon,
  },
]

const destinationByRole: Record<UserRole, string> = {
  user: '/events',
  admin: '/admin/events',
  staff: '/staff/scan',
}

const useDemoAccount = async (role: UserRole) => {
  loadingRole.value = role
  try {
    auth.demoLogin(role, 'manual')
    toast.success('Demo session ready. You are now exploring offline-safe flows.', 3200)
    router.push(destinationByRole[role])
  } finally {
    loadingRole.value = null
  }
}
</script>

<template>
  <section class="page demo-page">
    <div class="demo-shell">
      <article class="glass demo-card">
        <div class="demo-copy">
          <h1>Select Your Persona</h1>
          <p>Choose an identity to explore the obsidian hearth.</p>
        </div>

        <div class="persona-stack">
          <button
            v-for="account in demoAccounts"
            :key="account.email"
            class="persona-card"
            :disabled="loadingRole !== null"
            @click="useDemoAccount(account.role)"
          >
            <div class="persona-icon">
              <component :is="account.icon" class="icon" />
            </div>
            <div class="persona-copy">
              <strong>{{ account.label }}</strong>
              <span>{{ account.caption }}</span>
            </div>
            <ArrowRightIcon class="chevron" />
          </button>
        </div>

        <p class="demo-note">Only the three seeded demo personas are available when live services are unavailable.</p>

        <div class="demo-actions">
          <RouterLink to="/login" class="plain-link">Regular Login</RouterLink>
          <RouterLink to="/help" class="plain-link">Support</RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.demo-page {
  min-height: calc(100vh - 12rem);
  display: grid;
  place-items: center;
}

.demo-shell {
  width: min(100%, 30rem);
}

.demo-card {
  display: grid;
  gap: 1.35rem;
  padding: clamp(1.5rem, 4vw, 2rem);
  border-radius: 1.6rem;
  background: rgba(34, 31, 30, 0.84);
  border-color: rgba(255, 255, 255, 0.06);
}

.demo-copy {
  display: grid;
  gap: 0.45rem;
  text-align: center;
}

.demo-copy h1 {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: clamp(1.95rem, 5vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.05em;
}

.demo-copy p {
  color: var(--textMuted);
  font-size: 0.95rem;
  line-height: 1.6;
}

.persona-stack {
  display: grid;
  gap: 0.8rem;
}

.persona-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.05rem;
  border-radius: 1.05rem;
  border: 1px solid rgba(255, 255, 255, 0.04);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
  text-align: left;
}

.persona-card:hover:not(:disabled) {
  border-color: rgba(249, 115, 22, 0.22);
  background: rgba(255, 255, 255, 0.05);
}

.persona-icon {
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.85rem;
  background: rgba(249, 115, 22, 0.12);
  color: var(--primary);
}

.icon,
.chevron {
  width: 1rem;
  height: 1rem;
}

.persona-copy {
  display: grid;
  gap: 0.1rem;
}

.persona-copy strong {
  font-size: 1rem;
}

.persona-copy span {
  color: var(--textMuted);
  font-size: 0.82rem;
  line-height: 1.35;
}

.chevron {
  color: rgba(255, 255, 255, 0.45);
}

.demo-note {
  margin: 0;
  color: rgba(255, 255, 255, 0.64);
  font-size: 0.84rem;
  line-height: 1.55;
}

.demo-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.plain-link {
  color: var(--textMuted);
  font-size: 0.84rem;
  font-weight: 600;
}

.plain-link:hover {
  color: var(--primarySoft);
}
</style>
