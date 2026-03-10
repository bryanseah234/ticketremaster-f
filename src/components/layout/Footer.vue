<script setup lang="ts">
import { RouterLink } from 'vue-router'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="inner">
      <section class="brand">
        <div class="logo-line">
          <img src="/logo.svg" alt="TicketRemaster logo" />
          <h3>TicketRemaster</h3>
        </div>
        <p class="tagline">Buy smarter</p>
        <p class="tagline">Sell safer</p>
        <p class="tagline">Experience more live moments</p>
      </section>

      <section class="links">
        <div class="column">
          <div class="group">
            <h4>Company</h4>
            <RouterLink to="/about">About Us</RouterLink>
            <RouterLink to="/careers">Careers</RouterLink>
          </div>
          <div class="group">
            <h4>Legal</h4>
            <RouterLink to="/terms">Terms</RouterLink>
            <RouterLink to="/privacy">Privacy</RouterLink>
          </div>
        </div>
        <div class="column">
          <div class="group">
            <h4>Product</h4>
            <RouterLink to="/events">Buy Tickets</RouterLink>
            <RouterLink to="/marketplace">Sell Tickets</RouterLink>
            <RouterLink to="/venues">Venues</RouterLink>
          </div>
          <div class="group">
            <h4>Resources</h4>
            <RouterLink to="/help">Help Center</RouterLink>
            <RouterLink to="/resale-guarantees">Resale Guarantees</RouterLink>
          </div>
        </div>
      </section>

      <div class="copy">© {{ year }} TicketRemaster. All rights reserved.</div>
    </div>
  </footer>
</template>

<style scoped>
.footer{padding:2.5rem 1rem;background:#0b0b0e;border-top:1px solid var(--border)}
.inner{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1.3fr 2fr;gap:2rem}
.brand{display:grid;gap:.5rem}
.logo-line{display:flex;align-items:center;gap:.45rem}
.logo-line img{width:20px;height:20px}
h3,h4{margin:0 0 .55rem} h3{color:var(--accent)}
p,a{color:var(--muted)} a{display:block;margin:.25rem 0}
a:hover{color:#fff}
.links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.5rem}
.column{display:contents}
.group{display:grid;gap:.25rem}
.copy{grid-column:1/-1;text-align:center;margin-top:1.4rem;color:var(--muted)}
@media (max-width:900px){
  .inner{grid-template-columns:1fr;gap:1.6rem}
  .links{grid-template-columns:repeat(2,minmax(0,1fr));gap:1.2rem}
}
@media (max-width:640px){
  .brand{align-items:center;text-align:center}
  .logo-line{justify-content:center}
  .links{grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
}
</style>
