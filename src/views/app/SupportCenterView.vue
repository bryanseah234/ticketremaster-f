<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'

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

const openFaq = ref<number | null>(null)

const faqItems = [
  {
    q: 'How do I buy tickets on TicketRemaster?',
    a: 'Browse events, select your preferred listing, reserve a seat, and complete checkout using your credit balance. The entire flow takes under two minutes.',
  },
  {
    q: 'How do ticket transfers work?',
    a: 'The seller initiates a transfer request. You receive a notification, review the terms, and confirm with a one-time OTP. Both parties are protected throughout the process.',
  },
  {
    q: 'How do I top up my credit balance?',
    a: 'Go to Credits in your account menu, choose an amount, and complete payment via card. Your balance updates instantly and is ready to use for any purchase.',
  },
  {
    q: 'What happens if my hold expires at checkout?',
    a: 'If the hold timer runs out before you confirm, the seat is released back to the marketplace. You can search for another listing and start a new reservation.',
  },
  {
    q: 'How do I verify my account or recover access?',
    a: 'Account verification uses your registered phone number. If you lose access, use the recovery flow from the login screen to receive a new OTP and reset your session.',
  },
]
</script>

<template>
  <section class="page support-page">
    <article class="support-hero glass">
      <div class="support-copy">
        <span class="badge">Support Center</span>
        <h1 class="support-title">
          <span class="support-title-accent">Support</span>
          <span>Center</span>
        </h1>
        <p class="section-subtitle">
          Find guidance for booking tickets, verifying accounts, resolving transfer issues, and getting event-day support.
        </p>
        <div class="support-search-wrap">
          <MagnifyingGlassIcon class="search-icon" />
          <input type="search" class="support-search" placeholder="Search for help topics..." />
        </div>
      </div>
      <div class="support-actions">
        <RouterLink to="/events"><button>Browse Events</button></RouterLink>
        <RouterLink to="/marketplace"><button class="secondary">Open Marketplace</button></RouterLink>
      </div>
    </article>

    <div class="support-bento">
      <!-- Featured card: Contact Concierge -->
      <article class="support-card-featured panel">
        <div class="featured-overlay" aria-hidden="true"></div>
        <div class="featured-content">
          <span class="badge">Contact Concierge</span>
          <h2 class="featured-heading">Get personal support from our team</h2>
          <p class="featured-body">Our concierge team handles payment disputes, transfer issues, and event-day emergencies with priority response.</p>
        </div>
      </article>

      <!-- Topic cards -->
      <article v-for="card in supportCards" :key="card.title" class="support-card-topic panel">
        <div class="icon-avatar-shell" aria-hidden="true"></div>
        <span class="badge">{{ card.title }}</span>
        <p>{{ card.body }}</p>
        <button class="card-arrow-link" type="button" aria-label="Learn more">
          <ArrowRightIcon class="arrow-icon" />
        </button>
      </article>
    </div>

    <section class="faq-section">
      <h2 class="faq-heading">Common Questions</h2>
      <div
        v-for="(item, i) in faqItems"
        :key="i"
        class="faq-row"
        @click="openFaq = openFaq === i ? null : i"
      >
        <div class="faq-question">
          <span>{{ item.q }}</span>
          <span class="faq-toggle">{{ openFaq === i ? '−' : '+' }}</span>
        </div>
        <p v-if="openFaq === i" class="faq-answer">{{ item.a }}</p>
      </div>
    </section>

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

/* 7.1 — Editorial hero h1 */
.support-title {
  font-size: clamp(3rem, 7vw, 4.5rem);
  font-weight: 800;
  letter-spacing: -0.07em;
  line-height: 0.94;
  display: flex;
  flex-direction: column;
}

.support-title-accent {
  color: var(--primary, #f97316);
}

/* 7.3 — Search bar */
.support-search-wrap {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: rgba(255, 255, 255, 0.4);
  pointer-events: none;
}

.support-search {
  width: 100%;
  border-radius: 999px;
  padding: 1.1rem 1.5rem 1.1rem 3.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text, #fff);
  font-size: 0.95rem;
  outline: none;
}

.support-search::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.support-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* 7.2 — Bento asymmetric grid */
.support-bento {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1rem;
}

.support-card-featured {
  grid-column: span 8;
  min-height: 18rem;
  position: relative;
  overflow: hidden;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.featured-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%);
  pointer-events: none;
}

.featured-content {
  position: relative;
  display: grid;
  gap: 0.6rem;
}

.featured-heading {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.2;
}

.featured-body {
  color: var(--textMuted);
  line-height: 1.6;
  font-size: 0.9rem;
}

/* 7.5 — Topic card */
.support-card-topic {
  grid-column: span 4;
  padding: 1.25rem;
  display: grid;
  gap: 0.8rem;
}

.support-card-topic p {
  line-height: 1.65;
  color: var(--textMuted);
}

/* 7.5 — Icon avatar shell */
.icon-avatar-shell {
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 7.5 — Arrow link */
.card-arrow-link {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-self: start;
  color: var(--textMuted, rgba(255, 255, 255, 0.6));
}

.arrow-icon {
  width: 1.1rem;
  height: 1.1rem;
}

/* Mobile breakpoint */
@media (max-width: 900px) {
  .support-card-featured,
  .support-card-topic {
    grid-column: span 12;
  }
}

/* 7.4 — FAQ section */
.faq-section {
  display: grid;
  gap: 0;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
}

.faq-heading {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.faq-row {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 1rem 0;
  cursor: pointer;
  user-select: none;
}

.faq-row:first-of-type {
  border-top: none;
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-weight: 500;
  font-size: 0.95rem;
}

.faq-toggle {
  font-size: 1.2rem;
  color: var(--primary, #f97316);
  flex-shrink: 0;
  line-height: 1;
}

.faq-answer {
  margin-top: 0.75rem;
  color: var(--textMuted);
  line-height: 1.65;
  font-size: 0.9rem;
}

.contact-card {
  padding: 1.25rem;
  display: grid;
  gap: 0.8rem;
}

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
