<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy, Eye, EyeOff } from 'lucide-vue-next'

const props = defineProps<{
  label: string
  value?: string | null
  masked?: boolean
  addLabel?: string
  copyable?: boolean
}>()

const emit = defineEmits<{
  add: []
  copy: [value: string]
}>()

const revealed = ref(false)

const hasValue = computed(() => props.value != null && props.value !== '')

const displayValue = computed(() => {
  if (!hasValue.value) return ''
  const v = props.value as string
  if (props.masked && !revealed.value) {
    if (v.length <= 2) return '••'
    return '•'.repeat(v.length - 2) + v.slice(-2)
  }
  return v
})

const toggleReveal = () => {
  revealed.value = !revealed.value
}

const handleCopy = () => {
  if (props.value) emit('copy', props.value)
}
</script>

<template>
  <div class="profile-field">
    <span class="field-label">{{ label }}</span>

    <div class="field-value-wrap">
      <!-- No value: show Add CTA -->
      <button
        v-if="!hasValue && addLabel"
        class="ghost add-btn"
        type="button"
        @click="emit('add')"
      >
        + Add {{ label }}
      </button>

      <!-- Has value -->
      <template v-else-if="hasValue">
        <span
          class="field-value"
          :class="{ masked: masked && !revealed }"
          @click="masked ? toggleReveal() : undefined"
        >{{ displayValue }}</span>

        <div class="field-actions">
          <button
            v-if="masked"
            class="ghost icon-btn"
            type="button"
            :aria-label="revealed ? 'Hide value' : 'Show value'"
            @click="toggleReveal"
          >
            <EyeOff v-if="revealed" :size="15" />
            <Eye v-else :size="15" />
          </button>

          <button
            v-if="copyable"
            class="ghost icon-btn"
            type="button"
            aria-label="Copy to clipboard"
            @click="handleCopy"
          >
            <Copy :size="15" />
          </button>
        </div>
      </template>

      <!-- No value, no addLabel: show dash -->
      <span v-else class="field-empty">—</span>
    </div>
  </div>
</template>

<style scoped>
.profile-field {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--border);
}

.field-label {
  font-size: 0.82rem;
  color: var(--muted);
  min-width: 120px;
  flex-shrink: 0;
}

.field-value-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.field-value {
  font-size: 0.9rem;
  color: var(--text);
  word-break: break-all;
  flex: 1;
}

.field-value.masked {
  cursor: pointer;
  letter-spacing: 0.05em;
}

.field-empty {
  font-size: 0.9rem;
  color: var(--muted);
}

.field-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.add-btn {
  font-size: 0.82rem;
  padding: 0.3rem 0.65rem;
  color: var(--accent);
  border-color: rgba(249, 115, 22, 0.3);
}

.add-btn:hover {
  background: rgba(249, 115, 22, 0.08);
}

.icon-btn {
  padding: 0.3rem;
  border-radius: 0.5rem;
  color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.06);
}
</style>
