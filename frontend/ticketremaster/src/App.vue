<script setup>

</script>

<template>
  <div class="container py-4">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <h1 class="text-primary m-0">TicketRemaster</h1>
      <nav class="navbar navbar-expand navbar-light">
        <ul class="navbar-nav flex-row gap-3 w-100 justify-content-end">
          <li class="nav-item"><router-link class="nav-link" to="/">Home</router-link></li>
          <li class="nav-item"><router-link class="nav-link" to="/profile">Profile</router-link></li>
          <li class="nav-item"><router-link class="nav-link" to="/events">Events</router-link></li>
          <li class="nav-item"><router-link class="nav-link" to="/marketplace">Marketplace</router-link></li>
        </ul>
      </nav>
    </div>
    <div class="bg-white rounded shadow-sm p-4">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped>
</style>
