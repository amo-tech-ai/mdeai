/**
 * MASTRA-048 — cache-ai-summaries.ts
 *
 * Generates and caches Gemini ai_summary for rows that have google_place_id
 * but no ai_summary yet.
 *
 * WHY GEMINI (not Places generativeSummary):
 *   Places API generativeSummary returns null for all Colombian venues —
 *   it is US/India-only. Gemini generateContent is the correct fallback.
 *
 * Model: gemini-3-flash-preview (native @google/genai model ID) — direct text output.
 * Cost: billed per token; ~2-sentence output ≈ 50–80 output tokens/venue.
 *
 * Usage:
 *   cd /home/sk/mde
 *   npx ts-node --esm scripts/cache-ai-summaries.ts 2>&1 | tee scripts/ai-summaries.log
 *
 * Idempotent: only processes rows WHERE ai_summary IS NULL.
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// ─── Environment ───────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required');
if (!SUPABASE_URL) throw new Error('SUPABASE_URL is required');
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

// ─── Config ────────────────────────────────────────────────────────────────────

// gemini-3-flash-preview: current fast model for direct-output tasks
// Use bare model ID (no 'google/' prefix) for native @google/genai SDK
const REASONING_MODEL = 'gemini-3-flash-preview';
const DELAY_MS = 400;
const MAX_OUTPUT_TOKENS = 150;

// ─── Clients ────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Exponential backoff retry for transient Gemini errors (429 quota, 5xx server errors).
 * Gives up after maxRetries attempts; propagates non-retryable errors immediately.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const is429 = msg.includes('429') || msg.toLowerCase().includes('quota');
      const is5xx = /5\d\d/.test(msg);
      if ((is429 || is5xx) && attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
        process.stderr.write(`[RETRY] attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms — ${msg.slice(0, 80)}\n`);
        await sleep(delayMs);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

async function generateSummary(name: string, neighborhood: string, category?: string): Promise<string | null> {
  const categoryHint = category ? ` (${category})` : '';
  const prompt = `Write a 2-sentence venue summary for ${name}${categoryHint} in ${neighborhood}, Medellín, Colombia. Use only factual, verifiable information about the venue. Output plain text only — no markdown, no bullet points.`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: REASONING_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.3,
        // Disable internal thinking budget: gemini-3-flash-preview uses thinking tokens
        // by default which consume the entire maxOutputTokens before the actual
        // response can be generated. thinkingBudget=0 forces direct output.
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
  );

  const text = response.text?.trim();
  if (!text || text.length < 20) return null;
  return text;
}

// ─── Summary loop ─────────────────────────────────────────────────────────────

type SummarisableTable = 'restaurants' | 'tourist_destinations' | 'events';

interface GenerateForTableOpts {
  /**
   * Column to include as a category hint in the venue prompt (e.g. 'cuisine_types', 'category').
   * Ignored when promptBuilder is provided.
   */
  categoryColumn?: string;

  /**
   * Additional columns to SELECT beyond id, name, address.
   */
  extraColumns?: string[];

  /**
   * Custom prompt builder — overrides the default venue summary prompt.
   * Used for events where we describe the event, not just the venue.
   */
  promptBuilder?: (row: Record<string, unknown>) => string;
}

