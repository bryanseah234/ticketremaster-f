<script setup lang="ts">
defineProps<{ currentStep: number }>()
const steps = ['Pick a date', 'Select seats', 'Confirm purchase']
</script>

<template>
  <div class="step-bar">
    <template v-for="(label, i) in steps" :key="i">
      <div class="step-pill" :class="{ active: currentStep >= i + 1, current: currentStep === i + 1 }">
        <span class="num">{{ i + 1 }}</span>
        <span class="lbl">{{ label }}</span>
      </div>
      <div v-if="i < steps.length - 1" class="connector" :class="{ done: currentStep > i + 1 }" />
    </template>
  </div>
</template>

<style scoped>
.step-bar {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0;
}

.step-pill {
  display: flex;
  align-items: center;
  gap: .45rem;
  padding: .35rem .75rem;
  border-radius: 999px;
  background: rgba(255,255,255,.08);
  white-space: nowrap;
  font-size: .82rem;
  font-weight: 500;
  color: rgba(255,255,255,.45);
  flex-shrink: 0;
  transition: background .2s, color .2s;
}

.step-pill.active {
  background: #2563eb;
  color: #fff;
}

.num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255,255,255,.2);
  display: grid;
  place-items: center;
  font-size: .72rem;
  font-weight: 700;
  flex-shrink: 0;
}

.step-pill.active .num {
  background: rgba(255,255,255,.3);
}

.connector {
  flex: 1;
  height: 2px;
  background: rgba(255,255,255,.1);
  transition: background .2s;
  min-width: 12px;
}

.connector.done {
  background: #2563eb;
}

@media (max-width: 540px) {
  .lbl { display: none; }
  .step-pill { padding: .35rem .55rem; }
}
</style>
