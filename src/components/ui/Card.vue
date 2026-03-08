<script setup lang="ts">
defineProps<{ className?: string }>()
</script>

<template>
  <article class="card" :class="className">
    <slot />
  </article>
</template>

<style scoped>
.card{
  border-radius:1.2rem;
  border:1px solid rgba(255,255,255,.15);
  background:rgba(27,27,31,.72);
  backdrop-filter:blur(14px);
  box-shadow:0 16px 36px rgba(0,0,0,.42);
}
</style>
