/**
 * Shared Gemini API helpers: OpenAI-compat chat (with timeout),
 * retries, and REST generateContent for JSON-schema structured output + tools.
 */

import { safeJsonParse } from "./json.ts";

const GEMINI_OAI_COMPAT =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

const GEMINI_GENERATE_CONTENT =
  "https://generativelanguage.googleapis.com/v1beta/models";

/** Retry transient failures / rate limits */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { retries?: number; baseDelayMs?: number },
): Promise<T> {
  const retries = opts?.retries ?? 3;
  const baseDelayMs = opts?.baseDelayMs ?? 400;
  let last: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
      }
    }
  }
  throw last;
}

export async function fetchGemini(
  body: Record<string, unknown>,
  timeoutMs = 30_000,
): Promise<Response> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY environment variable not set");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(GEMINI_OAI_COMPAT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchGeminiStream(
  body: Record<string, unknown>,
  timeoutMs = 30_000,
): Promise<Response> {
  return fetchGemini({ ...body, stream: true }, timeoutMs);
}

export type GeminiStructuredToolEntry =
  | { googleSearch: Record<string, never> }
  | { google_search: Record<string, never> }
  | { urlContext: Record<string, never> }
  | { url_context: Record<string, never> };

export interface CallGeminiStructuredArgs {
  model: string;
  prompt: string;
  /** OpenAPI-ish JSON Schema (subset Gemini accepts). */
  responseJsonSchema: Record<string, unknown>;
  systemInstruction?: string;
  thinkingLevel?: string;
  tools?: GeminiStructuredToolEntry[];
  timeoutMs: number;
  agentName: string;
}

export interface CallGeminiStructuredResult<T> {
  data: T;
  usage: {
    input_tokens: number | null;
    output_tokens: number | null;
    total_tokens: number | null;
  };
  citations?: unknown;
}

/** Map OpenAI-compat usage.prompt_tokens shape */
function usageFromGenerateContentMeta(meta: Record<string, unknown> | undefined) {
  const n = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  return {
    input_tokens: n(meta?.promptTokenCount),
    output_tokens: n(meta?.candidatesTokenCount ?? meta?.candidates_tokens),
    total_tokens: n(meta?.totalTokenCount),
  };
}

function geminiGenerateTools(tools?: GeminiStructuredToolEntry[]): Record<string, unknown>[] {
  if (!tools?.length) return [];
  const rest: Record<string, unknown>[] = [];
  for (const t of tools) {
    if ("googleSearch" in t || "google_search" in t) rest.push({ google_search: {} });
    else if ("urlContext" in t || "url_context" in t) rest.push({ url_context: {} });
  }
  return rest;
}

/**
 * Prefer native generateContent (JSON schema + tools). Falls back to OpenAI-compat JSON object.
 */
export async function callGeminiStructured<T>(
  args: CallGeminiStructuredArgs,
): Promise<CallGeminiStructuredResult<T>> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY environment variable not set");

  const modelId = args.model.replace(/^models\//, "");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), args.timeoutMs);

  try {
    const url = `${GEMINI_GENERATE_CONTENT}/${encodeURIComponent(modelId)}:generateContent`;
    const contents: Record<string, unknown>[] = [{
      role: "user",
      parts: [{ text: args.prompt }],
    }];

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: args.responseJsonSchema,
      },
    };

    if (args.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: args.systemInstruction }],
      };
    }

    const restTools = geminiGenerateTools(args.tools);
    if (restTools.length > 0) body.tools = restTools;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (res.ok) {
      const j = await res.json() as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
          groundingMetadata?: unknown;
        }>;
        usageMetadata?: Record<string, unknown>;
      };
      const partText = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      const parsed = safeJsonParse(partText) as T | null;
      if (parsed !== null && typeof parsed === "object") {
        return {
          data: parsed,
          usage: usageFromGenerateContentMeta(j.usageMetadata),
          citations: j.candidates?.[0]?.groundingMetadata,
        };
      }
      const healed = await callGeminiStructuredOpenAiFallback<T>(
        args,
        Math.min(15_000, args.timeoutMs),
      ).catch(() => null);
      if (healed) return healed;
      throw new Error("GEMINI_STRUCTURED_PARSE_FAILED");
    }

    const errText = await res.text();

    const legacy = await callGeminiStructuredOpenAiFallback<T>(
      args,
      Math.min(15_000, args.timeoutMs),
    ).catch(() => null);
    if (legacy) return legacy;

    throw new Error(`GEMINI_HTTP_${res.status}: ${errText.slice(0, 480)}`);
  } catch (e) {
    const isAbort =
      (typeof DOMException !== "undefined" && e instanceof DOMException &&
        e.name === "AbortError") ||
      (e instanceof Error && e.name === "AbortError");
    if (isAbort) {
      throw new Error("GEMINI_TIMEOUT");
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callGeminiStructuredOpenAiFallback<T>(
  args: CallGeminiStructuredArgs,
  timeoutMs: number,
): Promise<CallGeminiStructuredResult<T>> {
  const messages: Array<{ role: string; content: string }> = [];
  if (args.systemInstruction) {
    messages.push({ role: "system", content: args.systemInstruction });
  }
  messages.push({
    role: "user",
    content: `${args.prompt}\n\nRespond with ONLY JSON matching this schema (no markdown):\n${
      JSON.stringify(args.responseJsonSchema)
    }`,
  });

  const res = await fetchGemini({
    model: args.model,
    messages,
    temperature: 0.2,
    response_format: { type: "json_object" },
  }, timeoutMs);

  const rawText = await res.text();
  if (!res.ok) throw new Error(`GEMINI_COMPAT_HTTP_${res.status}: ${rawText.slice(0, 240)}`);

  const parsedBody = safeJsonParse(rawText) as Record<string, unknown> | null;
  const choice = parsedBody?.choices as Array<{ message?: { content?: string } }> | undefined;
  const txt = choice?.[0]?.message?.content ?? "";
  const parsed = safeJsonParse(txt.trim()) as T | null;

  const u = parsedBody?.usage as Record<string, unknown> | undefined;
  const n = (x: unknown): number | null =>
    typeof x === "number" && Number.isFinite(x) ? x : null;

  if (parsed !== null && typeof parsed === "object") {
    return {
      data: parsed,
      usage: {
        input_tokens: n(u?.prompt_tokens),
        output_tokens: n(u?.completion_tokens),
        total_tokens: n(u?.total_tokens),
      },
    };
  }
  throw new Error("GEMINI_COMPAT_PARSE_FAILED");
}
