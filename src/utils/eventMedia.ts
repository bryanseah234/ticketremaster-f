import type { EventType } from '@/types'

export type EventMediaContext = 'landing' | 'event' | 'marketplace' | 'ticket' | 'detail' | 'checkout'

const mediaByContext: Record<EventMediaContext, Record<string, string>> = {
  landing: {
    'demo-event-001': '/stitch-media/home/home-featured-festival.jpg',
    'demo-event-002': '/stitch-media/home/home-featured-opera.jpg',
    'demo-event-003': '/stitch-media/home/home-featured-finals.jpg',
    'demo-event-004': '/stitch-media/home/home-gallery-violin.jpg',
    'demo-event-005': '/stitch-media/home/home-gallery-basketball.jpg',
    'demo-event-006': '/stitch-media/home/home-gallery-museum.jpg',
  },
  event: {
    'demo-event-001': '/stitch-media/events/curated-featured.jpg',
    'demo-event-002': '/stitch-media/events/curated-sports.jpg',
    'demo-event-003': '/stitch-media/marketplace/listing-hamlet.jpg',
    'demo-event-004': '/stitch-media/events/curated-conference.jpg',
    'demo-event-005': '/stitch-media/marketplace/listing-neon-horizon.jpg',
    'demo-event-006': '/stitch-media/events/curated-jazz.jpg',
  },
  marketplace: {
    'demo-event-001': '/stitch-media/marketplace/listing-neon-horizon.jpg',
    'demo-event-002': '/stitch-media/marketplace/listing-finals.jpg',
    'demo-event-003': '/stitch-media/marketplace/listing-hamlet.jpg',
    'demo-event-004': '/stitch-media/events/curated-conference.jpg',
    'demo-event-005': '/stitch-media/marketplace/listing-midnight-jazz.jpg',
    'demo-event-006': '/stitch-media/marketplace/listing-midnight-jazz.jpg',
  },
  ticket: {
    'demo-event-001': '/stitch-media/tickets/ticket-mainstage.jpg',
    'demo-event-002': '/stitch-media/tickets/ticket-vip.jpg',
    'demo-event-003': '/stitch-media/marketplace/listing-hamlet.jpg',
    'demo-event-004': '/stitch-media/events/curated-conference.jpg',
    'demo-event-005': '/stitch-media/tickets/ticket-mainstage.jpg',
    'demo-event-006': '/stitch-media/tickets/ticket-vip.jpg',
  },
  detail: {
    'demo-event-001': '/stitch-media/marketplace/listing-neon-horizon.jpg',
    'demo-event-002': '/stitch-media/marketplace/listing-finals.jpg',
    'demo-event-003': '/stitch-media/marketplace/listing-hamlet.jpg',
    'demo-event-004': '/stitch-media/events/curated-conference.jpg',
    'demo-event-005': '/stitch-media/marketplace/listing-neon-horizon.jpg',
    'demo-event-006': '/stitch-media/tickets/ticket-mainstage.jpg',
  },
  checkout: {
    'demo-event-001': '/stitch-media/checkout/summary-card.jpg',
    'demo-event-002': '/stitch-media/marketplace/listing-finals.jpg',
    'demo-event-003': '/stitch-media/marketplace/listing-hamlet.jpg',
    'demo-event-004': '/stitch-media/events/curated-conference.jpg',
    'demo-event-005': '/stitch-media/marketplace/listing-midnight-jazz.jpg',
    'demo-event-006': '/stitch-media/tickets/ticket-vip.jpg',
  },
}

const fallbackByType: Record<EventType, string> = {
  concert: '/stitch-media/events/curated-featured.jpg',
  sports: '/stitch-media/events/curated-sports.jpg',
  theater: '/stitch-media/marketplace/listing-hamlet.jpg',
  conference: '/stitch-media/events/curated-conference.jpg',
  festival: '/stitch-media/marketplace/listing-neon-horizon.jpg',
  other: '/stitch-media/events/curated-jazz.jpg',
}

export function resolveEventImage(options: {
  image?: string
  eventId?: string
  type?: EventType
  context?: EventMediaContext
}): string | undefined {
  if (options.image) return options.image

  const context = options.context ?? 'event'
  if (options.eventId && mediaByContext[context][options.eventId]) {
    return mediaByContext[context][options.eventId]
  }

  if (options.type) return fallbackByType[options.type]
  return undefined
}
