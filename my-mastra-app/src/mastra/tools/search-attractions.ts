import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const categoryEnum = z.enum([
  'park',
  'museum',
  'viewpoint',
  'tour',
  'landmark',
  'neighborhood-walk',
  'day-trip',
]);

const attractionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: categoryEnum,
  neighborhood: z.string(),
  priceUsd: z.number().describe('Entry / tour cost in USD; 0 = free'),
  durationMinutes: z.number().int().positive(),
  rating: z.number().min(0).max(5),
  bestTimeOfDay: z.enum(['morning', 'afternoon', 'evening', 'any']),
  tags: z.array(z.string()),
  imageUrl: z.string(),
  sourceUrl: z.string(),
});

export type Attraction = z.infer<typeof attractionSchema>;
export type AttractionCategory = z.infer<typeof categoryEnum>;

const MOCK_ATTRACTIONS: Attraction[] = [
  {
    id: 'atr_001',
    name: 'Comuna 13 Graffiti Tour',
    category: 'tour',
    neighborhood: 'San Javier',
    priceUsd: 18,
    durationMinutes: 180,
    rating: 4.8,
    bestTimeOfDay: 'afternoon',
    tags: ['street-art', 'history', 'walking', 'guided'],
    imageUrl: 'https://images.unsplash.com/photo-attraction-001',
    sourceUrl: 'https://mdeai.co/attractions/atr_001',
  },
  {
    id: 'atr_002',
    name: 'Plaza Botero & Museo de Antioquia',
    category: 'museum',
    neighborhood: 'Centro',
    priceUsd: 6,
    durationMinutes: 120,
    rating: 4.6,
    bestTimeOfDay: 'morning',
    tags: ['art', 'history', 'walkable'],
    imageUrl: 'https://images.unsplash.com/photo-attraction-002',
    sourceUrl: 'https://mdeai.co/attractions/atr_002',
  },
  {
    id: 'atr_003',
    name: 'Cerro Nutibara & Pueblito Paisa',
    category: 'viewpoint',
    neighborhood: 'Bel\u00e9n',
    priceUsd: 0,
    durationMinutes: 90,
    rating: 4.4,
    bestTimeOfDay: 'evening',
    tags: ['viewpoint', 'sunset', 'free'],
    imageUrl: 'https://images.unsplash.com/photo-attraction-003',
    sourceUrl: 'https://mdeai.co/attractions/atr_003',
  },
  {
    id: 'atr_004',
    name: 'Parque Arv\u00ed Cable Car',
    category: 'day-trip',
    neighborhood: 'Santa Elena',
    priceUsd: 5,
    durationMinutes: 240,
    rating: 4.5,
    bestTimeOfDay: 'morning',
    tags: ['nature', 'cable-car', 'hiking'],
    imageUrl: 'https://images.unsplash.com/photo-attraction-004',
    sourceUrl: 'https://mdeai.co/attractions/atr_004',
  },
  {
    id: 'atr_005',
    name: 'Jard\u00edn Bot\u00e1nico de Medell\u00edn',
    category: 'park',
    neighborhood: 'Carabobo',
    priceUsd: 0,
    durationMinutes: 90,
    rating: 4.5,
    bestTimeOfDay: 'morning',
    tags: ['free', 'nature', 'family-friendly'],
    imageUrl: 'https://images.unsplash.com/photo-attraction-005',
    sourceUrl: 'https://mdeai.co/attractions/atr_005',
  },
  {
    id: 'atr_006',
    name: 'Guatap\u00e9 + El Pe\u00f1ol Day Trip',
    category: 'day-trip',
    neighborhood: 'Guatap\u00e9',
    priceUsd: 45,
    durationMinutes: 600,
    rating: 4.7,
    bestTimeOfDay: 'morning',
    tags: ['guided', 'day-trip', 'lake', 'viewpoint'],
    imageUrl: 'https://images.unsplash.com/photo-attraction-006',
    sourceUrl: 'https://mdeai.co/attractions/atr_006',
  },
  {
    id: 'atr_007',
    name: 'La 70 Walking Loop',
    category: 'neighborhood-walk',
    neighborhood: 'Laureles',
    priceUsd: 0,
    durationMinutes: 60,
    rating: 4.3,
    bestTimeOfDay: 'evening',
    tags: ['walkable', 'nightlife', 'free', 'food'],
    imageUrl: 'https://images.unsplash.com/photo-attraction-007',
    sourceUrl: 'https://mdeai.co/attractions/atr_007',
  },
  {
    id: 'atr_008',
    name: 'Museo Casa de la Memoria',
    category: 'museum',
    neighborhood: 'Boston',
    priceUsd: 0,
    durationMinutes: 90,
    rating: 4.6,
    bestTimeOfDay: 'afternoon',
    tags: ['history', 'free', 'reflective'],
    imageUrl: 'https://images.unsplash.com/photo-attraction-008',
    sourceUrl: 'https://mdeai.co/attractions/atr_008',
  },
];

export type AttractionQuery = {
  category?: AttractionCategory;
  neighborhood?: string;
  maxPriceUsd?: number;
  freeOnly?: boolean;
  limit?: number;
};

export function searchAttractions(
  query: AttractionQuery,
): { results: Attraction[]; total: number; source: 'mock' } {
  let results = MOCK_ATTRACTIONS.slice();
  if (query.category) {
    results = results.filter((a) => a.category === query.category);
  }
  if (query.neighborhood) {
    const q = query.neighborhood.toLowerCase();
    results = results.filter((a) => a.neighborhood.toLowerCase().includes(q));
  }
  if (query.freeOnly) {
    results = results.filter((a) => a.priceUsd === 0);
  } else if (typeof query.maxPriceUsd === 'number') {
    results = results.filter((a) => a.priceUsd <= query.maxPriceUsd!);
  }
  const total = results.length;
  return { results: results.slice(0, query.limit ?? 5), total, source: 'mock' };
}

export const searchAttractionsTool = createTool({
  id: 'search-attractions',
  description:
    'Search Medell\u00edn attractions, tours, viewpoints, and day-trips. Mock data \u2014 does not hit Supabase yet.',
  inputSchema: z.object({
    category: categoryEnum.optional(),
    neighborhood: z.string().optional(),
    maxPriceUsd: z.number().nonnegative().optional().describe('USD; 0 = free'),
    freeOnly: z.boolean().optional(),
    limit: z.number().int().min(1).max(20).default(5),
  }),
  outputSchema: z.object({
    results: z.array(attractionSchema),
    total: z.number(),
    source: z.literal('mock'),
  }),
  execute: async (inputData: AttractionQuery) => {
    const { category, neighborhood, maxPriceUsd, freeOnly, limit = 5 } = inputData;
    return searchAttractions({ category, neighborhood, maxPriceUsd, freeOnly, limit });
  },
});
