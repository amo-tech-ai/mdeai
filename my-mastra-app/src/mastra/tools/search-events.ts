import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const categoryEnum = z.enum(['music', 'food', 'culture', 'sport', 'nightlife']);

const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: categoryEnum,
  venue: z.string(),
  neighborhood: z.string(),
  startsAt: z.string().describe('ISO 8601'),
  pricePerTicket: z.number(),
  currency: z.literal('USD'),
  imageUrl: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type EventCard = z.infer<typeof eventSchema>;
export type EventCategory = z.infer<typeof categoryEnum>;

const MOCK_EVENTS: EventCard[] = [
  {
    id: 'evt_001',
    title: 'Salsa Night at Son Havana',
    category: 'nightlife',
    venue: 'Son Havana',
    neighborhood: 'Laureles',
    startsAt: '2026-05-15T22:00:00-05:00',
    pricePerTicket: 12,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-event-001',
    latitude: 6.2520,
    longitude: -75.5916,
  },
  {
    id: 'evt_002',
    title: 'Atletico Nacional vs Millonarios',
    category: 'sport',
    venue: 'Estadio Atanasio Girardot',
    neighborhood: 'Estadio',
    startsAt: '2026-05-18T19:30:00-05:00',
    pricePerTicket: 25,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-event-002',
    latitude: 6.2524,
    longitude: -75.5986,
  },
  {
    id: 'evt_003',
    title: 'Comuna 13 Hip-Hop Festival',
    category: 'music',
    venue: 'Comuna 13',
    neighborhood: 'San Javier',
    startsAt: '2026-05-22T17:00:00-05:00',
    pricePerTicket: 18,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-event-003',
    latitude: 6.2462,
    longitude: -75.6123,
  },
  {
    id: 'evt_004',
    title: 'Plaza Botero Walking Tour',
    category: 'culture',
    venue: 'Plaza Botero',
    neighborhood: 'Centro',
    startsAt: '2026-05-12T10:00:00-05:00',
    pricePerTicket: 8,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-event-004',
    latitude: 6.2518,
    longitude: -75.5636,
  },
  {
    id: 'evt_005',
    title: 'Feria de Las Flores Opening',
    category: 'culture',
    venue: 'Plaza Mayor',
    neighborhood: 'Centro',
    startsAt: '2026-08-02T18:00:00-05:00',
    pricePerTicket: 15,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-event-005',
    latitude: 6.2554,
    longitude: -75.5716,
  },
];

export type EventQuery = {
  category?: EventCategory;
  neighborhood?: string;
  maxPricePerTicket?: number;
  limit?: number;
};

export function searchEvents(query: EventQuery): { results: EventCard[]; total: number; source: 'mock' } {
  let results = MOCK_EVENTS.slice();
  if (query.category) {
    results = results.filter((e) => e.category === query.category);
  }
  if (query.neighborhood) {
    const q = query.neighborhood.toLowerCase();
    results = results.filter((e) => e.neighborhood.toLowerCase().includes(q));
  }
  if (typeof query.maxPricePerTicket === 'number') {
    results = results.filter((e) => e.pricePerTicket <= query.maxPricePerTicket!);
  }
  const total = results.length;
  return { results: results.slice(0, query.limit ?? 5), total, source: 'mock' };
}

export const searchEventsTool = createTool({
  id: 'search-events',
  description: 'Search Medellín events by category, neighborhood, and price ceiling. Mock data — does not hit Supabase yet.',
  inputSchema: z.object({
    category: categoryEnum.optional(),
    neighborhood: z.string().optional(),
    maxPricePerTicket: z.number().positive().optional().describe('USD'),
    limit: z.number().int().min(1).max(20).default(5),
  }),
  outputSchema: z.object({
    results: z.array(eventSchema),
    total: z.number(),
    source: z.literal('mock'),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: async (inputData: EventQuery, context?: any) => {
    const { category, neighborhood, maxPricePerTicket, limit = 5 } = inputData;
    const { results, total, source } = searchEvents({ category, neighborhood, maxPricePerTicket, limit });

    await context?.writer?.custom({
      type: 'data-mdeai-actions',
      data: {
        kind: 'event_results',
        cards: results.map((e) => ({
          id: e.id,
          title: e.title,
          category: e.category,
          venue: e.venue,
          neighborhood: e.neighborhood,
          startsAt: e.startsAt,
          pricePerTicket: e.pricePerTicket,
          currency: e.currency,
          imageUrl: e.imageUrl,
          sourceUrl: `https://mdeai.co/events/${e.id}`,
          latitude: e.latitude ?? null,
          longitude: e.longitude ?? null,
        })),
        source,
      },
    });

    return { results, total, source };
  },
});
