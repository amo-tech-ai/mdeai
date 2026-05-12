import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const cuisineEnum = z.enum([
  'colombian',
  'paisa',
  'seafood',
  'steakhouse',
  'vegetarian',
  'cafe',
  'international',
  'street-food',
]);

const restaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  cuisine: cuisineEnum,
  neighborhood: z.string(),
  priceTier: z.enum(['$', '$$', '$$$', '$$$$']),
  avgPricePerPerson: z.number().describe('USD'),
  currency: z.literal('USD'),
  rating: z.number().min(0).max(5),
  vibe: z.array(z.string()),
  imageUrl: z.string(),
  sourceUrl: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type Restaurant = z.infer<typeof restaurantSchema>;
export type Cuisine = z.infer<typeof cuisineEnum>;

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'rst_lau_001',
    name: 'Hatoviejo Laureles',
    cuisine: 'paisa',
    neighborhood: 'Laureles',
    priceTier: '$$',
    avgPricePerPerson: 18,
    currency: 'USD',
    rating: 4.5,
    vibe: ['traditional', 'family-friendly', 'live-music-weekends'],
    imageUrl: 'https://images.unsplash.com/photo-restaurant-lau-001',
    sourceUrl: 'https://mdeai.co/restaurants/rst_lau_001',
    latitude: 6.2516,
    longitude: -75.5898,
  },
  {
    id: 'rst_pob_001',
    name: 'Carmen',
    cuisine: 'international',
    neighborhood: 'El Poblado',
    priceTier: '$$$$',
    avgPricePerPerson: 65,
    currency: 'USD',
    rating: 4.8,
    vibe: ['fine-dining', 'tasting-menu', 'date-night'],
    imageUrl: 'https://images.unsplash.com/photo-restaurant-pob-001',
    sourceUrl: 'https://mdeai.co/restaurants/rst_pob_001',
    latitude: 6.2098,
    longitude: -75.5663,
  },
  {
    id: 'rst_pob_002',
    name: "Mondongo's Parque Lleras",
    cuisine: 'colombian',
    neighborhood: 'El Poblado',
    priceTier: '$$',
    avgPricePerPerson: 16,
    currency: 'USD',
    rating: 4.3,
    vibe: ['traditional', 'tourist-friendly', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-restaurant-pob-002',
    sourceUrl: 'https://mdeai.co/restaurants/rst_pob_002',
    latitude: 6.2076,
    longitude: -75.5668,
  },
  {
    id: 'rst_pob_003',
    name: 'OCI.Mde',
    cuisine: 'international',
    neighborhood: 'El Poblado',
    priceTier: '$$$',
    avgPricePerPerson: 38,
    currency: 'USD',
    rating: 4.7,
    vibe: ['modern', 'tasting-menu', 'date-night'],
    imageUrl: 'https://images.unsplash.com/photo-restaurant-pob-003',
    sourceUrl: 'https://mdeai.co/restaurants/rst_pob_003',
    latitude: 6.2094,
    longitude: -75.5658,
  },
  {
    id: 'rst_env_001',
    name: 'In Situ',
    cuisine: 'colombian',
    neighborhood: 'Envigado',
    priceTier: '$$',
    avgPricePerPerson: 22,
    currency: 'USD',
    rating: 4.4,
    vibe: ['garden-seating', 'casual', 'family-friendly'],
    imageUrl: 'https://images.unsplash.com/photo-restaurant-env-001',
    sourceUrl: 'https://mdeai.co/restaurants/rst_env_001',
    latitude: 6.1745,
    longitude: -75.5912,
  },
  {
    id: 'rst_lau_002',
    name: 'Verdeo',
    cuisine: 'vegetarian',
    neighborhood: 'Laureles',
    priceTier: '$$',
    avgPricePerPerson: 14,
    currency: 'USD',
    rating: 4.6,
    vibe: ['plant-based', 'casual', 'lunch-friendly'],
    imageUrl: 'https://images.unsplash.com/photo-restaurant-lau-002',
    sourceUrl: 'https://mdeai.co/restaurants/rst_lau_002',
    latitude: 6.2528,
    longitude: -75.5907,
  },
  {
    id: 'rst_pob_004',
    name: 'Pergamino Café',
    cuisine: 'cafe',
    neighborhood: 'El Poblado',
    priceTier: '$',
    avgPricePerPerson: 8,
    currency: 'USD',
    rating: 4.5,
    vibe: ['specialty-coffee', 'remote-work', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-restaurant-pob-004',
    sourceUrl: 'https://mdeai.co/restaurants/rst_pob_004',
    latitude: 6.2103,
    longitude: -75.5672,
  },
  {
    id: 'rst_cen_001',
    name: 'Mercado del Río',
    cuisine: 'street-food',
    neighborhood: 'Centro',
    priceTier: '$$',
    avgPricePerPerson: 15,
    currency: 'USD',
    rating: 4.4,
    vibe: ['food-hall', 'group-friendly', 'casual'],
    imageUrl: 'https://images.unsplash.com/photo-restaurant-cen-001',
    sourceUrl: 'https://mdeai.co/restaurants/rst_cen_001',
    latitude: 6.2480,
    longitude: -75.5622,
  },
];

export type RestaurantQuery = {
  cuisine?: Cuisine;
  neighborhood?: string;
  maxPricePerPerson?: number;
  minRating?: number;
  limit?: number;
};

export function searchRestaurants(
  query: RestaurantQuery,
): { results: Restaurant[]; total: number; source: 'mock' } {
  let results = MOCK_RESTAURANTS.slice();
  if (query.cuisine) {
    results = results.filter((r) => r.cuisine === query.cuisine);
  }
  if (query.neighborhood) {
    const q = query.neighborhood.toLowerCase();
    results = results.filter((r) => r.neighborhood.toLowerCase().includes(q));
  }
  if (typeof query.maxPricePerPerson === 'number') {
    results = results.filter((r) => r.avgPricePerPerson <= query.maxPricePerPerson!);
  }
  if (typeof query.minRating === 'number') {
    results = results.filter((r) => r.rating >= query.minRating!);
  }
  const total = results.length;
  return { results: results.slice(0, query.limit ?? 5), total, source: 'mock' };
}

export const searchRestaurantsTool = createTool({
  id: 'search-restaurants',
  description:
    'Search Medell\u00edn restaurants by cuisine, neighborhood, price ceiling, and minimum rating. Mock data \u2014 does not hit Supabase yet.',
  inputSchema: z.object({
    cuisine: cuisineEnum.optional(),
    neighborhood: z.string().optional().describe('e.g. Laureles, El Poblado, Envigado, Centro'),
    maxPricePerPerson: z.number().positive().optional().describe('USD'),
    minRating: z.number().min(0).max(5).optional(),
    limit: z.number().int().min(1).max(20).default(5),
  }),
  outputSchema: z.object({
    results: z.array(restaurantSchema),
    total: z.number(),
    source: z.literal('mock'),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: async (inputData: RestaurantQuery, context?: any) => {
    const { cuisine, neighborhood, maxPricePerPerson, minRating, limit = 5 } = inputData;
    const { results, total, source } = searchRestaurants({ cuisine, neighborhood, maxPricePerPerson, minRating, limit });

    await context?.writer?.custom({
      type: 'data-mdeai-actions',
      data: {
        kind: 'restaurant_results',
        cards: results.map((r) => ({
          id: r.id,
          name: r.name,
          cuisine: r.cuisine,
          neighborhood: r.neighborhood,
          priceTier: r.priceTier,
          avgPricePerPerson: r.avgPricePerPerson,
          rating: r.rating,
          vibe: r.vibe,
          imageUrl: r.imageUrl,
          sourceUrl: r.sourceUrl,
          latitude: r.latitude ?? null,
          longitude: r.longitude ?? null,
        })),
        source,
      },
    });

    return { results, total, source };
  },
});
