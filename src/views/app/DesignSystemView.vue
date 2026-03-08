<script setup lang="ts">
import { themeConfig } from '@/config/theme'
</script>

<template>
  <section class="page">
    <h1 class="section-title">Design System Preview</h1>
    <p class="section-subtitle">Reference from STYLE.md with live theme tokens and components.</p>

    <article class="glass block">
      <h2>Theme tokens</h2>
      <div class="grid-4">
        <div v-for="(value, key) in themeConfig.colors" :key="key" class="panel token">
          <div class="swatch" :style="{background:value}"></div>
          <p class="small">{{ key }}</p>
          <code>{{ value }}</code>
        </div>
      </div>
    </article>

    <div class="grid-2">
      <article class="glass block">
        <h3>Buttons</h3>
        <div class="row"><button>Primary</button><button class="secondary">Secondary</button><button class="ghost">Ghost</button></div>

        <h3>Form controls</h3>
        <label>Text input</label><input placeholder="Example input" />
        <label>Select</label><select><option>Option A</option><option>Option B</option></select>
        <label>Textarea</label><textarea rows="3" placeholder="Notes"></textarea>

        <h3>Binary controls</h3>
        <div class="row">
          <label class="row"><input type="checkbox" /> Checkbox</label>
          <label class="row"><input type="radio" name="r" /> Radio A</label>
          <label class="row"><input type="radio" name="r" /> Radio B</label>
        </div>
      </article>

      <article class="glass block">
        <h3>Typography + content</h3>
        <h1 style="font-size:2rem;">Heading 1</h1>
        <h2 style="font-size:1.45rem;">Heading 2</h2>
        <p>Base text for body copy in the app with high contrast over glass surfaces.</p>
        <p class="small">Muted helper text for secondary information and metadata.</p>
        <div class="row"><span class="badge">Badge</span><span class="badge">Accent Chip</span></div>

        <h3>Cards</h3>
        <article class="panel" style="padding:.75rem;">
          <p class="small">Panel card sample</p>
          <p>Use <code>.panel</code> for compact neutral surfaces.</p>
        </article>
      </article>
    </div>
  </section>
</template>

<style scoped>
.block{padding:1rem;display:grid;gap:.7rem;margin-bottom:1rem}
.token{padding:.6rem;display:grid;gap:.25rem}
.swatch{height:42px;border-radius:8px;border:1px solid var(--border)}
code{font-family:ui-monospace, SFMono-Regular, Menlo, monospace;color:#fed7aa;font-size:.82rem}
</style>
