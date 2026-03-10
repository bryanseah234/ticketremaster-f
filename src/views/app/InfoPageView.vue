<script setup lang="ts">
interface InfoSection {
  heading: string
  body: string
}

const props = defineProps<{
  title: string
  subtitle: string
  sections: InfoSection[]
}>()
</script>

<template>
  <section class="page info-page">
    <article class="glass header">
      <h1 class="section-title">{{ props.title }}</h1>
      <p class="section-subtitle">{{ props.subtitle }}</p>
    </article>

    <div class="grid-2 content">
      <article v-for="section in props.sections" :key="section.heading" class="glass panel">
        <h2>{{ section.heading }}</h2>
        <p class="small">{{ section.body }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.info-page{display:grid;gap:1rem}
.header{padding:1.2rem;display:grid;gap:.4rem}
.content{margin-top:.2rem}
.panel{padding:1rem;display:grid;gap:.5rem}
h2{font-size:1.15rem;margin:0}
</style>
