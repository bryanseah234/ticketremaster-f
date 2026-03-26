<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const qrHash = route.params.qrHash as string
</script>

<template>
  <section class="qr-page">
    <div class="qr-card glass">
      <div class="logo-row">
        <svg viewBox="0 0 24 24" class="logo-icon"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg>
        <span class="logo-text">TicketRemaster</span>
      </div>

      <div class="divider" />

      <p class="label">Ticket Reference</p>
      <p class="hash">{{ qrHash.slice(0, 16) }}…</p>

      <div class="divider" />

      <p class="instruction">Present this ticket to venue staff at the gate for entry verification.</p>

      <div class="badge-row">
        <span class="badge-verified">
          <svg viewBox="0 0 24 24" class="badge-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Verified Ticket
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.qr-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
  background: var(--bg);
}

.qr-card {
  width: 100%;
  max-width: 360px;
  padding: 2rem 1.5rem;
  border-radius: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  text-align: center;
}

.logo-row {
  display: flex;
  align-items: center;
  gap: .5rem;
}
.logo-icon {
  width: 1.4rem;
  height: 1.4rem;
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.8;
  stroke-linecap: round;
}
.logo-text {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text);
}

.divider {
  width: 100%;
  border-top: 1px dashed var(--border);
}

.label {
  font-size: .72rem;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--muted);
  margin: 0;
}

.hash {
  font-size: .85rem;
  font-family: monospace;
  color: var(--text);
  background: var(--surface-2);
  padding: .35rem .75rem;
  border-radius: .5rem;
  margin: 0;
  word-break: break-all;
}

.instruction {
  font-size: .88rem;
  color: var(--muted);
  line-height: 1.55;
  margin: 0;
}

.badge-row {
  display: flex;
  justify-content: center;
}
.badge-verified {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  font-size: .78rem;
  font-weight: 700;
  color: #4ade80;
  background: rgba(34,197,94,.15);
  border: 1px solid rgba(34,197,94,.35);
  padding: .3rem .75rem;
  border-radius: 999px;
}
.badge-icon {
  width: .85rem;
  height: .85rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}
</style>
