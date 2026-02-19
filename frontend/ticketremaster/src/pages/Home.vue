
<template>
  <div class="home-container">
    <h2>Home</h2>
    <p>Welcome to the Home page.</p>
  </div>
</template>

<script setup>
// ...existing code...
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  background: #f7f7fa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 40px 20px;
}
h2 {
  color: #2c3e50;
  margin-bottom: 12px;
}
p {
  color: #555;
  font-size: 1.1rem;
}
</style>
