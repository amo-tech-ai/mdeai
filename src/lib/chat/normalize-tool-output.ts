import { z } from 'zod';
import type {
  AttractionInlineListing,
  ChatAction,
  EventInlineListing,
  RentalInlineListing,
  RestaurantInlineListing,
} from '@/types/chat';

const eventCategoryEnum = z.enum(['music', 'food', 'culture', 'sport', 'nightlife']);

/** Raw event row from Mastra search-events — validated then mapped to EventInlineListing */
const eventListingSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    category: eventCategoryEnum.optional(),
    venue: z.string().optional(),
    neighborhood: z.string().optional(),
    startsAt: z.string().optional(),
    pricePerTicket: z.number().nullable().optional(),
    currency: z.literal('USD').optional(),
    imageUrl: z.string().nullable().optional(),
    sourceUrl: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  })
  .transform(
    (r): EventInlineListing => ({
      id: r.id,
      title: r.title,
      category: r.category ?? '',
      venue: r.venue ?? '',
      neighborhood: r.neighborhood ?? '',
      startsAt: r.startsAt ?? '',
      pricePerTicket: r.pricePerTicket ?? null,
      currency: r.currency ?? 'USD',
      imageUrl: r.imageUrl ?? null,
      sourceUrl: r.sourceUrl ?? null,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
    }),
  );

/** Raw rental row — nightly_price / image match Mastra search-rentals output */
const rentalListingSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    neighborhood: z.string().optional(),
    nightly_price: z.number().nullable().optional(),
    price_daily: z.number().nullable().optional(),
    image: z.string().optional(),
    images: z.array(z.string()).optional(),
    bedrooms: z.number().nullable().optional(),
    tags: z.array(z.string()).optional(),
    amenities: z.array(z.string()).optional(),
    source_url: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  })
  .transform(
    (r): RentalInlineListing => ({
      id: r.id,
      title: r.title,
      neighborhood: r.neighborhood ?? '',
      price_daily: r.nightly_price ?? r.price_daily ?? null,
      bedrooms: r.bedrooms ?? null,
      amenities: r.tags ?? r.amenities ?? [],
      images: r.images ?? (r.image ? [r.image] : null),
      source_url: r.source_url ?? null,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
    }),
  );

const restaurantListingSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    cuisine: z.string().optional(),
    neighborhood: z.string().optional(),
    priceTier: z.string().nullable().optional(),
    avgPricePerPerson: z.number().nullable().optional(),
    rating: z.number().nullable().optional(),
    vibe: z.array(z.string()).optional(),
    imageUrl: z.string().nullable().optional(),
    sourceUrl: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  })
  .transform(
    (r): RestaurantInlineListing => ({
      id: r.id,
      name: r.name,
      cuisine: r.cuisine ?? '',
      neighborhood: r.neighborhood ?? '',
      priceTier: r.priceTier ?? null,
      avgPricePerPerson: r.avgPricePerPerson ?? null,
      rating: r.rating ?? null,
      vibe: r.vibe ?? [],
      imageUrl: r.imageUrl ?? null,
      sourceUrl: r.sourceUrl ?? null,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
    }),
  );

const attractionListingSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    category: z.string().optional(),
    neighborhood: z.string().optional(),
    priceUsd: z.number().nullable().optional(),
    durationMinutes: z.number().nullable().optional(),
    rating: z.number().nullable().optional(),
    tags: z.array(z.string()).optional(),
    imageUrl: z.string().nullable().optional(),
    sourceUrl: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  })
  .transform(
    (r): AttractionInlineListing => ({
      id: r.id,
      name: r.name,
      category: r.category ?? '',
      neighborhood: r.neighborhood ?? '',
      priceUsd: r.priceUsd ?? null,
      durationMinutes: r.durationMinutes ?? null,
      rating: r.rating ?? null,
      tags: r.tags ?? [],
      imageUrl: r.imageUrl ?? null,
      sourceUrl: r.sourceUrl ?? null,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
    }),
  );

// Mastra registers tools with their `id` field (e.g. 'search-events'), NOT the
// variable name (e.g. 'searchEventsTool'). Both are supported here so the
// tool-output-available handler works in both production (kebab-case id) and
// in unit tests (camelCase name). See: my-mastra-app/src/mastra/tools/search-events.ts
const TOOL_MAP = {
  // Production Mastra IDs (what the LLM and SSE stream actually use)
  'search-events':      { schema: z.array(eventListingSchema),      actionType: 'OPEN_EVENT_RESULTS' as const },
  'search-rentals':     { schema: z.array(rentalListingSchema),     actionType: 'OPEN_RENTALS_RESULTS' as const },
  'search-restaurants': { schema: z.array(restaurantListingSchema), actionType: 'OPEN_RESTAURANT_RESULTS' as const },
  'search-attractions': { schema: z.array(attractionListingSchema), actionType: 'OPEN_ATTRACTION_RESULTS' as const },
  // Legacy camelCase variable names (used in existing unit tests — keep for backward compat)
  searchEventsTool:      { schema: z.array(eventListingSchema),      actionType: 'OPEN_EVENT_RESULTS' as const },
  searchRentalsTool:     { schema: z.array(rentalListingSchema),     actionType: 'OPEN_RENTALS_RESULTS' as const },
  searchRestaurantsTool: { schema: z.array(restaurantListingSchema), actionType: 'OPEN_RESTAURANT_RESULTS' as const },
  searchAttractionsTool: { schema: z.array(attractionListingSchema), actionType: 'OPEN_ATTRACTION_RESULTS' as const },
} as const;

export type MastraSearchToolName = keyof typeof TOOL_MAP;

/**
 * Mastra may emit a bare array or wrap rows under results / listings / items (mirrors SSE envelope).
 */
export function unwrapToolOutput(raw: unknown): unknown {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.results)) return r.results;
    if (Array.isArray(r.listings)) return r.listings;
    if (Array.isArray(r.items)) return r.items;
  }
  return raw;
}

const LISTING_TOOL_ACTION_TYPES: ChatAction['type'][] = [
  'OPEN_EVENT_RESULTS',
  'OPEN_RENTALS_RESULTS',
  'OPEN_RESTAURANT_RESULTS',
  'OPEN_ATTRACTION_RESULTS',
];

/** MASTRA-047 — skips listing actions with unsupported `version` (tool-output dispatch). */
export function listingToolActionPassesVersionGate(action: ChatAction, toolName?: string): boolean {
  if (!LISTING_TOOL_ACTION_TYPES.includes(action.type)) return true;
  if ('version' in action && (action as { version: number }).version !== 1) {
    console.warn(
      `[useChat] Unknown action version ${(action as { version: number }).version} for ${toolName ?? 'tool'} — skipping`,
    );
    return false;
  }
  return true;
}

export function normalizeToolOutput(toolName: string, raw: unknown): ChatAction | null {
  const entry = TOOL_MAP[toolName as MastraSearchToolName];
  if (!entry) return null;

  const unwrapped = unwrapToolOutput(raw);
  const result = entry.schema.safeParse(unwrapped);
  if (!result.success) {
    if (import.meta.env.DEV) {
      console.warn(`[normalizeToolOutput] ${toolName} parse failed:`, result.error.flatten());
    }
    return null;
  }

  const listings = result.data;
  // Extract IDs so ChatActionBar can populate ?ids= in the "See all on the map" URL.
  // All listing schemas define an `id` field; the cast is safe.
  const listing_ids = listings.map((l) => (l as { id: string }).id);

  return {
    version: 1 as const,
    type: entry.actionType,
    payload: { filters: {}, listings, listing_ids },
  } as ChatAction;
}
