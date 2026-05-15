/**
 * Billing and compliance regression tests for the Places API enrichment pipeline.
 *
 * PURPOSE: Prevent accidental changes to the field mask or Gemini config that
 * would silently increase billing or break the AI summary pipeline.
 *
 * These tests read the actual script source so they catch edits to the
 * constants directly — not just a separate copy of the expected value.
 *
 * Reference:
 *   - Field masks: developers.google.com/maps/documentation/places/web-service/choose-fields
 *   - thinkingBudget: ai.google.dev/gemini-api/docs (thinking models)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Resolve paths relative to repo root from this test file location
const REPO_ROOT = resolve(__dirname, '../../');

function readScript(name: string): string {
  return readFileSync(resolve(REPO_ROOT, 'scripts', name), 'utf-8');
}

// ─── enrich-places.ts ─────────────────────────────────────────────────────────

describe('enrich-places.ts — field mask compliance (MASTRA-073)', () => {
  const script = readScript('enrich-places.ts');

  it('FIELD_MASK is defined and equals the MASTRA-073 signed mask exactly', () => {
    const match = script.match(/const FIELD_MASK\s*=\s*['"]([^'"]+)['"]/);
    expect(match, 'FIELD_MASK constant must be defined').toBeTruthy();
    expect(match![1]).toBe(
      'places.id,places.displayName,places.googleMapsLinks,places.location',
    );
  });

  it('FIELD_MASK has no spaces (Google rejects them with 400)', () => {
    const match = script.match(/const FIELD_MASK\s*=\s*['"]([^'"]+)['"]/);
    expect(match![1]).not.toContain(' ');
  });

  it('FIELD_MASK has no wildcard (would trigger Advanced SKU billing)', () => {
    const match = script.match(/const FIELD_MASK\s*=\s*['"]([^'"]+)['"]/);
    expect(match![1]).not.toContain('*');
  });

  it('All FIELD_MASK fields have places. prefix (Text Search New requirement)', () => {
    const match = script.match(/const FIELD_MASK\s*=\s*['"]([^'"]+)['"]/);
    const fields = match![1].split(',');
    expect(fields.length).toBeGreaterThanOrEqual(3);
    expect(fields.every((f) => f.startsWith('places.'))).toBe(true);
  });

  it('FIELD_MASK does not include expensive SKU fields (billing protection)', () => {
    const match = script.match(/const FIELD_MASK\s*=\s*['"]([^'"]+)['"]/);
    const mask = match![1];
    // These trigger Pro/Advanced SKUs unnecessarily
    expect(mask).not.toMatch(
      /rating|priceLevel|photos|reviews|generativeSummary|editorialSummary|regularOpeningHours/,
    );
  });

  it('events table is included in enrichTable calls', () => {
    // Regression guard: events must be enriched (was 0/49 before MASTRA-048 fix)
    expect(script).toContain("enrichTable('events'");
  });

  it('withRetry wraps the fetch call (429 backoff regression guard)', () => {
    expect(script).toContain('withRetry(');
    // Must retry on 429 specifically
    expect(script).toContain("'429'");
  });
});

// ─── cache-ai-summaries.ts ─────────────────────────────────────────────────────

describe('cache-ai-summaries.ts — Gemini config compliance', () => {
  const script = readScript('cache-ai-summaries.ts');

  it('thinkingBudget: 0 is set (prevents thinking model empty output)', () => {
    // Thinking models (gemini-3-flash-preview) consume all maxOutputTokens for
    // internal reasoning unless thinkingBudget: 0 is set. Without this, every
    // AI summary returns empty string and the fill rate drops to ~30%.
    expect(script).toContain('thinkingBudget: 0');
  });

  it('Model is gemini-3-flash-preview (not deprecated gemini-2.5-*)', () => {
    // gemini-2.5-flash and gemini-2.5-pro are deprecated — never use them.
    expect(script).toContain('gemini-3-flash-preview');
    expect(script).not.toMatch(/gemini-2\.5-flash|gemini-2\.5-pro/);
  });

  it('withRetry wraps the Gemini call (quota/429 backoff)', () => {
    expect(script).toContain('withRetry(');
    // Gemini-specific quota check
    expect(script).toContain("'quota'");
  });

  it('maxOutputTokens is set (prevents unbounded token billing)', () => {
    expect(script).toMatch(/maxOutputTokens\s*:/);
  });

  it('temperature is set to 0.3 (deterministic summaries)', () => {
    expect(script).toMatch(/temperature\s*:\s*0\.3/);
  });
});

// ─── enrich-places.ts — cache-aside compliance ────────────────────────────────

describe('enrich-places.ts — cache-aside compliance (MASTRA-074)', () => {
  const script = readScript('enrich-places.ts');

  it('imports createHash for cache key generation', () => {
    expect(script).toContain("import { createHash } from 'crypto'");
  });

  it('reads from places_search_cache before calling Places API', () => {
    expect(script).toContain('places_search_cache');
    expect(script).toContain('query_hash');
    // Cache check must precede the Places API fetch
    const cacheIdx = script.indexOf('places_search_cache');
    const apiIdx = script.indexOf('places.googleapis.com');
    expect(cacheIdx).toBeLessThan(apiIdx);
  });

  it('LOCATION_KEY is defined for cache records', () => {
    expect(script).toContain("LOCATION_KEY = '6.2442,-75.5812,30000'");
  });

  it('cache write uses 48h TTL (Google ToS max is 30 days)', () => {
    // 48 hours in milliseconds = 48 * 60 * 60 * 1000
    expect(script).toContain('48 * 60 * 60 * 1000');
  });

  it('cache upsert uses onConflict: query_hash (idempotent writes)', () => {
    expect(script).toContain("onConflict: 'query_hash'");
  });

  it('cache write is non-blocking (void / fire-and-forget)', () => {
    // void prevents cache write from blocking enrichment on transient errors
    const cacheWriteIdx = script.indexOf('CACHE WRITE ERROR');
    const voidIdx = script.lastIndexOf('void supabase', cacheWriteIdx);
    expect(voidIdx).toBeGreaterThan(0);
  });
});

// ─── geocode-missing.ts ─────────────────────────────────────────────────────

// ─── ai-chat maps grounding compliance ────────────────────────────────────────

describe('ai-chat/index.ts — Maps Grounding compliance (MDEAI_MAPS_GROUNDING)', () => {
  function readEdgeFn(name: string): string {
    return readFileSync(
      resolve(REPO_ROOT, 'supabase', 'functions', name, 'index.ts'),
      'utf-8',
    );
  }

  const aiChat = readEdgeFn('ai-chat');

  it('groundWithMaps function is defined', () => {
    expect(aiChat).toContain('async function groundWithMaps(');
  });

  it('Maps Grounding uses correct REST key "googleMaps" (camelCase — not google_maps)', () => {
    // REST API spec (ai.google.dev/gemini-api/docs/maps-grounding) shows
    // "tools": [{"googleMaps": {}}] — NOT {"google_maps": {}}.
    expect(aiChat).toContain('{ googleMaps: {} }');
    // The tools literal must not use snake_case key (comments are fine; this checks
    // only the tools array literal that gets sent to the API)
    expect(aiChat).not.toContain('[{ google_maps:');
  });

  it('Maps Grounding is gated behind MDEAI_MAPS_GROUNDING feature flag', () => {
    expect(aiChat).toContain('MDEAI_MAPS_GROUNDING');
  });

  it('Maps Grounding provides Medellín lat/lng (6.2442, -75.5812)', () => {
    expect(aiChat).toContain('6.2442');
    expect(aiChat).toContain('-75.5812');
  });

  it('Maps Grounding has an 8s timeout (pre-pass must not stall main chat)', () => {
    expect(aiChat).toContain('AbortSignal.timeout(8_000)');
  });

  it('Maps Grounding is non-fatal — errors return null, not throw', () => {
    // The catch block returns null so main chat always proceeds
    expect(aiChat).toContain('return null;');
    // Feature is non-fatal: must not re-throw inside groundWithMaps
    const fnStart = aiChat.indexOf('async function groundWithMaps(');
    const fnEnd = aiChat.indexOf('\nasync function ', fnStart + 1);
    const fnBody = fnEnd > 0 ? aiChat.slice(fnStart, fnEnd) : aiChat.slice(fnStart);
    expect(fnBody).not.toContain('throw ');
  });
});

describe('geocode-missing.ts — column compliance', () => {
  const script = readScript('geocode-missing.ts');

  it('Uses address column (not deprecated neighborhood/venue columns)', () => {
    // Pre-fix bug: script used venue and neighborhood columns that do not exist
    // on the events table. Regression guard to prevent re-introduction.
    expect(script).not.toContain("'id, name, venue, neighborhood'");
    expect(script).not.toContain('row[\'venue\']');
    expect(script).not.toContain('row[\'neighborhood\']');
  });

  it('selectCols uses address column for all tables', () => {
    expect(script).toContain("'id, name, address'");
  });

  it('SC-5 verification SQL references name not venue', () => {
    expect(script).toContain('name IS NOT NULL');
    expect(script).not.toContain('venue IS NOT NULL');
  });
});
