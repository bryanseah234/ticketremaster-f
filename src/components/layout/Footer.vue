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
        <p class="tagline">Buy smarter, Sell safer, Experience more live moments</p>
        <div class="copy">© {{ year }} TicketRemaster. All rights reserved.</div>
      </section>

      <section class="links">
        <div class="column">
          <div class="group">
            <h4>Company</h4>
            <RouterLink to="/about">About Us</RouterLink>
            <RouterLink to="/careers">Careers</RouterLink>
          </div>
          <div class="group">
            <h4>Product</h4>
            <RouterLink to="/events">Buy Tickets</RouterLink>
            <RouterLink to="/marketplace">Sell Tickets</RouterLink>
            <RouterLink to="/venues">Venues</RouterLink>
          </div>
        </div>
        <div class="column">
          <div class="group">
            <h4>Legal</h4>
            <RouterLink to="/terms">Terms</RouterLink>
            <RouterLink to="/privacy">Privacy</RouterLink>
          </div>
          <div class="group">
            <h4>Resources</h4>
            <RouterLink to="/help">Help Center</RouterLink>
            <RouterLink to="/resale-guarantees">Resale Guarantees</RouterLink>
          </div>
        </div>
      </section>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  /* padding: 3rem 2rem; */
  background: #0b0b0e;
  border-top: 1px solid var(--border);
}

.inner {
  padding: 5em;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 3rem;
  text-align: center;
  justify-content: center;
}

.brand {
  
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items:center;
  text-align: center;

}

.logo-line {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  justify-content: center;
}

.logo-line img {
  width: 28px;
  height: 28px;
}

h3,
h4 {
  margin: 0;
}

h3 {
  font-size: 1.5rem;
  color: var(--accent);
  font-weight: 800;
}

h4 {
  color: #fff;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
}

p,
a {
  color: var(--muted);
  font-size: 0.925rem;
}

a {
  display: inline-block;
  margin: 0.5rem 0.75rem;
  text-decoration: none;
  transition: color 0.2s;
}

a:hover {
  color: #fff;
}

.links {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: nowrap;
  width: 100%;
}

.column {
  display: flex;
  gap: 2rem;
  min-width: 140px;
  justify-content: center;
}

.group {
  display: grid;
  gap: 0.25rem;
}

.copy {
  text-align: center;
  margin-top: 0.5rem;
  color: var(--muted);
  font-size: 0.85rem;
}

@media (max-width: 1024px) {
  .inner {
    flex-direction: column;
    align-items: center;
    gap: 1.6rem;
  }

  .links {
    gap: 1.2rem;
  }
}

@media (max-width: 640px) {
  .inner {
    gap: 1.2rem;
  }

  .links {
    gap: 1rem;
    flex-direction: column;
    align-items: center;
  }

  .column {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}
</style>
