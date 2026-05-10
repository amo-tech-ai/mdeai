import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const rentalSchema = z.object({
  id: z.string(),
  title: z.string(),
  neighborhood: z.string(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  pricePerNight: z.number(),
  currency: z.literal('USD'),
  amenities: z.array(z.string()),
  imageUrl: z.string(),
});

export type Rental = z.infer<typeof rentalSchema>;

const MOCK_RENTALS: Rental[] = [
  {
    id: 'rnt_001',
    title: 'Sunny 2BR in El Poblado',
    neighborhood: 'El Poblado',
    bedrooms: 2,
    bathrooms: 2,
    pricePerNight: 95,
    currency: 'USD',
    amenities: ['wifi', 'pool', 'gym', 'kitchen'],
    imageUrl: 'https://images.unsplash.com/photo-rental-001',
  },
  {
    id: 'rnt_002',
    title: 'Loft with Skyline View',
    neighborhood: 'Laureles',
    bedrooms: 1,
    bathrooms: 1,
    pricePerNight: 62,
    currency: 'USD',
    amenities: ['wifi', 'workspace', 'kitchen'],
    imageUrl: 'https://images.unsplash.com/photo-rental-002',
  },
  {
    id: 'rnt_003',
    title: 'Family 3BR near Parque Lleras',
    neighborhood: 'El Poblado',
    bedrooms: 3,
    bathrooms: 2,
    pricePerNight: 140,
    currency: 'USD',
    amenities: ['wifi', 'pool', 'parking', 'kitchen', 'washer'],
    imageUrl: 'https://images.unsplash.com/photo-rental-003',
  },
  {
    id: 'rnt_004',
    title: 'Cozy Studio in Envigado',
    neighborhood: 'Envigado',
    bedrooms: 0,
    bathrooms: 1,
    pricePerNight: 38,
    currency: 'USD',
    amenities: ['wifi', 'kitchen'],
    imageUrl: 'https://images.unsplash.com/photo-rental-004',
  },
];

export type RentalQuery = {
  neighborhood?: string;
  minBedrooms?: number;
  maxPricePerNight?: number;
  limit?: number;
};

export function searchRentals(query: RentalQuery): { results: Rental[]; total: number; source: 'mock' } {
  let results = MOCK_RENTALS.slice();
  if (query.neighborhood) {
    const q = query.neighborhood.toLowerCase();
    results = results.filter((r) => r.neighborhood.toLowerCase().includes(q));
  }
  if (typeof query.minBedrooms === 'number') {
    results = results.filter((r) => r.bedrooms >= query.minBedrooms!);
  }
  if (typeof query.maxPricePerNight === 'number') {
    results = results.filter((r) => r.pricePerNight <= query.maxPricePerNight!);
  }
  const total = results.length;
  return { results: results.slice(0, query.limit ?? 5), total, source: 'mock' };
}

export const searchRentalsTool = createTool({
  id: 'search-rentals',
  description: 'Search Medellín apartments by neighborhood, bedrooms, and price. Mock data — does not hit Supabase yet.',
  inputSchema: z.object({
    neighborhood: z.string().optional().describe('e.g. El Poblado, Laureles, Envigado'),
    minBedrooms: z.number().int().min(0).optional(),
    maxPricePerNight: z.number().positive().optional().describe('USD'),
    limit: z.number().int().min(1).max(20).default(5),
  }),
  outputSchema: z.object({
    results: z.array(rentalSchema),
    total: z.number(),
    source: z.literal('mock'),
  }),
  execute: async (inputData: RentalQuery) => searchRentals(inputData),
});
