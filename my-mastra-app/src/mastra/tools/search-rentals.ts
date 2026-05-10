import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const rentalSchema = z.object({
  id: z.string(),
  title: z.string(),
  neighborhood: z.string(),
  nightly_price: z.number(),
  currency: z.literal('USD'),
  bedrooms: z.number(),
  wifi: z.boolean(),
  amenities: z.array(z.string()),
  image: z.string(),
  source_url: z.string(),
  schedule_viewing_url: z.string(),
  host_name: z.string(),
  availability: z.string(),
  tags: z.array(z.string()),
});

export type Rental = z.infer<typeof rentalSchema>;

const MOCK_RENTALS: Rental[] = [
  {
    id: 'rnt_lau_001',
    title: 'Bright 2BR with Balcony in Laureles',
    neighborhood: 'Laureles',
    nightly_price: 78,
    currency: 'USD',
    bedrooms: 2,
    wifi: true,
    amenities: ['wifi', 'workspace', 'kitchen', 'balcony', 'washer'],
    image: 'https://images.unsplash.com/photo-rental-lau-001',
    source_url: 'https://mdeai.co/rentals/rnt_lau_001',
    schedule_viewing_url: 'https://mdeai.co/rentals/rnt_lau_001/schedule-viewing',
    host_name: 'Andrés Restrepo',
    availability: 'Available May 15 – Aug 30, 2026',
    tags: ['long-stay', 'remote-work', 'walkable'],
  },
  {
    id: 'rnt_lau_002',
    title: 'Modern 1BR Loft near Primer Parque',
    neighborhood: 'Laureles',
    nightly_price: 64,
    currency: 'USD',
    bedrooms: 1,
    wifi: true,
    amenities: ['wifi', 'workspace', 'kitchen', 'gym', 'rooftop'],
    image: 'https://images.unsplash.com/photo-rental-lau-002',
    source_url: 'https://mdeai.co/rentals/rnt_lau_002',
    schedule_viewing_url: 'https://mdeai.co/rentals/rnt_lau_002/schedule-viewing',
    host_name: 'Sofía Vélez',
    availability: 'Available now – Jul 10, 2026',
    tags: ['solo-traveler', 'remote-work', 'pet-friendly'],
  },
  {
    id: 'rnt_lau_003',
    title: 'Quiet Studio off Avenida Nutibara',
    neighborhood: 'Laureles',
    nightly_price: 42,
    currency: 'USD',
    bedrooms: 0,
    wifi: true,
    amenities: ['wifi', 'kitchen', 'workspace'],
    image: 'https://images.unsplash.com/photo-rental-lau-003',
    source_url: 'https://mdeai.co/rentals/rnt_lau_003',
    schedule_viewing_url: 'https://mdeai.co/rentals/rnt_lau_003/schedule-viewing',
    host_name: 'Camila Ortiz',
    availability: 'Available Jun 1 – Dec 31, 2026',
    tags: ['budget', 'long-stay', 'quiet'],
  },
  {
    id: 'rnt_lau_004',
    title: 'Family 3BR near Segundo Parque',
    neighborhood: 'Laureles',
    nightly_price: 118,
    currency: 'USD',
    bedrooms: 3,
    wifi: true,
    amenities: ['wifi', 'kitchen', 'parking', 'washer', 'kid-friendly'],
    image: 'https://images.unsplash.com/photo-rental-lau-004',
    source_url: 'https://mdeai.co/rentals/rnt_lau_004',
    schedule_viewing_url: 'https://mdeai.co/rentals/rnt_lau_004/schedule-viewing',
    host_name: 'Roberto Gómez',
    availability: 'Available May 20 – Sep 30, 2026',
    tags: ['family', 'long-stay', 'parking'],
  },
  {
    id: 'rnt_lau_005',
    title: 'Co-living Room near La 70',
    neighborhood: 'Laureles',
    nightly_price: 35,
    currency: 'USD',
    bedrooms: 1,
    wifi: true,
    amenities: ['wifi', 'shared-kitchen', 'coworking', 'cleaning'],
    image: 'https://images.unsplash.com/photo-rental-lau-005',
    source_url: 'https://mdeai.co/rentals/rnt_lau_005',
    schedule_viewing_url: 'https://mdeai.co/rentals/rnt_lau_005/schedule-viewing',
    host_name: 'Miguel Hoyos',
    availability: 'Available now – Oct 30, 2026',
    tags: ['co-living', 'budget', 'social', 'remote-work'],
  },
  {
    id: 'rnt_pob_001',
    title: 'Sunny 2BR in El Poblado',
    neighborhood: 'El Poblado',
    nightly_price: 95,
    currency: 'USD',
    bedrooms: 2,
    wifi: true,
    amenities: ['wifi', 'pool', 'gym', 'kitchen', 'concierge'],
    image: 'https://images.unsplash.com/photo-rental-pob-001',
    source_url: 'https://mdeai.co/rentals/rnt_pob_001',
    schedule_viewing_url: 'https://mdeai.co/rentals/rnt_pob_001/schedule-viewing',
    host_name: 'Patricia Lopera',
    availability: 'Available Jun 1 – Aug 31, 2026',
    tags: ['nightlife', 'walkable', 'gym'],
  },
  {
    id: 'rnt_pob_002',
    title: 'Family 3BR near Parque Lleras',
    neighborhood: 'El Poblado',
    nightly_price: 140,
    currency: 'USD',
    bedrooms: 3,
    wifi: true,
    amenities: ['wifi', 'pool', 'parking', 'kitchen', 'washer'],
    image: 'https://images.unsplash.com/photo-rental-pob-002',
    source_url: 'https://mdeai.co/rentals/rnt_pob_002',
    schedule_viewing_url: 'https://mdeai.co/rentals/rnt_pob_002/schedule-viewing',
    host_name: 'Daniela Arango',
    availability: 'Available Jul 1 – Nov 30, 2026',
    tags: ['family', 'nightlife', 'parking'],
  },
  {
    id: 'rnt_env_001',
    title: 'Cozy Studio in Envigado',
    neighborhood: 'Envigado',
    nightly_price: 38,
    currency: 'USD',
    bedrooms: 0,
    wifi: true,
    amenities: ['wifi', 'kitchen'],
    image: 'https://images.unsplash.com/photo-rental-env-001',
    source_url: 'https://mdeai.co/rentals/rnt_env_001',
    schedule_viewing_url: 'https://mdeai.co/rentals/rnt_env_001/schedule-viewing',
    host_name: 'Juliana Mejía',
    availability: 'Available now – Aug 15, 2026',
    tags: ['budget', 'quiet', 'long-stay'],
  },
];

