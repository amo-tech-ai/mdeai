/**
 * MASTRA-048 — geocode-missing.ts
 *
 * Backfills latitude/longitude for rows where coordinates are NULL
 * but a venue name + neighborhood is present.
 *
 * Tables: events, restaurants, tourist_destinations
 * Method: Google Geocoding API via @googlemaps/google-maps-services-js
 *         (lighter than @googlemaps/places for pure address→coords lookups)
 *
 * Reference: github/google-maps-services-js/src/geocode/geocode.ts
 *   GeocodeResult.geometry.location gives { lat, lng }
 *
 * Cost: ~$0.005/request (Geocoding API Essentials SKU).
 * Idempotent: only processes rows WHERE latitude IS NULL.
 *
 * Usage:
 *   cd /home/sk/mde
 *   npx ts-node --esm scripts/geocode-missing.ts 2>&1 | tee scripts/geocode.log
 *
 * Prerequisites:
 *   GOOGLE_PLACES_API_KEY — must have Geocoding API enabled in Cloud Console
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { Client } from '@googlemaps/google-maps-services-js';
import { createClient } from '@supabase/supabase-js';

// ─── Environment ───────────────────────────────────────────────────────────────

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GOOGLE_PLACES_API_KEY) throw new Error('GOOGLE_PLACES_API_KEY is required');
if (!SUPABASE_URL) throw new Error('SUPABASE_URL is required');
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

// ─── Config ────────────────────────────────────────────────────────────────────

const DELAY_MS = 300;

const TABLES = ['events', 'restaurants', 'tourist_destinations'] as const;
type TableName = (typeof TABLES)[number];

// ─── Clients ──────────────────────────────────────────────────────────────────

const mapsClient = new Client();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Build a geocode query string.
 * Events store venue name in `venue`; restaurants/tourist_destinations use `name`.
 */
function buildQuery(row: Record<string, unknown>, table: TableName): string {
  const venueName =
    table === 'events'
      ? ((row['venue'] as string | undefined) ?? (row['name'] as string | undefined) ?? '')
      : ((row['name'] as string | undefined) ?? '');
  const neighborhood = (row['neighborhood'] as string | undefined) ?? '';
  return `${venueName} ${neighborhood} Medellín Colombia`.trim();
}

// ─── Geocode loop ─────────────────────────────────────────────────────────────

async function geocodeTable(
  table: TableName,
): Promise<{ ok: number; skipped: number; errors: number }> {
  // Select name columns based on table
  const selectCols =
    table === 'events'
      ? 'id, name, venue, neighborhood'
      : 'id, name, neighborhood';

  console.log(`\n[${table}] Fetching rows where latitude IS NULL…`);

  const { data: rows, error } = await supabase
    .from(table)
    .select(selectCols)
    .is('latitude', null);

  if (error) throw new Error(`Supabase read error (${table}): ${error.message}`);

  console.log(`[${table}] ${rows?.length ?? 0} rows to geocode`);

  let ok = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows ?? []) {
    const r = row as Record<string, unknown>;
    const query = buildQuery(r, table);

    if (!query.trim() || query === ' Medellín Colombia') {
      console.log(`[${table}/${r['id']}] SKIP — no name or venue`);
      skipped++;
      continue;
    }

    try {
      const resp = await mapsClient.geocode({
        params: {
          address: query,
          key: GOOGLE_PLACES_API_KEY!,
          // Bias results toward Medellín metro
          bounds: {
            southwest: { lat: 6.05, lng: -75.75 },
            northeast: { lat: 6.45, lng: -75.45 },
          },
        },
      });

      const loc = resp.data.results[0]?.geometry?.location;

      if (!loc) {
        console.warn(`[${table}/${r['id']}] NO RESULT for "${query}"`);
        skipped++;
        await sleep(DELAY_MS);
        continue;
      }

      const { error: updateErr } = await supabase
        .from(table)
        .update({ latitude: loc.lat, longitude: loc.lng })
        .eq('id', r['id']);

      if (updateErr) throw new Error(`Supabase update error: ${updateErr.message}`);

      console.log(`[${table}/${r['id']}] OK — "${query}" → ${loc.lat}, ${loc.lng}`);
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[${table}/${r['id']}] ERROR: ${msg}`);
      errors++;
    }

    await sleep(DELAY_MS);
  }

  return { ok, skipped, errors };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== MASTRA-048 geocode-missing.ts — Geocoding API backfill ===');
  console.log('Tables: events, restaurants, tourist_destinations');
  console.log('');

  const stats: Record<TableName, { ok: number; skipped: number; errors: number }> = {
    events: { ok: 0, skipped: 0, errors: 0 },
    restaurants: { ok: 0, skipped: 0, errors: 0 },
    tourist_destinations: { ok: 0, skipped: 0, errors: 0 },
  };

  for (const table of TABLES) {
    stats[table] = await geocodeTable(table);
  }

  console.log('\n=== Summary ===');
  for (const table of TABLES) {
    const { ok, skipped, errors } = stats[table];
    console.log(`${table}: ${ok} ok / ${skipped} skipped / ${errors} errors`);
  }

  console.log('\nSC-5 verification:');
  console.log("  SELECT count(*) FROM events WHERE latitude IS NULL AND venue IS NOT NULL;  -- goal: 0");
  console.log("  SELECT count(*) FROM restaurants WHERE latitude IS NULL AND name IS NOT NULL;");
  console.log("  SELECT count(*) FROM tourist_destinations WHERE latitude IS NULL AND name IS NOT NULL;");
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
