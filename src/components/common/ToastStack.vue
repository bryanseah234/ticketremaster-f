<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const toast = useToast()
</script>

<template>
  <aside class="toast-stack">
    <TransitionGroup name="toast">
      <article
        v-for="item in toast.toasts"
        :key="item.id"
        class="toast"
        :class="item.type"
        @click="toast.remove(item.id)"
      >
        <p>{{ item.message }}</p>
      </article>
    </TransitionGroup>
  </aside>
</template>

<style scoped>
.toast-stack{position:fixed;bottom:3.5rem;right:1rem;z-index:120;display:grid;gap:.55rem;width:min(360px,92vw)}
.toast{border:1px solid var(--border);border-left:4px solid var(--accent);background:rgba(22,22,26,.92);backdrop-filter:blur(10px);border-radius:.85rem;padding:.72rem .85rem;box-shadow:0 12px 30px rgba(0,0,0,.45);cursor:pointer}
.toast.error{border-left-color:#ef4444}
.toast.success{border-left-color:#22c55e}
.toast.info{border-left-color:var(--accent)}
p{margin:0;font-size:.9rem;color:var(--text)}
.toast-enter-active,.toast-leave-active{transition:all .2s ease}
.toast-enter-from,.toast-leave-to{opacity:0;transform:translateY(8px)}
</style>
