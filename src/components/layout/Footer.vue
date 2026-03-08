<template>
  <footer class="footer">
    <div class="inner">
      <div class="lead">
        <div class="logo-line">
          <img src="/logo.svg" alt="TicketRemaster logo" />
          <h3>TicketRemaster</h3>
        </div>
        <p>Buy smarter. Sell safer. Experience more live moments.</p>
      </div>
      <div><h4>Product</h4><a href="#">Buy Tickets</a><a href="#">Sell Tickets</a><a href="#">Venues</a></div>
      <div><h4>Company</h4><a href="#">About Us</a><a href="#">Careers</a></div>
      <div><h4>Resources</h4><a href="#">Help Center</a><a href="#">Resale Guarantees</a></div>
      <div><h4>Legal</h4><a href="#">Terms</a><a href="#">Privacy</a></div>
    </div>
    <p class="copy">© 2026 TicketRemaster. All rights reserved.</p>
  </footer>
</template>

<style scoped>
.footer{padding:2.5rem 1rem;background:#0b0b0e;border-top:1px solid var(--border)}
.inner{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:2fr repeat(4,1fr);gap:1rem}
.logo-line{display:flex;align-items:center;gap:.45rem;margin-bottom:.55rem}
.logo-line img{width:20px;height:20px}
h3,h4{margin-bottom:.55rem} h3{color:#ffd3b8}
p,a{color:var(--muted)} a{display:block;margin:.25rem 0}
a:hover{color:#fff}
.copy{max-width:1180px;margin:1.4rem auto 0;color:var(--muted)}
@media (max-width:900px){.inner{grid-template-columns:1fr 1fr}}
</style>
