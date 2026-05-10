import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { searchRentals } from '../tools/search-rentals';

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

const queryInputSchema = z.object({
  neighborhood: z.string().optional(),
  minBedrooms: z.number().int().min(0).optional(),
  maxPricePerNight: z.number().positive().optional(),
  limit: z.number().int().min(1).max(20).default(5),
});

const cardSchema = z.object({
  id: z.string(),
  headline: z.string(),
  subline: z.string(),
  priceLabel: z.string(),
  imageUrl: z.string(),
});

const searchStep = createStep({
  id: 'search-rentals',
  description: 'Calls the search-rentals helper with mock data.',
  inputSchema: queryInputSchema,
  outputSchema: z.object({
    results: z.array(rentalSchema),
    total: z.number(),
  }),
  execute: async ({ inputData }) => {
    const out = searchRentals({
      neighborhood: inputData.neighborhood,
      minBedrooms: inputData.minBedrooms,
      maxPricePerNight: inputData.maxPricePerNight,
      limit: inputData.limit ?? 5,
    });
    return { results: out.results, total: out.total };
  },
});

const formatStep = createStep({
  id: 'format-rental-cards',
  description: 'Shapes raw rentals into UI-friendly cards.',
  inputSchema: z.object({
    results: z.array(rentalSchema),
    total: z.number(),
  }),
  outputSchema: z.object({
    cards: z.array(cardSchema),
    total: z.number(),
  }),
  execute: async ({ inputData }) => {
    const cards = inputData.results.map((r) => ({
      id: r.id,
      headline: r.title,
      subline: `${r.neighborhood} · ${r.bedrooms}BR · ${r.bathrooms}BA`,
      priceLabel: `$${r.pricePerNight}/night`,
      imageUrl: r.imageUrl,
    }));
    return { cards, total: inputData.total };
  },
});

const rentalSearchWorkflow = createWorkflow({
  id: 'rental-search-workflow',
  inputSchema: queryInputSchema,
  outputSchema: z.object({
    cards: z.array(cardSchema),
    total: z.number(),
  }),
})
  .then(searchStep)
  .then(formatStep);

rentalSearchWorkflow.commit();

export { rentalSearchWorkflow };