async function generateForTable(
  table: SummarisableTable,
  opts: GenerateForTableOpts = {},
): Promise<{ ok: number; skipped: number; errors: number }> {
  console.log(`\n[${table}] Fetching rows where google_place_id IS NOT NULL AND ai_summary IS NULL…`);

  // Build SELECT column list
  const selectCols = ['id', 'name', 'address'];
  if (opts.categoryColumn && !selectCols.includes(opts.categoryColumn)) selectCols.push(opts.categoryColumn);
  if (opts.extraColumns) {
    for (const col of opts.extraColumns) {
      if (!selectCols.includes(col)) selectCols.push(col);
    }
  }

  const { data: rows, error } = await supabase
    .from(table)
    .select(selectCols.join(', '))
    .not('google_place_id', 'is', null)
    .is('ai_summary', null);

  if (error) throw new Error(`Supabase read error: ${error.message}`);

  console.log(`[${table}] ${rows?.length ?? 0} rows to summarise`);

  let ok = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows ?? []) {
    const r = row as Record<string, unknown>;
    const name = r['name'] as string | undefined;
    const neighborhood = r['address'] as string | undefined;

    if (!name) { skipped++; continue; }

    try {
      let summary: string | null;

      if (opts.promptBuilder) {
        // Custom prompt builder (e.g. events)
        const prompt = opts.promptBuilder(r);
        const response = await withRetry(() =>
          ai.models.generateContent({
            model: REASONING_MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              maxOutputTokens: MAX_OUTPUT_TOKENS,
              temperature: 0.3,
              thinkingConfig: { thinkingBudget: 0 },
            },
          })
        );
        const text = response.text?.trim();
        summary = (!text || text.length < 20) ? null : text;
      } else {
        // Default venue summary prompt
        const rawCat = opts.categoryColumn ? r[opts.categoryColumn] : undefined;
        const category = Array.isArray(rawCat) ? rawCat.join(', ') : rawCat as string | undefined;
        summary = await generateSummary(name, neighborhood ?? 'Medellín', category);
      }

      if (!summary) {
        console.warn(`[${table}/${row.id}] Empty summary for "${name}" — skipping`);
        skipped++;
        await sleep(DELAY_MS);
        continue;
      }

      const { error: updateErr } = await supabase
        .from(table)
        .update({ ai_summary: summary })
        .eq('id', row.id);

      if (updateErr) throw new Error(updateErr.message);

      console.log(`[${table}/${row.id}] OK — "${name}": ${summary.slice(0, 80)}…`);
      ok++;
    } catch (err) {
      console.error(`[${table}/${row.id}] ERROR: ${err instanceof Error ? err.message : String(err)}`);
      errors++;
    }

    await sleep(DELAY_MS);
  }

  return { ok, skipped, errors };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== MASTRA-048 cache-ai-summaries.ts — Gemini venue summaries ===');
  console.log(`Model: ${REASONING_MODEL}`);
  console.log('NOTE: generativeSummary (Places API) unavailable for Colombia — using Gemini');
  console.log('');

  const restaurantStats = await generateForTable('restaurants', { categoryColumn: 'cuisine_types' });
  const attractionStats = await generateForTable('tourist_destinations', { categoryColumn: 'category' });

  // Events: describe the event itself (name + type + venue + date), not just the venue.
  // Places API generativeSummary is venue-only — events need an event-aware prompt.
  const eventStats = await generateForTable('events', {
    extraColumns: ['event_type', 'event_start_time'],
    promptBuilder: (row) => {
      const name = row['name'] as string;
      const venue = row['address'] as string | undefined;
      const eventType = row['event_type'] as string | undefined;
      const startTime = row['event_start_time'] as string | undefined;
      const dateHint = startTime
        ? ` on ${new Date(startTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
        : '';
      const typeHint = eventType ? ` (${eventType})` : '';
      const venueHint = venue ? ` at ${venue}` : ' in Medellín, Colombia';
      return `Write a 2-sentence description of the event "${name}"${typeHint}${venueHint}${dateHint}. Focus on what attendees will experience. Output plain text only — no markdown, no bullet points.`;
    },
  });

  console.log('\n=== Summary ===');
  console.log(`restaurants:          ${restaurantStats.ok} ok / ${restaurantStats.skipped} skipped / ${restaurantStats.errors} errors`);
  console.log(`tourist_destinations: ${attractionStats.ok} ok / ${attractionStats.skipped} skipped / ${attractionStats.errors} errors`);
  console.log(`events:               ${eventStats.ok} ok / ${eventStats.skipped} skipped / ${eventStats.errors} errors`);
  console.log(`\nSC-4 verification:`);
  console.log(`  SELECT count(*) FROM restaurants WHERE google_place_id IS NOT NULL AND ai_summary IS NULL;  -- should be ≤ 20%`);
  console.log(`  SELECT count(*) FROM tourist_destinations WHERE google_place_id IS NOT NULL AND ai_summary IS NULL;`);
  console.log(`  SELECT count(*) FROM events WHERE google_place_id IS NOT NULL AND ai_summary IS NULL;`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
