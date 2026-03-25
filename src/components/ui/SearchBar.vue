<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const query = ref('')
const router = useRouter()

const submit = () => {
  const q = query.value.trim()
  router.push(q ? `/events?search=${encodeURIComponent(q)}` : '/events')
}
</script>

<template>
  <form class="search" @submit.prevent="submit">
    <input v-model="query" placeholder="Search artists, events, venues" @keyup.enter="submit" />
    <button type="submit">Search</button>
  </form>
</template>

<style scoped>
.search{display:flex;align-items:center;gap:.5rem;padding:.45rem .5rem .45rem .8rem;border-radius:999px;background:rgba(16,16,20,.72);border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(14px);width:min(560px,90vw);margin:0 auto}
input{background:transparent;border:none;padding:0;color:#fff}
input:focus{outline:none}
button{padding:.45rem .82rem}
</style>
