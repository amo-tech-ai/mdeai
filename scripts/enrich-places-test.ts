/**
 * MASTRA-048 / MASTRA-067 — Places API (New) enrichment script
 *
 * Populates google_place_id, maps_url on restaurants and tourist_destinations
 * using the Places API (New) searchText endpoint.
 *
 * Field mask (MASTRA-067 compliant, MASTRA-073 signed):
 *   places.id, places.displayName, places.googleMapsLinks, places.location
 *
 * maps_url is stored from places.googleMapsLinks.placeUri ONLY.
 * Do NOT construct URLs from CID or lat/lng (MASTRA-067 rule).
 *
 * Cost: $0.017/request (Text Search Essentials SKU).
 * At ~350 venues = ~$6. Run ONCE; script is idempotent (skips populated rows).
 *
 * Prerequisites:
 *   GOOGLE_PLACES_API_KEY — must have Places API (New) enabled in Cloud Console
 *   SUPABASE_URL           — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (never anon key)
 *
 * Usage:
 *   cd /home/sk/mde
 *   npx ts-node --esm scripts/enrich-places.ts 2>&1 | tee scripts/enrich-places.log
 *
 * MASTRA-073 field mask: places.id,places.displayName,places.googleMapsLinks,places.location
 * MASTRA-067: maps_url = places[0].googleMapsLinks.placeUri (prefix validated below)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ─── Environment ───────────────────────────────────────────────────────────────

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GOOGLE_PLACES_API_KEY) throw new Error('GOOGLE_PLACES_API_KEY is required');
if (!SUPABASE_URL) throw new Error('SUPABASE_URL is required');
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

// ─── Config ────────────────────────────────────────────────────────────────────

/** MASTRA-073 signed field mask — expand only after checklist PR update */
const FIELD_MASK = 'places.id,places.displayName,places.googleMapsLinks,places.location';

/** Medellín center + 30km radius for locationBias */
const LOCATION_BIAS = {
  circle: {
    center: { latitude: 6.2442, longitude: -75.5812 },
    radius: 30000,
  },
};

/** Throttle — avoid hammering the API quota */
const DELAY_MS = 300;
const MAX_RESULTS = 1; // We only need the top match per venue

const ERROR_LOG = path.join(import.meta.dirname ?? __dirname, 'enrich-errors.log');

// ─── Supabase client (service role — write access) ─────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function logError(table: string, id: string | number, name: string, err: unknown): void {
  const msg = `[ERROR] ${table}/${id} "${name}": ${err instanceof Error ? err.message : String(err)}\n`;
  process.stderr.write(msg);
  fs.appendFileSync(ERROR_LOG, msg);
}

/**
 * MASTRA-067: maps_url must be placeUri from googleMapsLinks only.
 * Validate prefix to avoid storing constructed URLs.
 */
function validatePlaceUri(uri: string | undefined): string | null {
  if (!uri) return null;
  if (uri.startsWith('https://maps.google.com/') || uri.startsWith('https://www.google.com/maps/')) {
    return uri;
  }
  process.stderr.write(`[WARN] placeUri has unexpected prefix, skipping: ${uri}\n`);
  return null;
}

// ─── Places API (New) — searchText via REST ────────────────────────────────────
// NOTE: @googlemaps/places Node client is a preview package — using REST
// directly to avoid breaking changes between preview versions.
// Align with MASTRA-048 §4 note on pinning semver before switching to client lib.

interface PlacesSearchResult {
  id: string;
  displayName?: { text: string };
  googleMapsLinks?: { placeUri?: string };
  location?: { latitude: number; longitude: number };
}

async function searchPlace(name: string, neighborhood: string): Promise<PlacesSearchResult | null> {
  const textQuery = `${name} ${neighborhood} Medellín Colombia`;
  const body = {
    textQuery,
    locationBias: LOCATION_BIAS,
    maxResultCount: MAX_RESULTS,
  };

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY!,
      // MASTRA-073 signed field mask — no wildcards, no generativeSummary
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { places?: PlacesSearchResult[] };
  return data.places?.[0] ?? null;
}

