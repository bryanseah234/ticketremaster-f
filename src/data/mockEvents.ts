export interface MockEvent {
  eventId: string
  name: string
  eventDate: string
  venue: { name: string; city: string }
  pricingTiers: { category: string; price: number }[]
  image: string
  featured?: boolean
}

export const mockEvents: MockEvent[] = [
  { eventId: 'm1', name: 'Neon Skyline Festival', eventDate: '2026-04-12T20:00:00Z', venue: { name: 'Marina Bay Arena', city: 'Singapore' }, pricingTiers: [{ category: 'GA', price: 88 }, { category: 'VIP', price: 180 }], image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1400', featured: true },
  { eventId: 'm2', name: 'Midnight Bass District', eventDate: '2026-05-03T19:30:00Z', venue: { name: 'Pier 9 Hall', city: 'Sydney' }, pricingTiers: [{ category: 'Floor', price: 74 }, { category: 'Premium', price: 132 }], image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1400', featured: true },
  { eventId: 'm3', name: 'Golden Hour Pop Live', eventDate: '2026-06-21T18:00:00Z', venue: { name: 'Staples Dome', city: 'Los Angeles' }, pricingTiers: [{ category: 'Standard', price: 65 }, { category: 'VIP', price: 155 }], image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1400', featured: true },
  { eventId: 'm4', name: 'City Lights Orchestra Night', eventDate: '2026-04-28T20:00:00Z', venue: { name: 'Royal Theatre', city: 'London' }, pricingTiers: [{ category: 'Balcony', price: 54 }, { category: 'Front', price: 120 }], image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1400', featured: true },
  { eventId: 'm5', name: 'Underground Rap Session', eventDate: '2026-03-19T21:00:00Z', venue: { name: 'Warehouse 27', city: 'Berlin' }, pricingTiers: [{ category: 'Entry', price: 48 }, { category: 'Lounge', price: 112 }], image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1400', featured: true },
  { eventId: 'm6', name: 'Stadium Anthems World Tour', eventDate: '2026-07-09T19:00:00Z', venue: { name: 'Azteca Grounds', city: 'Mexico City' }, pricingTiers: [{ category: 'General', price: 98 }, { category: 'Platinum', price: 220 }], image: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=1400', featured: true },
  { eventId: 'm7', name: 'Retro Synthwave Open Air', eventDate: '2026-08-14T18:30:00Z', venue: { name: 'Sunset Park', city: 'San Diego' }, pricingTiers: [{ category: 'GA', price: 59 }, { category: 'VIP', price: 126 }], image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1400', featured: true },
  { eventId: 'm8', name: 'House Beats Rooftop', eventDate: '2026-09-04T20:00:00Z', venue: { name: 'Cloud Nine Rooftop', city: 'Dubai' }, pricingTiers: [{ category: 'Regular', price: 69 }, { category: 'Sky Deck', price: 149 }], image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1400', featured: true },
  { eventId: 'm9', name: 'Indie Summer Caravan', eventDate: '2026-04-02T17:00:00Z', venue: { name: 'Riverfront Stage', city: 'Austin' }, pricingTiers: [{ category: 'GA', price: 42 }, { category: 'VIP', price: 108 }], image: 'https://images.unsplash.com/photo-1521334884684-d80222895322?q=80&w=1400' },
  { eventId: 'm10', name: 'Urban Jazz After Dark', eventDate: '2026-10-11T20:30:00Z', venue: { name: 'Blue Note Hall', city: 'New York' }, pricingTiers: [{ category: 'Standard', price: 57 }, { category: 'Premium', price: 119 }], image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?q=80&w=1400' },
  { eventId: 'm11', name: 'Drumline Championship', eventDate: '2026-05-19T18:30:00Z', venue: { name: 'Metro Stadium', city: 'Chicago' }, pricingTiers: [{ category: 'North Stand', price: 50 }, { category: 'Pitch', price: 130 }], image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?q=80&w=1400' },
  { eventId: 'm12', name: 'Afrobeat Carnival Night', eventDate: '2026-07-26T20:00:00Z', venue: { name: 'Coastline Arena', city: 'Lagos' }, pricingTiers: [{ category: 'GA', price: 45 }, { category: 'VIP', price: 101 }], image: 'https://images.unsplash.com/photo-1571266028243-d220c9f2f352?q=80&w=1400' },
  { eventId: 'm13', name: 'K-Indie Soundstage', eventDate: '2026-06-09T19:00:00Z', venue: { name: 'Mapo Dome', city: 'Seoul' }, pricingTiers: [{ category: 'Standard', price: 61 }, { category: 'Fan Zone', price: 138 }], image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1400' },
  { eventId: 'm14', name: 'Symphony x Cinema Live', eventDate: '2026-11-08T19:30:00Z', venue: { name: 'Opera House', city: 'Paris' }, pricingTiers: [{ category: 'Circle', price: 70 }, { category: 'Stalls', price: 165 }], image: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?q=80&w=1400' },
  { eventId: 'm15', name: 'Sunrise Trance Escape', eventDate: '2026-05-30T04:30:00Z', venue: { name: 'Azure Beach', city: 'Bali' }, pricingTiers: [{ category: 'Beach GA', price: 55 }, { category: 'Cabana', price: 140 }], image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1400' },
  { eventId: 'm16', name: 'Latin Fire Night', eventDate: '2026-08-29T21:00:00Z', venue: { name: 'Plaza Norte', city: 'Madrid' }, pricingTiers: [{ category: 'General', price: 47 }, { category: 'Premium', price: 110 }], image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1400' },
  { eventId: 'm17', name: 'Rock Legends Reunion', eventDate: '2026-09-19T20:00:00Z', venue: { name: 'Olympic Arena', city: 'Athens' }, pricingTiers: [{ category: 'GA', price: 83 }, { category: 'Front Pit', price: 170 }], image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=1400' },
  { eventId: 'm18', name: 'Winter Choir Gala', eventDate: '2026-12-20T18:00:00Z', venue: { name: 'Civic Hall', city: 'Toronto' }, pricingTiers: [{ category: 'Standard', price: 39 }, { category: 'Patron', price: 96 }], image: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=1400' },
  { eventId: 'm19', name: 'Desert Beats Collective', eventDate: '2026-10-02T22:00:00Z', venue: { name: 'Sandline Camp', city: 'Doha' }, pricingTiers: [{ category: 'GA', price: 68 }, { category: 'VIP', price: 152 }], image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=1400' },
  { eventId: 'm20', name: 'Acoustic Sessions Unplugged', eventDate: '2026-03-07T19:00:00Z', venue: { name: 'Cedar Room', city: 'Vancouver' }, pricingTiers: [{ category: 'Standard', price: 44 }, { category: 'Premium', price: 99 }], image: 'https://images.unsplash.com/photo-1445985543470-41fba5c3144a?q=80&w=1400' },
]

export const featuredFallback = mockEvents.filter((event) => event.featured).slice(0, 8)
