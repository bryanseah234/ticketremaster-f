<script setup lang="ts">
import { useRouter } from 'vue-router'
import { CalendarDays, MapPin, Tag } from 'lucide-vue-next'
import type { EventSummary } from '@/types'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  event?: EventSummary
  compact?: boolean
}>()

const emit = defineEmits<{
  click: [eventId: string]
}>()

const router = useRouter()

const handleClick = () => {
  if (!props.event) return
  emit('click', props.event.eventId)
  router.push(`/events/${props.event.eventId}`)
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatPrice = (price: number) => `SGD ${price.toFixed(2)}`
</script>

<template>
  <!-- Skeleton state -->
  <div v-if="!event" class="glass event-card" :class="{ compact }" aria-busy="true">
    <div class="skeleton-img" />
    <div class="card-body">
      <div class="skeleton-line wide" />
      <div class="skeleton-line medium" />
      <div class="skeleton-line narrow" />
    </div>
  </div>

  <!-- Loaded state -->
  <div
    v-else
    class="glass event-card"
    :class="{ compact }"
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <div class="card-img-wrap">
      <img v-if="event.image" :src="event.image" :alt="event.name" class="card-img" />
      <div v-else class="card-img-placeholder">
        <Tag :size="32" />
      </div>
      <div class="img-overlay" />
      <div class="overlay-badges">
        <StatusBadge :label="event.type" />
      </div>
    </div>

    <div class="card-body">
      <h3 class="card-title">{{ event.name }}</h3>

      <div class="card-meta">
        <span class="meta-item">
          <CalendarDays :size="13" />
          {{ formatDate(event.date) }}
        </span>
        <span v-if="event.venue?.name" class="meta-item">
          <MapPin :size="13" />
          {{ event.venue.name }}
        </span>
      </div>

      <div class="card-footer">
        <span class="price">{{ formatPrice(event.price) }}</span>
        <span v-if="event.seatsAvailable !== undefined" class="seats-left">
          {{ event.seatsAvailable }} left
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-card {
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  display: flex;
  flex-direction: column;
}

.event-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 28px 48px rgba(0, 0, 0, 0.55);
}

.event-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Image */
.card-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  flex-shrink: 0;
}

.compact .card-img-wrap {
  aspect-ratio: 2 / 1;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-img-placeholder {
  width: 100%;
  height: 100%;
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
}

.img-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%);
  pointer-events: none;
}

.overlay-badges {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  display: flex;
  gap: 0.35rem;
}

/* Body */
.card-body {
  padding: 0.85rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1;
}

.compact .card-body {
  padding: 0.65rem 0.8rem 0.8rem;
  gap: 0.3rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.compact .card-title {
  font-size: 0.9rem;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: var(--muted);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 0.4rem;
}

.price {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--accent);
}

.compact .price {
  font-size: 0.85rem;
}

.seats-left {
  font-size: 0.72rem;
  color: var(--muted);
}

/* Skeleton */
.skeleton-img {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--surface-2);
  animation: shimmer 1.4s infinite;
}

.skeleton-line {
  height: 0.85rem;
  border-radius: 0.4rem;
  background: var(--surface-2);
  animation: shimmer 1.4s infinite;
}

.skeleton-line.wide { width: 80%; }
.skeleton-line.medium { width: 55%; }
.skeleton-line.narrow { width: 35%; }

@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>
