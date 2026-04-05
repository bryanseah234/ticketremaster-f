<script setup lang="ts">
import { RouterLink } from 'vue-router'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer-shell">
      <div class="brand-block">
        <span class="wordmark">TicketRemaster</span>
        <p>© {{ year }} TicketRemaster. Crafted in the Obsidian Hearth.</p>
      </div>

      <nav class="footer-links" aria-label="Footer">
        <RouterLink to="/terms">Terms</RouterLink>
        <RouterLink to="/privacy">Privacy</RouterLink>
        <RouterLink to="/help">Support</RouterLink>
        <RouterLink to="/about">Contact</RouterLink>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 4rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: #0b0b0b;
}

.footer-shell {
  width: min(100% - 3rem, 78rem);
  margin: 0 auto;
  padding: 4rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

.brand-block {
  display: grid;
  gap: 0.5rem;
}

.wordmark {
  color: var(--primary);
  font-size: 0.92rem;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.brand-block p {
  color: rgba(255, 255, 255, 0.34);
  font-size: 0.74rem;
  font-weight: 500;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.76rem;
  font-weight: 500;
  transition: color 0.18s ease, opacity 0.18s ease;
}

.footer-links a:hover {
  color: #fff;
}

@media (max-width: 720px) {
  .footer-shell {
    width: min(100% - 2rem, 78rem);
    padding: 2.5rem 0;
    flex-direction: column;
    text-align: center;
  }
}
</style>
