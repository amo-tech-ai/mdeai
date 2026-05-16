/**
 * Hardened wrapper around @googlemaps/places (Places API New).
 *
 * Enforces:
 *   - server-side key only (GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY)
 *   - explicit field mask on every request — empty mask is rejected
 *   - hard pageSize cap (default 5, max 10)
 *   - typed response envelopes
 *   - timeout + structured errors
 *
 * Field masks: see PRD v2 §3.2. Default text-search mask is the minimal
 * compliant set required by Phase-2 enrichment + Phase-3 fallback.
 */

import { PlacesClient } from '@googlemaps/places';

export class PlacesConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlacesConfigError';
  }
}

export class PlacesRequestError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PlacesRequestError';
    this.cause = cause;
  }
}

export const PLACES_LIMITS = {
  PAGE_SIZE_DEFAULT: 5,
  PAGE_SIZE_MAX: 10,
  REQUEST_TIMEOUT_MS: 10_000,
} as const;

/** Default text-search field mask (PRD v2 §3.2, MASTRA-073). */
export const DEFAULT_TEXT_SEARCH_MASK = [
  'places.id',
  'places.displayName',
  'places.googleMapsLinks',
  'places.location',
] as const;

/** Default nearby-search field mask (MASTRA-075). */
export const DEFAULT_NEARBY_SEARCH_MASK = [
  'places.id',
  'places.displayName',
  'places.googleMapsLinks',
  'places.location',
] as const;

/** Default place-details field mask (MASTRA-076). NOTE: no `places.` prefix for getPlace. */
export const DEFAULT_PLACE_DETAILS_MASK = [
  'id',
  'displayName',
  'googleMapsLinks',
  'location',
  'regularOpeningHours',
  'websiteUri',
] as const;

function requireApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key || key.length < 8) {
    throw new PlacesConfigError(
      'Missing GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY) for Places API (New)',
    );
  }
  return key;
}

let _client: PlacesClient | null = null;

function getClient(): PlacesClient {
  if (_client) return _client;
  const apiKey = requireApiKey();
  // PlacesClient accepts apiKey via env or constructor; we set explicitly to avoid
  // surprises from other GOOGLE_APPLICATION_CREDENTIALS being present.
  _client = new PlacesClient({ apiKey });
  return _client;
}

function validateMask(mask: readonly string[]): string {
  if (!mask || mask.length === 0) {
    throw new PlacesConfigError('Places field mask is required and must not be empty');
  }
  return mask.join(',');
}

function cappedPageSize(requested?: number): number {
  const n = typeof requested === 'number' ? requested : PLACES_LIMITS.PAGE_SIZE_DEFAULT;
  if (n < 1) return 1;
  if (n > PLACES_LIMITS.PAGE_SIZE_MAX) return PLACES_LIMITS.PAGE_SIZE_MAX;
  return n;
}

export interface TextSearchParams {
  textQuery: string;
  pageSize?: number;
  languageCode?: string;
  regionCode?: string;
  locationBias?: unknown;
  fieldMask?: readonly string[];
}

export interface NearbySearchParams {
  locationRestriction: unknown;
  includedTypes?: string[];
  pageSize?: number;
  rankPreference?: 'POPULARITY' | 'DISTANCE';
  fieldMask?: readonly string[];
}

export interface PlaceDetailsParams {
  placeId: string;
  fieldMask?: readonly string[];
  languageCode?: string;
  regionCode?: string;
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new PlacesRequestError(`Places "${label}" timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

export async function searchText(params: TextSearchParams): Promise<unknown> {
  const client = getClient();
  const fieldMask = validateMask(params.fieldMask ?? DEFAULT_TEXT_SEARCH_MASK);
  const pageSize = cappedPageSize(params.pageSize);
  try {
    const [response] = await withTimeout(
      client.searchText(
        {
          textQuery: params.textQuery,
          maxResultCount: pageSize,
          languageCode: params.languageCode,
          regionCode: params.regionCode,
          locationBias: params.locationBias as never,
        },
        { otherArgs: { headers: { 'X-Goog-FieldMask': fieldMask } } },
      ),
      PLACES_LIMITS.REQUEST_TIMEOUT_MS,
      'searchText',
    );
    return response;
  } catch (err) {
    if (err instanceof PlacesRequestError) throw err;
    throw new PlacesRequestError('Places searchText failed', err);
  }
}

export async function searchNearby(params: NearbySearchParams): Promise<unknown> {
  const client = getClient();
  const fieldMask = validateMask(params.fieldMask ?? DEFAULT_NEARBY_SEARCH_MASK);
  const pageSize = cappedPageSize(params.pageSize);
  try {
    const [response] = await withTimeout(
      client.searchNearby(
        {
          locationRestriction: params.locationRestriction as never,
          includedTypes: params.includedTypes,
          maxResultCount: pageSize,
          rankPreference: params.rankPreference as never,
        },
        { otherArgs: { headers: { 'X-Goog-FieldMask': fieldMask } } },
      ),
      PLACES_LIMITS.REQUEST_TIMEOUT_MS,
      'searchNearby',
    );
    return response;
  } catch (err) {
    if (err instanceof PlacesRequestError) throw err;
    throw new PlacesRequestError('Places searchNearby failed', err);
  }
}

export async function getPlace(params: PlaceDetailsParams): Promise<unknown> {
  const client = getClient();
  const fieldMask = validateMask(params.fieldMask ?? DEFAULT_PLACE_DETAILS_MASK);
  try {
    const [response] = await withTimeout(
      client.getPlace(
        {
          name: `places/${params.placeId}`,
          languageCode: params.languageCode,
          regionCode: params.regionCode,
        },
        { otherArgs: { headers: { 'X-Goog-FieldMask': fieldMask } } },
      ),
      PLACES_LIMITS.REQUEST_TIMEOUT_MS,
      'getPlace',
    );
    return response;
  } catch (err) {
    if (err instanceof PlacesRequestError) throw err;
    throw new PlacesRequestError('Places getPlace failed', err);
  }
}

/**
 * MASTRA-067 — Extract the canonical Google Maps place URL from a Places API
 * (New) response place object.
 *
 * Uses `googleMapsLinks.placeUri` — the pre-formatted CID-based URL (e.g.
 * `https://maps.google.com/?cid=12345`). This is the ONLY safe source for
 * `maps_url` in Supabase. Never construct Maps URLs from lat/lng — they open
 * a generic map view, not the place details page.
 *
 * MCP-verified (google-maps-code-assist, 2026-05-14):
 *   Source: developers.google.com/maps/documentation/places/web-service/maps-links
 *   "googleMapsLinks.placeUri — Link to open Google Maps to the place."
 *   "A Maps URL with a unique place name directs users to that place's details
 *    page on Google Maps" (vs lat/lng URLs that show a generic map view).
 *
 * @param place - A place object from Places API (New) response.
 * @returns placeUri string, or null if missing/invalid.
 */
export function extractPlaceUri(place: unknown): string | null {
  if (!place || typeof place !== 'object') return null;
  const p = place as Record<string, unknown>;
  const links = p['googleMapsLinks'];
  if (!links || typeof links !== 'object') return null;
  const uri = (links as Record<string, unknown>)['placeUri'];
  if (typeof uri !== 'string' || !uri.startsWith('http')) return null;
  return uri;
}
