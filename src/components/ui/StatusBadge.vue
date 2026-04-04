<script setup lang="ts">
import { computed } from 'vue'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'muted' | 'accent'

const SUCCESS_LABELS = new Set(['active', 'completed', 'success'])
const WARNING_LABELS = new Set(['pending', 'held', 'pending_seller_acceptance', 'pending_buyer_otp', 'pending_seller_otp'])
const ERROR_LABELS = new Set(['cancelled', 'expired', 'used', 'error', 'failed'])
const INFO_LABELS = new Set(['listed', 'sold'])

const props = defineProps<{
  label?: string
  variant?: BadgeVariant
}>()

const resolvedVariant = computed<BadgeVariant>(() => {
  if (props.variant) return props.variant
  const key = (props.label ?? '').toLowerCase()
  if (SUCCESS_LABELS.has(key)) return 'success'
  if (WARNING_LABELS.has(key)) return 'warning'
  if (ERROR_LABELS.has(key)) return 'error'
  if (INFO_LABELS.has(key)) return 'info'
  return 'muted'
})
</script>

<template>
  <span class="badge" :class="`badge--${resolvedVariant}`">{{ label ?? '' }}</span>
</template>

<style scoped>
.badge--success {
  color: var(--success);
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.08);
}

.badge--warning {
  color: var(--warning);
  border-color: rgba(250, 204, 21, 0.3);
  background: rgba(250, 204, 21, 0.08);
}

.badge--error {
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.3);
  background: rgba(248, 113, 113, 0.08);
}

.badge--info {
  color: #60a5fa;
  border-color: rgba(96, 165, 250, 0.3);
  background: rgba(96, 165, 250, 0.08);
}

.badge--muted {
  color: var(--muted);
  border-color: var(--border);
  background: rgba(255, 255, 255, 0.03);
}

.badge--accent {
  color: var(--accent);
  border-color: rgba(249, 115, 22, 0.3);
  background: rgba(249, 115, 22, 0.08);
}
</style>
