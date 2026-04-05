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
  <section class="info-page">
    <header class="hero panel">
      <span class="eyebrow">TicketRemaster Guide</span>
      <h1>{{ props.title }}</h1>
      <p>{{ props.subtitle }}</p>
    </header>

    <section class="content-grid">
      <article v-for="section in props.sections" :key="section.heading" class="section-card panel">
        <span class="meta-label">Section</span>
        <h2>{{ section.heading }}</h2>
        <p>{{ section.body }}</p>
      </article>
    </section>
  </section>
</template>

<style scoped>
.info-page, .hero { display: grid; gap: 1rem; }
.eyebrow, .meta-label {
  font-size: .7rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase;
}
.eyebrow { color: var(--primary); }
.meta-label { color: var(--text-dim); }
.hero h1 {
  margin: 0; font-family: var(--font-display); font-size: clamp(2.6rem, 5vw, 4.6rem); line-height: .95; letter-spacing: -.05em;
}
.hero p, .section-card p { margin: 0; color: var(--text-muted); line-height: 1.75; }
.content-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1rem; }
.section-card { display: grid; gap: .75rem; min-height: 13rem; }
.section-card h2 { margin: 0; font-size: 1.35rem; }
@media (max-width: 800px) {
  .content-grid { grid-template-columns: 1fr; }
}
</style>
