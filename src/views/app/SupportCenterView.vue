<script setup lang="ts">
import { RouterLink } from 'vue-router'

const supportCards = [
  {
    title: 'Buying tickets',
    body: 'Browse events, compare listings, reserve seats, and complete checkout with credits in a single flow.',
  },
  {
    title: 'Transfers and resale',
    body: 'Manage seller acceptance, OTP checks, and protected resale with clear status updates for both parties.',
  },
  {
    title: 'Account and verification',
    body: 'Register, verify your phone number, and recover access without leaving the app experience.',
  },
  {
    title: 'Payments and top-ups',
    body: 'Use secure top-up and purchase flows with clear feedback around balance, holds, and payment status.',
  },
]
</script>

<template>
  <section class="page support-page">
    <article class="support-hero glass">
      <div class="support-copy">
        <span class="badge">Support Center</span>
        <h1 class="section-title">Help for buyers, sellers, staff, and organizers.</h1>
        <p class="section-subtitle">
          Find guidance for booking tickets, verifying accounts, resolving transfer issues, and getting event-day support.
        </p>
      </div>
      <div class="support-actions">
        <RouterLink to="/events"><button>Browse Events</button></RouterLink>
        <RouterLink to="/marketplace"><button class="secondary">Open Marketplace</button></RouterLink>
      </div>
    </article>

    <div class="grid-2 support-grid">
      <article v-for="card in supportCards" :key="card.title" class="support-card panel">
        <span class="badge">{{ card.title }}</span>
        <p>{{ card.body }}</p>
      </article>
    </div>

    <article class="glass contact-panel">
      <div>
        <span class="badge">Need more help?</span>
        <h2>Contact TicketRemaster support</h2>
        <p class="small muted">Our support team can help with payment issues, transfer disputes, and event-day access questions.</p>
      </div>
      <div class="grid-2 contact-grid">
        <div class="panel contact-card">
          <strong>Email</strong>
          <p>support@ticketremaster.com</p>
        </div>
        <div class="panel contact-card">
          <strong>Priority line</strong>
          <p>Available for event-day urgent issues and venue staff coordination.</p>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.support-page {
  display: grid;
  gap: 1.25rem;
}

.support-hero,
.contact-panel {
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
}

.support-copy {
  display: grid;
  gap: 0.8rem;
}

.support-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.support-grid {
  align-items: stretch;
}

.support-card,
.contact-card {
  padding: 1.25rem;
  display: grid;
  gap: 0.8rem;
}

.support-card p,
.contact-card p {
  line-height: 1.65;
  color: var(--textMuted);
}

.contact-grid {
  gap: 1rem;
}

.contact-panel h2 {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: 1.4rem;
}
</style>
