import type { BaseListingFilters, PriceRange } from "./listings";

export interface CoffeeProduct {
  id: string;
  title: string;
  handle: string;
  body: string | null;
  productType: string | null;
  vendor: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
  // Price from first variant
  price?: string;
  compareAtPrice?: string | null;
  // Images (from Shopify body or separate media query)
  images?: string[];
  // Coffee-specific fields (custom fields on shopifyProduct in Gadget)
  roastedAt?: string | null;
  farmName?: string | null;
  altitude?: number | null;
  processingMethod?: string | null;
  tastingNotes?: string[] | null;
  cuppingScore?: number | null;
  neighborhood?: string | null;
  roastLevel?: string | null;
  origin?: string | null;
}

export interface CoffeeFilters extends BaseListingFilters {
  roastLevel?: string[];
  priceRange?: PriceRange;
  origin?: string[];
  processingMethod?: string[];
  neighborhood?: string[];
  availableOnly?: boolean;
}

// Freshness levels based on hours since roasting
export type FreshnessLevel = "peak" | "fresh" | "aging";

export function getFreshnessInfo(roastedAt: string | null | undefined): {
  level: FreshnessLevel;
  label: string;
  hoursAgo: number;
} {
  if (!roastedAt) {
    return { level: "aging", label: "Roast date unknown", hoursAgo: -1 };
  }

  const hoursAgo = Math.floor(
    (Date.now() - new Date(roastedAt).getTime()) / (1000 * 60 * 60)
  );

  if (hoursAgo < 12) {
    return { level: "peak", label: `Roasted ${hoursAgo}h ago`, hoursAgo };
  }
  if (hoursAgo < 48) {
    return { level: "fresh", label: `Roasted ${hoursAgo}h ago`, hoursAgo };
  }

  const daysAgo = Math.floor(hoursAgo / 24);
  return { level: "aging", label: `Roasted ${daysAgo}d ago`, hoursAgo };
}
