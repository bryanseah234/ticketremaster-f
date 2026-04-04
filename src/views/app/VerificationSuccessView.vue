<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="page">
    <div class="auth-shell">
      <article class="glass auth-card success-card">
        <div class="success-mark">✓</div>
        <span class="badge">Verification Complete</span>
        <h1 class="section-title">Your account is verified and ready to go.</h1>
        <p class="section-subtitle">You can now browse events, manage tickets, and complete purchases with your verified TicketRemaster account.</p>
        <div class="success-actions">
          <RouterLink to="/events"><button>Continue to Events</button></RouterLink>
          <RouterLink to="/profile"><button class="secondary">Open Profile</button></RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.success-card {
  justify-items: center;
  text-align: center;
  padding-block: 2rem;
}

.success-mark {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(82, 209, 140, 0.18);
  color: var(--success);
  font-size: 1.75rem;
  font-weight: 800;
}

.success-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
