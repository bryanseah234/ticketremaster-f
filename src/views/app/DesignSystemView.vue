<script setup lang="ts">
import theme from '@/config/theme'

const tokenGroups = [
  { title: 'Core Surfaces', keys: ['background', 'surface', 'surfaceSoft', 'surfaceStrong', 'border'] },
  { title: 'Brand Signals', keys: ['primary', 'primarySoft', 'secondary', 'secondarySoft'] },
  { title: 'Text Hierarchy', keys: ['text', 'textMuted', 'textDim'] },
  { title: 'Feedback', keys: ['success', 'warning', 'danger'] },
]
</script>

<template>
  <section class="design-page">
    <header class="hero panel">
      <span class="eyebrow">Frontend System</span>
      <h1>Design System Preview</h1>
      <p>Live semantic tokens, core surfaces, and the reusable component language behind the current frontend refresh.</p>
    </header>

    <section class="group-grid">
      <article v-for="group in tokenGroups" :key="group.title" class="token-group panel">
        <h2>{{ group.title }}</h2>
        <div class="token-list">
          <div v-for="key in group.keys" :key="key" class="token-card">
            <div class="swatch" :style="{ background: (theme.colors as Record<string, string>)[key] }"></div>
            <strong>{{ key }}</strong>
            <code>{{ (theme.colors as Record<string, string>)[key] }}</code>
          </div>
        </div>
      </article>
    </section>

    <section class="example-grid">
      <article class="panel sample-card">
        <h3>Buttons</h3>
        <div class="row"><button>Primary</button><button class="secondary">Secondary</button><button class="ghost">Ghost</button></div>
        <h3>Inputs</h3>
        <input placeholder="Search artists or venues" />
        <select><option>Editorial Select</option><option>Secondary Option</option></select>
        <textarea rows="3" placeholder="Shared textarea surface"></textarea>
      </article>

      <article class="panel sample-card">
        <h3>Typography</h3>
        <h1 class="display">Display Heading</h1>
        <p>Base body copy used across content-heavy panels and route-level guidance surfaces.</p>
        <p class="muted">Muted copy for metadata, timestamps, and supporting descriptions.</p>
        <div class="row"><span class="badge">Badge</span><span class="badge">Accent</span></div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.design-page, .hero { display: grid; gap: 1rem; }
.eyebrow {
  color: var(--primary); font-size: .7rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase;
}
.hero h1 {
  margin: 0; font-family: var(--font-display); font-size: clamp(2.6rem, 5vw, 4.6rem); line-height: .95; letter-spacing: -.05em;
}
.hero p, .sample-card p { margin: 0; color: var(--text-muted); line-height: 1.7; }
.group-grid, .example-grid { display: grid; gap: 1rem; }
.token-group { display: grid; gap: 1rem; }
.token-group h2, .sample-card h3 { margin: 0; }
.token-list { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: .75rem; }
.token-card {
  display: grid; gap: .5rem; padding: .8rem; border-radius: 1rem; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05);
}
.swatch { height: 3rem; border-radius: .8rem; border: 1px solid rgba(255,255,255,.08); }
.token-card strong { font-size: .85rem; }
.token-card code { color: var(--text-muted); font-size: .78rem; word-break: break-all; }
.example-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
.sample-card { display: grid; gap: .9rem; }
.display {
  margin: 0; font-family: var(--font-display); font-size: clamp(2rem, 4vw, 3rem); line-height: .95; letter-spacing: -.04em;
}
.muted { color: var(--text-muted); }
@media (max-width: 1100px) {
  .token-list { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .example-grid { grid-template-columns: 1fr; }
}
</style>
