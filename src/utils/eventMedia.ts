import type { EventType } from '@/types'

export type EventMediaContext = 'landing' | 'event' | 'listing' | 'marketplace' | 'ticket' | 'detail' | 'checkout'

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
  listing: {
    'demo-event-001': '/stitch-media/listing/listing-featured-rooftop.jpg',
    'demo-event-002': '/stitch-media/listing/listing-neon-resonance.jpg',
    'demo-event-003': '/stitch-media/listing/listing-obsidian-jazz.jpg',
    'demo-event-004': '/stitch-media/listing/listing-kinetic-summit.jpg',
    'demo-event-005': '/stitch-media/listing/listing-midnight-gallery.jpg',
    'demo-event-006': '/stitch-media/listing/listing-kinetic-summit.jpg',
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
    'demo-event-001': '/stitch-media/listing/ticket-illuminated-nights.jpg',
    'demo-event-002': '/stitch-media/listing/ticket-synthetica-underground.jpg',
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
  theatre: '/stitch-media/marketplace/listing-hamlet.jpg',
  classical: '/stitch-media/events/curated-jazz.jpg',
  festival: '/stitch-media/marketplace/listing-neon-horizon.jpg',
  other: '/stitch-media/events/curated-jazz.jpg',
}

export function resolveEventImage(options: {
  image?: string
  eventId?: string
  type?: EventType
  context?: EventMediaContext
}): string | undefined {
  const context = options.context ?? 'event'
  const eventId = options.eventId
  const contextMedia = eventId ? mediaByContext[context][eventId] : undefined
  const prefersLocalContextMedia = Boolean(eventId?.startsWith('demo-') && contextMedia)

  if (prefersLocalContextMedia) {
    return contextMedia
  }

  if (options.image) return options.image

  if (contextMedia) {
    return contextMedia
  }

  if (options.type) return fallbackByType[options.type]
  return undefined
}
