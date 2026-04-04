<script setup lang="ts">
import { RouterLink } from 'vue-router'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer-shell">
      <div class="brand-block">
        <span class="badge">TicketRemaster</span>
        <h2>Premium ticketing with verified resale built in.</h2>
        <p class="small muted">Buy smarter, sell safer, and move through live-event journeys with confidence.</p>
      </div>

      <div class="link-grid">
        <div class="link-column">
          <strong>Explore</strong>
          <RouterLink to="/events">Events</RouterLink>
          <RouterLink to="/marketplace">Marketplace</RouterLink>
          <RouterLink to="/help">Support</RouterLink>
        </div>
        <div class="link-column">
          <strong>Account</strong>
          <RouterLink to="/login">Login</RouterLink>
          <RouterLink to="/register">Register</RouterLink>
          <RouterLink to="/profile">Profile</RouterLink>
        </div>
        <div class="link-column">
          <strong>Company</strong>
          <RouterLink to="/about">About</RouterLink>
          <RouterLink to="/privacy">Privacy</RouterLink>
          <RouterLink to="/terms">Terms</RouterLink>
        </div>
      </div>
    </div>
    <div class="footer-meta">© {{ year }} TicketRemaster. All rights reserved.</div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--outlineSoft);
  margin-top: 4rem;
  padding: 2.5rem 1rem 1.5rem;
  background: rgba(19, 13, 11, 0.9);
}

.footer-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 2rem;
}

.brand-block {
  display: grid;
  gap: 0.8rem;
}

.brand-block h2 {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: 1.55rem;
  line-height: 1.2;
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.link-column {
  display: grid;
  gap: 0.45rem;
}

.link-column strong {
  color: var(--text);
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.link-column a {
  color: var(--textMuted);
  font-size: 0.92rem;
}

.footer-meta {
  width: min(1180px, 100%);
  margin: 1.5rem auto 0;
  color: var(--textMuted);
  font-size: 0.82rem;
}

@media (max-width: 860px) {
  .footer-shell,
  .link-grid {
    grid-template-columns: 1fr;
  }
}
</style>
