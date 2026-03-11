<script setup lang="ts">
</script>

<template>
  <section class="page resale">
    <article class="glass hero">
      <span class="badge">Resale Guarantees</span>
      <h1 class="section-title">Trusted resale, verified tickets, protected buyers.</h1>
      <p class="section-subtitle">Every listing is verified before it appears. Every purchase is protected end to end.</p>
    </article>

    <section class="grid-2 promise">
      <article class="glass">
        <h2 class="section-title" style="font-size:1.2rem;">Why Buy From Our Marketplace</h2>
        <ul class="why-list small">
          <li>Verified Sellers & Ratings</li>
          <li>100% Buyer Protection</li>
          <li>Mobile Tickets Instant Delivery</li>
          <li>Best Price Guarantee</li>
          <li>No Hidden Fees</li>
          <li>24/7 Customer Support</li>
        </ul>
      </article>
      <article class="glass highlight">
        <aside class="side-panel">
          <span class="badge" style="margin-bottom:.5rem;">Buy Confidence</span>
          <h3>Protected from listing to entry.</h3>
          <p class="small">If a listing cannot be fulfilled, we replace the ticket or refund the full amount automatically.</p>
        </aside>
      </article>
    </section>

    <article class="glass steps">
      <h2 class="section-title" style="font-size:1.2rem;">How it Works</h2>
      <div class="grid-3">
        <div class="panel glass step-card">
          <p class="small">1. Browse Listings</p>
          <p>Explore verified resale listings with clear pricing and seat details.</p>
        </div>
        <div class="panel glass step-card">
          <p class="small">2. Review Details</p>
          <p>Compare pricing, seat location, and seller status before buying.</p>
        </div>
        <div class="panel glass step-card">
          <p class="small">3. Purchase Safely</p>
          <p>Confirm the transfer and receive tickets securely in your account.</p>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.resale{display:grid;gap:1rem}
.hero{padding:1.5rem;display:grid;gap:.5rem}
.promise article{padding:1.2rem;display:grid;gap:.6rem}
.highlight{align-content:start;background:rgba(249,115,22,.05)}
.side-panel{padding:1rem;background:rgba(249,115,22,.12);border-radius:.8rem;border:1px solid rgba(249,115,22,.3)}
.steps{padding:1.5rem;display:grid;gap:1.2rem}
.why-list{list-style:none;margin:0;padding:0;display:grid;gap:.45rem}
.why-list li{padding:.4rem .6rem;border-radius:.6rem;background:rgba(255,255,255,.06);border:1px solid var(--border);font-weight:600}
.step-card{padding:1.2rem;display:grid;gap:.35rem;min-height:140px}
</style>
