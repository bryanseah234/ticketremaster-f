<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Card from '@/components/ui/Card.vue'
import { useOutsideClick } from '@/composables/useOutsideClick'
import api from '@/api/client'
import { featuredFallback } from '@/data/mockEvents'

interface EventCard {
  id: string
  name: string
  date: string
  venue: string
  price: string
  image: string
}

const cards = ref<EventCard[]>([])

const loadFeatured = async () => {
  try {
    const { data } = await api.get('/events', { params: { per_page: 8, featured: true } })
    const items = (data?.data || []).slice(0, 8).map((event: any) => ({
      id: event.event_id,
      name: event.name,
      date: new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      venue: event?.venue?.name || 'Venue TBA',
      price: `$${event?.pricing_tiers?.[0]?.price ?? 59}`,
      image: event?.image || featuredFallback[0].image,
    }))
    cards.value = items.length ? items : featuredFallback.map((event) => ({
      id: event.event_id,
      name: event.name,
      date: new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      venue: event.venue.name,
      price: `$${event.pricing_tiers[0].price}`,
      image: event.image,
    }))
  } catch {
    cards.value = featuredFallback.map((event) => ({
      id: event.event_id,
      name: event.name,
      date: new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      venue: event.venue.name,
      price: `$${event.pricing_tiers[0].price}`,
      image: event.image,
    }))
  }
}

const active = ref<EventCard | null>(null)
const modalRef = ref<HTMLElement | null>(null)
useOutsideClick(modalRef, () => (active.value = null))
onMounted(loadFeatured)
</script>

<template>
  <section class="page" style="padding-top:2.4rem;padding-bottom:2.2rem;">
    <h2 class="section-title">Featured Events</h2>
    <p class="section-subtitle">Our editor's top picks for you.</p>

    <div class="rail">
      <button v-for="c in cards" :key="c.id" class="tile" @click="active = c">
        <Card>
          <img :src="c.image" :alt="c.name" />
          <div class="tint"></div>
          <div class="copy">
            <p>{{ c.date }}</p>
            <h3>{{ c.name }}</h3>
            <span>{{ c.venue }}</span>
          </div>
        </Card>
      </button>
    </div>

    <Transition name="fade">
      <div v-if="active" class="modal-bg">
        <article ref="modalRef" class="glass modal">
          <button class="secondary" style="justify-self:end" @click="active = null">Close</button>
          <h3>{{ active.name }}</h3>
          <p class="small">{{ active.date }} · {{ active.venue }}</p>
          <p class="price">From {{ active.price }}</p>
          <RouterLink to="/events"><button>View</button></RouterLink>
        </article>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.rail{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(250px,320px);gap:1rem;overflow:auto;padding-bottom:.3rem}
.tile{background:none;border:none;padding:0;text-align:left}
.tile article{position:relative;overflow:hidden;height:380px}
img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.tint{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,10,10,.85),rgba(10,10,10,.22))}
.copy{position:absolute;left:1rem;right:1rem;bottom:1rem;display:grid;gap:.24rem;color:#fff}
.copy p,.copy h3,.copy span{color:#fff;text-shadow:0 6px 18px rgba(0,0,0,.6)}
.copy h3{font-size:1.2rem}
.copy span{opacity:.9;font-size:.86rem}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.74);display:grid;place-items:center;padding:1rem;backdrop-filter:blur(8px);z-index:95}
.modal{width:min(460px,100%);padding:1rem;display:grid;gap:.55rem}
.price{color:#fdba74;font-size:1.35rem;font-weight:700}
.fade-enter-active,.fade-leave-active{transition:opacity .18s ease}.fade-enter-from,.fade-leave-to{opacity:0}
</style>
