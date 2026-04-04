import { useFindMany, useMaybeFindFirst } from "@gadgetinc/react";
import { gadgetApi } from "@/integrations/gadget/client";
import type { CoffeeFilters } from "@/types/coffee";

// Select only the fields we need for list views
const COFFEE_LIST_SELECT = {
  id: true,
  title: true,
  handle: true,
  body: true,
  productType: true,
  vendor: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Full select for detail views
const COFFEE_DETAIL_SELECT = {
  ...COFFEE_LIST_SELECT,
  tags: true,
} as const;

/**
 * Fetch coffee products from Gadget (synced from Shopify).
 * Uses useFindMany which returns [{ data, fetching, error }, refetch].
 *
 * Note: Custom fields (roastLevel, origin, flavorNotes, etc.) will be
 * available in the select once they're added to the shopifyProduct model
 * in the Gadget dashboard. Until then, only standard Shopify fields are returned.
 */
export function useCoffeeProducts(filters: CoffeeFilters = {}) {
  const gadgetFilter: Record<string, unknown> = {
    productType: { equals: "Coffee" },
    status: { equals: "active" },
  };

  // Apply filters as custom fields are added to Gadget
  // if (filters.roastLevel?.length) {
  //   gadgetFilter.roastLevel = { in: filters.roastLevel };
  // }
  // if (filters.origin?.length) {
  //   gadgetFilter.origin = { in: filters.origin };
  // }
  // if (filters.neighborhood?.length) {
  //   gadgetFilter.neighborhood = { in: filters.neighborhood };
  // }

  return useFindMany(gadgetApi.shopifyProduct, {
    filter: gadgetFilter,
    search: filters.search || undefined,
    sort: { createdAt: "Descending" },
    first: filters.limit || 20,
    select: COFFEE_LIST_SELECT,
  });
}

/**
 * Fetch a single coffee product by handle.
 * Returns null (not error) if product not found.
 */
export function useCoffeeByHandle(handle: string) {
  return useMaybeFindFirst(gadgetApi.shopifyProduct, {
    filter: {
      handle: { equals: handle },
      productType: { equals: "Coffee" },
    },
    select: COFFEE_DETAIL_SELECT,
  });
}
