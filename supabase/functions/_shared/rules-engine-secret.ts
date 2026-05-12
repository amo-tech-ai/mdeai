/** Extract the rules-engine secret candidate from request headers.
 *  Prefers x-rules-engine-secret; falls back to Bearer token value.
 */
export function extractRulesEngineSecretCandidate(headers: Headers): string {
  const x = headers.get("x-rules-engine-secret");
  if (x != null && x.trim().length > 0) return x.trim();
  const auth = headers.get("Authorization");
  const m = auth?.match(/^Bearer\s*(.*)$/i);
  return String(m?.[1] ?? "").trim();
}
