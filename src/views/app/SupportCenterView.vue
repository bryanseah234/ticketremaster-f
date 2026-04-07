<script setup lang="ts">
import { ref } from 'vue'
import { MagnifyingGlassIcon, ArrowRightIcon, ChatBubbleLeftRightIcon, CreditCardIcon, LockClosedIcon, TicketIcon } from '@heroicons/vue/24/outline'

const supportCards = [
  {
    title: 'Ticket Troubleshooting',
    body: 'Issues with barcode scanning, wallet delivery, or ticket downloads? Start with the most common fixes here.',
    cta: 'View Solutions',
    icon: TicketIcon,
  },
  {
    title: 'Payments & Credits',
    body: 'Manage billing history, pending credits, and top-up questions without leaving the editorial flow.',
    cta: 'Manage Billing',
    icon: CreditCardIcon,
  },
  {
    title: 'Account Security',
    body: 'Update your profile, verify access, and recover your account with the same security-first system used in live mode.',
    cta: 'Security Settings',
    icon: LockClosedIcon,
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
        <h1 class="support-title">
          <span class="support-title-accent">Support</span>
          <span>Center</span>
        </h1>
        <p class="section-subtitle">
          Everything you need to manage your tickets, marketplace transactions, and account security in one place.
        </p>
        <div class="support-search-wrap">
          <MagnifyingGlassIcon class="search-icon" />
          <input type="search" class="support-search" placeholder="Search for help..." />
        </div>
      </div>
    </article>

    <div class="support-bento">
      <article class="support-card-featured panel">
        <div class="featured-overlay" aria-hidden="true"></div>
        <div class="featured-content">
          <span class="priority-chip"><span class="priority-dot"></span>Priority Support</span>
          <h2 class="featured-heading">Contact Concierge</h2>
          <p class="featured-body">Our premium support team is available 24/7 to assist with complex transfers, large orders, and exclusive event access.</p>
          <button class="featured-button" type="button">
            Start Chat
            <ChatBubbleLeftRightIcon class="featured-button-icon" />
          </button>
        </div>
      </article>

      <article v-for="card in supportCards" :key="card.title" class="support-card-topic panel">
        <div class="icon-avatar-shell" aria-hidden="true">
          <component :is="card.icon" class="topic-icon" />
        </div>
        <h3>{{ card.title }}</h3>
        <p>{{ card.body }}</p>
        <button class="card-arrow-link" type="button" :aria-label="card.cta">
          {{ card.cta }}
          <ArrowRightIcon class="arrow-icon" />
        </button>
      </article>
    </div>

    <section class="faq-section">
      <div class="faq-head">
        <div>
          <h2 class="faq-heading">Common Questions</h2>
          <p class="faq-subhead">The fastest way to get back to the show.</p>
        </div>
        <button class="faq-link" type="button">View Full FAQ</button>
      </div>
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
  gap: 1.5rem;
}

.support-hero,
.contact-panel {
  padding: 1.75rem;
  display: grid;
  gap: 1rem;
}

.support-copy {
  display: grid;
  gap: 0.8rem;
}

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
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(14, 14, 14, 0.88)),
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.24), transparent 30%),
    radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.06), transparent 24%),
    rgba(30, 28, 27, 0.9);
}

.featured-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.18) 0%, rgba(0, 0, 0, 0.45) 100%);
  pointer-events: none;
}

.featured-content {
  position: relative;
  display: grid;
  gap: 0.75rem;
  max-width: 34rem;
}

.featured-heading {
  font-size: clamp(2rem, 3.5vw, 2.8rem);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -0.05em;
}

.featured-body {
  color: var(--textMuted);
  line-height: 1.6;
  font-size: 0.9rem;
}

.priority-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  width: fit-content;
  padding: 0.42rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(249, 115, 22, 0.3);
  background: rgba(249, 115, 22, 0.14);
  color: var(--primarySoft);
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.priority-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: var(--primary);
  box-shadow: 0 0 16px rgba(249, 115, 22, 0.8);
}

.featured-button {
  width: fit-content;
  margin-top: 0.25rem;
  padding: 0.95rem 1.25rem;
  border-radius: 0.95rem;
  border: 0;
  background: linear-gradient(135deg, #f97316 0%, #ff7a23 100%);
  color: #fff;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  box-shadow: 0 10px 30px rgba(249, 115, 22, 0.22);
}

.featured-button-icon {
  width: 1rem;
  height: 1rem;
}

.support-card-topic {
  grid-column: span 4;
  padding: 1.25rem;
  display: grid;
  gap: 0.8rem;
}

.support-card-topic h3 {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.support-card-topic p {
  line-height: 1.65;
  color: var(--textMuted);
  font-size: 0.9rem;
}

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

.topic-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--primary);
}

.card-arrow-link {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-self: start;
  gap: 0.45rem;
  color: var(--primarySoft);
  font-weight: 700;
}

.arrow-icon {
  width: 1.1rem;
  height: 1.1rem;
}

@media (max-width: 900px) {
  .support-card-featured,
  .support-card-topic {
    grid-column: span 12;
  }
}

.faq-section {
  display: grid;
  gap: 0;
  padding: 1.5rem 1.5rem 0;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
}

.faq-head {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  margin-bottom: 1rem;
}

.faq-heading {
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.04em;
}

.faq-subhead {
  margin: 0.25rem 0 0;
  color: var(--textMuted);
}

.faq-link {
  padding: 0 0 0.2rem;
  border: 0;
  background: transparent;
  color: var(--primarySoft);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
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

@media (max-width: 720px) {
  .faq-head {
    align-items: start;
    flex-direction: column;
  }
}
</style>