export type RentalQuery = {
  neighborhood?: string;
  minBedrooms?: number;
  maxPricePerNight?: number;
  limit?: number;
};

export function searchRentals(
  query: RentalQuery,
): { results: Rental[]; total: number; source: 'mock' } {
  let results = MOCK_RENTALS.slice();
  if (query.neighborhood) {
    const q = query.neighborhood.toLowerCase();
    results = results.filter((r) => r.neighborhood.toLowerCase().includes(q));
  }
  if (typeof query.minBedrooms === 'number') {
    results = results.filter((r) => r.bedrooms >= query.minBedrooms!);
  }
  if (typeof query.maxPricePerNight === 'number') {
    results = results.filter((r) => r.nightly_price <= query.maxPricePerNight!);
  }
  const total = results.length;
  return { results: results.slice(0, query.limit ?? 8), total, source: 'mock' };
}

export const searchRentalsTool = createTool({
  id: 'search-rentals',
  description:
    'Search Medellín rentals by neighborhood, bedrooms, and price. Returns rich cards with source_url and schedule_viewing_url. Mock data — does not hit Supabase yet.',
  inputSchema: z.object({
    neighborhood: z.string().optional().describe('e.g. Laureles, El Poblado, Envigado'),
    minBedrooms: z.number().int().min(0).optional(),
    maxPricePerNight: z.number().positive().optional().describe('USD'),
    limit: z.number().int().min(1).max(20).default(8),
  }),
  outputSchema: z.object({
    results: z.array(rentalSchema),
    total: z.number(),
    source: z.literal('mock'),
  }),
  execute: async (inputData: RentalQuery) => searchRentals(inputData),
});
