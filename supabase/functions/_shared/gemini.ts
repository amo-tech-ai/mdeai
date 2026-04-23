/**
 * Shared Gemini API helper with built-in timeout.
 *
 * Centralizes the fetch call to Gemini's OpenAI-compatible endpoint
 * so every edge function gets consistent timeout, auth, and error handling.
 */

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

/**
 * Fetch from Gemini API with AbortController timeout.
 *
 * @param body - The request body (model, messages, etc.)
 * @param timeoutMs - Timeout in milliseconds (default 30s)
 * @returns The fetch Response
 * @throws DOMException with name "AbortError" on timeout
 */
export async function fetchGemini(
  body: Record<string, unknown>,
  timeoutMs = 30_000,
): Promise<Response> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY environment variable not set");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(GEMINI_ENDPOINT, {
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

/**
 * Fetch from Gemini API with streaming enabled + timeout.
 * Returns the raw Response for SSE streaming to client.
 */
export async function fetchGeminiStream(
  body: Record<string, unknown>,
  timeoutMs = 30_000,
): Promise<Response> {
  return fetchGemini({ ...body, stream: true }, timeoutMs);
}
