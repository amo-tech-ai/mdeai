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
  execute: async (inputData: EventQuery) => {
    const { category, neighborhood, maxPricePerTicket, limit = 5 } = inputData;
    return searchEvents({ category, neighborhood, maxPricePerTicket, limit });
  },
});
