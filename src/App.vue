<script setup>

</script>

<template>
  <div id="app">
    <!-- Navigation Bar -->
    <nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top border-bottom">
      <div class="container-lg">
        <router-link to="/" class="navbar-brand fw-bold">
          <span style="color: #ff3b30; font-size: 24px;">TicketRemaster</span>
        </router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto gap-3">
            <li class="nav-item"><router-link class="nav-link" to="/">Home</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/events">Browse Events</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/marketplace">Marketplace</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/profile">Profile</router-link></li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <router-view></router-view>
    </main>

    <!-- Footer -->
    <footer class="bg-dark text-white py-5 mt-5">
      <div class="container-lg">
        <div class="row">
          <div class="col-md-3 mb-4">
            <h6 class="fw-bold">TicketRemaster</h6>
            <small class="text-muted">Your next best night-ever awaits</small>
          </div>
          <div class="col-md-3 mb-4">
            <h6 class="fw-bold">Company</h6>
            <ul class="list-unstyled small">
              <li><a href="#" class="text-muted text-decoration-none">About</a></li>
              <li><a href="#" class="text-muted text-decoration-none">Jobs</a></li>
              <li><a href="#" class="text-muted text-decoration-none">Help</a></li>
            </ul>
          </div>
          <div class="col-md-3 mb-4">
            <h6 class="fw-bold">Legal</h6>
            <ul class="list-unstyled small">
              <li><a href="#" class="text-muted text-decoration-none">Privacy</a></li>
              <li><a href="#" class="text-muted text-decoration-none">Terms</a></li>
              <li><a href="#" class="text-muted text-decoration-none">Accessibility</a></li>
            </ul>
          </div>
          <div class="col-md-3 mb-4">
            <h6 class="fw-bold">Follow</h6>
            <small class="text-muted">
              <a href="#" class="text-muted text-decoration-none">Twitter</a> • 
              <a href="#" class="text-muted text-decoration-none">Facebook</a> • 
              <a href="#" class="text-muted text-decoration-none">Instagram</a>
            </small>
          </div>
        </div>
        <hr class="text-secondary">
        <div class="text-center small text-muted">
          © 2026 TicketRemaster. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  color: #333;
}

main {
  min-height: calc(100vh - 200px);
}

.navbar-brand {
  font-weight: 700;
  font-size: 24px;
}

.navbar-nav .nav-link {
  color: #666 !important;
  font-weight: 500;
  transition: color 0.3s;
}

.navbar-nav .nav-link:hover {
  color: #ff3b30 !important;
}
</style>