// ─── Enrichment loop ───────────────────────────────────────────────────────────

async function enrichTable(
  table: 'restaurants' | 'tourist_destinations',
  nameColumn: string,
  neighborhoodColumn: string,
): Promise<{ ok: number; skipped: number; errors: number }> {
  console.log(`\n[${table}] Fetching rows where google_place_id IS NULL…`);

  const { data: rows, error } = await supabase
    .from(table)
    .select(`id, ${nameColumn}, ${neighborhoodColumn}`)
    .is('google_place_id', null).limit(5);

  if (error) throw new Error(`Supabase read error: ${error.message}`);

  console.log(`[${table}] ${rows?.length ?? 0} rows to enrich`);

  let ok = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows ?? []) {
    const name = (row as Record<string, unknown>)[nameColumn] as string | undefined;
    const neighborhood = (row as Record<string, unknown>)[neighborhoodColumn] as string | undefined;

    if (!name) {
      console.log(`[${table}/${row.id}] SKIP — no name`);
      skipped++;
      continue;
    }

    try {
      const place = await searchPlace(name, neighborhood ?? '');

      if (!place) {
        console.warn(`[${table}/${row.id}] NO MATCH for "${name}"`);
        logError(table, row.id, name, 'No search result returned');
        errors++;
        await sleep(DELAY_MS);
        continue;
      }

      const mapsUrl = validatePlaceUri(place.googleMapsLinks?.placeUri);

      const update: Record<string, unknown> = {
        google_place_id: place.id,
        maps_url: mapsUrl,
      };

      // Backfill lat/lng if missing (geocoding side effect from Places search)
      if (place.location) {
        const existing = await supabase
          .from(table)
          .select('latitude, longitude')
          .eq('id', row.id)
          .single();
        if (!existing.data?.latitude && !existing.data?.longitude) {
          update.latitude = place.location.latitude;
          update.longitude = place.location.longitude;
        }
      }

      const { error: updateErr } = await supabase
        .from(table)
        .update(update)
        .eq('id', row.id);

      if (updateErr) {
        throw new Error(`Supabase update error: ${updateErr.message}`);
      }

      console.log(`[${table}/${row.id}] OK — "${name}" → ${place.id} | ${mapsUrl ?? 'no placeUri'}`);
      ok++;
    } catch (err) {
      logError(table, row.id, name, err);
      errors++;
    }

    await sleep(DELAY_MS);
  }

  return { ok, skipped, errors };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== MASTRA-048 enrich-places.ts — Places API (New) enrichment ===');
  console.log(`Field mask: ${FIELD_MASK}`);
  console.log(`Error log: ${ERROR_LOG}`);
  console.log('');

  // Clear error log for this run
  fs.writeFileSync(ERROR_LOG, `=== Run ${new Date().toISOString()} ===\n`);

  const restaurantStats = await enrichTable('restaurants', 'name', 'address');
  const attractionStats = await enrichTable('tourist_destinations', 'name', 'address');

  console.log('\n=== Summary ===');
  console.log(`restaurants:         ${restaurantStats.ok} ok / ${restaurantStats.skipped} skipped / ${restaurantStats.errors} errors`);
  console.log(`tourist_destinations: ${attractionStats.ok} ok / ${attractionStats.skipped} skipped / ${attractionStats.errors} errors`);
  console.log(`\nSC-1/SC-2 verification:`);
  console.log(`  SELECT count(*) FROM restaurants WHERE google_place_id IS NOT NULL;`);
  console.log(`  SELECT count(*) FROM tourist_destinations WHERE google_place_id IS NOT NULL;`);
  console.log(`  SELECT count(*) FROM restaurants WHERE google_place_id IS NOT NULL AND maps_url IS NULL;  -- must be 0`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
