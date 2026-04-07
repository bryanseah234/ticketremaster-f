<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="notfound-page">
    <article class="notfound-shell panel">
      <span class="eyebrow">Lost In The Ledger</span>
      <h1>Page not found.</h1>
      <p>The route you requested does not exist in the current TicketRemaster experience.</p>
      <div class="actions">
        <RouterLink to="/"><button>Back to Home</button></RouterLink>
        <RouterLink to="/events"><button class="secondary">Browse Events</button></RouterLink>
      </div>
    </article>
  </section>
</template>

<style scoped>
.notfound-page { display: grid; place-items: center; min-height: calc(100vh - 12rem); }
.notfound-shell { width: min(100%, 40rem); display: grid; gap: 1rem; text-align: center; }
.eyebrow { color: var(--primary); font-size: .72rem; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
.notfound-shell h1 {
  margin: 0; font-family: var(--font-display); font-size: clamp(2.6rem, 6vw, 4.2rem); line-height: .95; letter-spacing: -.05em;
}
.notfound-shell p { margin: 0; color: var(--text-muted); line-height: 1.7; }
.actions { display: flex; justify-content: center; gap: .75rem; flex-wrap: wrap; }
</style>
