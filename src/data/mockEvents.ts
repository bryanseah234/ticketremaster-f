export interface MockEvent {
  eventId: string
  name: string
  eventDate: string
  venue: { name: string; city: string }
  pricingTiers: { category: string; price: number }[]
  image: string
  type: string
  featured?: boolean
}

export const mockEvents: MockEvent[] = [
  { eventId: 'evt_001', name: 'Taylor Swift | The Eras Tour', eventDate: '2026-06-15T19:30:00', venue: { name: 'Esplanade Concert Hall', city: 'Singapore' }, pricingTiers: [{ category: 'Standard', price: 248 }, { category: 'VIP', price: 388 }], image: 'https://picsum.photos/seed/eras-tour/800/450', type: 'concert', featured: true },
  { eventId: 'evt_005', name: 'Coldplay: Music of the Spheres', eventDate: '2026-09-05T20:00:00', venue: { name: 'Singapore Indoor Stadium', city: 'Singapore' }, pricingTiers: [{ category: 'Standard', price: 188 }, { category: 'Platinum', price: 320 }], image: 'https://picsum.photos/seed/coldplay-spheres/800/450', type: 'concert', featured: true },
  { eventId: 'evt_012', name: 'Singapore Grand Prix 2026', eventDate: '2026-09-20T20:00:00', venue: { name: 'National Stadium', city: 'Singapore' }, pricingTiers: [{ category: 'Walkabout', price: 198 }, { category: 'Grandstand', price: 488 }], image: 'https://picsum.photos/seed/f1-sg-2026/800/450', type: 'sports', featured: true },
  { eventId: 'evt_013', name: 'Legally Blonde \u2013 The Musical', eventDate: '2026-07-29T19:30:00', venue: { name: 'Esplanade Concert Hall', city: 'Singapore' }, pricingTiers: [{ category: 'Circle', price: 98 }, { category: 'Stalls', price: 148 }], image: 'https://picsum.photos/seed/legally-blonde-sg/800/450', type: 'theatre', featured: true },
  { eventId: 'evt_015', name: 'Singapore Garden Festival 2026', eventDate: '2026-07-04T09:00:00', venue: { name: 'Gardens by the Bay', city: 'Singapore' }, pricingTiers: [{ category: 'Day Pass', price: 35 }, { category: 'Season Pass', price: 88 }], image: 'https://picsum.photos/seed/sg-garden-fest-2026/800/450', type: 'festival', featured: true },
  { eventId: 'evt_011', name: 'HSBC SVNS Singapore 2026', eventDate: '2026-10-31T10:00:00', venue: { name: 'National Stadium', city: 'Singapore' }, pricingTiers: [{ category: 'Adult', price: 59 }, { category: 'Premium', price: 128 }], image: 'https://picsum.photos/seed/hsbc-svns-2026/800/450', type: 'sports', featured: true },
  { eventId: 'evt_003', name: 'DAY6 10th Anniversary Tour <The DECADE>', eventDate: '2026-08-18T18:00:00', venue: { name: 'Esplanade Concert Hall', city: 'Singapore' }, pricingTiers: [{ category: 'Standard', price: 158 }, { category: 'Fan Pit', price: 248 }], image: 'https://picsum.photos/seed/day6-decade/800/450', type: 'concert', featured: true },
  { eventId: 'evt_016', name: 'i Light Singapore 2026', eventDate: '2026-06-06T19:00:00', venue: { name: 'Gardens by the Bay', city: 'Singapore' }, pricingTiers: [{ category: 'General', price: 25 }, { category: 'VIP', price: 58 }], image: 'https://picsum.photos/seed/ilight-sg-2026/800/450', type: 'festival', featured: true },
  { eventId: 'evt_004', name: 'Harry Styles: Together, Together', eventDate: '2026-08-26T20:00:00', venue: { name: 'Singapore Indoor Stadium', city: 'Singapore' }, pricingTiers: [{ category: 'Standard', price: 150 }, { category: 'VIP', price: 280 }], image: 'https://picsum.photos/seed/harry-styles/800/450', type: 'concert' },
  { eventId: 'evt_009', name: "Guns N' Roses - World Tour 2026", eventDate: '2026-07-01T20:00:00', venue: { name: 'Sands Theatre', city: 'Singapore' }, pricingTiers: [{ category: 'General', price: 125 }, { category: 'Front Pit', price: 220 }], image: 'https://picsum.photos/seed/gnr-2026/800/450', type: 'concert' },
  { eventId: 'evt_002', name: "SSO Gala: Beethoven's 9th", eventDate: '2026-07-20T20:00:00', venue: { name: 'Esplanade Concert Hall', city: 'Singapore' }, pricingTiers: [{ category: 'Balcony', price: 85 }, { category: 'Front Stalls', price: 145 }], image: 'https://picsum.photos/seed/sso-beethoven/800/450', type: 'classical' },
  { eventId: 'evt_008', name: 'Hans Zimmer Live', eventDate: '2026-11-21T20:00:00', venue: { name: 'Capitol Theatre', city: 'Singapore' }, pricingTiers: [{ category: 'Standard', price: 88 }, { category: 'Premium', price: 168 }], image: 'https://picsum.photos/seed/hans-zimmer/800/450', type: 'classical' },
  { eventId: 'evt_014', name: 'CATS \u2013 The Musical', eventDate: '2026-11-06T19:30:00', venue: { name: 'Capitol Theatre', city: 'Singapore' }, pricingTiers: [{ category: 'Circle', price: 115 }, { category: 'Stalls', price: 178 }], image: 'https://picsum.photos/seed/cats-musical-sg/800/450', type: 'theatre' },
  { eventId: 'evt_006', name: 'Singapore Jazz Festival 2026', eventDate: '2026-05-10T18:00:00', venue: { name: 'Singapore Indoor Stadium', city: 'Singapore' }, pricingTiers: [{ category: 'GA', price: 75 }, { category: 'VIP', price: 148 }], image: 'https://picsum.photos/seed/sg-jazz-2026/800/450', type: 'festival' },
  { eventId: 'evt_007', name: 'A.R. Rahman Live in Concert', eventDate: '2026-10-25T19:00:00', venue: { name: 'Capitol Theatre', city: 'Singapore' }, pricingTiers: [{ category: 'Standard', price: 95 }, { category: 'Premium', price: 175 }], image: 'https://picsum.photos/seed/ar-rahman/800/450', type: 'concert' },
  { eventId: 'evt_010', name: 'Mountbatten Festival of Music 2026', eventDate: '2026-09-30T19:30:00', venue: { name: 'Sands Theatre', city: 'Singapore' }, pricingTiers: [{ category: 'Standard', price: 65 }, { category: 'Premium', price: 120 }], image: 'https://picsum.photos/seed/mountbatten-2026/800/450', type: 'classical' },
]

export const featuredFallback = mockEvents.filter((event) => event.featured).slice(0, 8)
