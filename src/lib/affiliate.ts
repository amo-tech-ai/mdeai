/**
 * Outbound URL rewriter — appends affiliate / partner tracking tags to
 * known partner-program domains. Pluggable rule set; per-domain env vars
 * gate whether the rewrite actually happens.
 *
 * Behavior contract:
 *   1. Unknown domain → URL unchanged, tag = null, didRewrite = false.
 *   2. Known domain, env tag NOT set → URL unchanged, tag = '<program>',
 *      didRewrite = false. (We still surface the tag so analytics can
 *      track the lost-affiliate-revenue funnel.)
 *   3. Known domain, env tag set, URL doesn't already have the param →
 *      param appended, tag = '<program>', didRewrite = true.
 *   4. Known domain, env tag set, URL ALREADY has the param → URL
 *      unchanged (don't override an upstream tag — could break a partner
 *      pre-attribution), tag = '<program>', didRewrite = false.
 *   5. Malformed / non-http URL → URL unchanged, tag = null,
 *      didRewrite = false.
 *
 * Env tags are read from import.meta.env at call time (so dev / preview
 * builds with no tags configured fall through cleanly). They're safe to
 * ship in the client bundle — affiliate IDs are public-facing query
 * params by design.
 *
 * Adding a new partner: append to RULES below + document the env var.
 */

interface Rule {
  /** Test the URL hostname (lowercased, www stripped). */
  match: (host: string) => boolean;
  /** Query param the partner uses for attribution. */
  param: string;
  /** Env var that holds the partner ID / tag. */
  envVar:
    | 'VITE_BOOKING_AID'
    | 'VITE_AIRBNB_AFFILIATE_TAG'
    | 'VITE_VRBO_AFFILIATE_TAG';
  /** Short identifier persisted in `outbound_clicks.affiliate_tag`. */
  tag: 'booking' | 'airbnb' | 'vrbo';
}

const RULES: Rule[] = [
  {
    match: (h) => /(^|\.)booking\./.test(h),
    param: 'aid',
    envVar: 'VITE_BOOKING_AID',
    tag: 'booking',
  },
  {
    match: (h) => /(^|\.)airbnb\./.test(h),
    param: 'af',
    envVar: 'VITE_AIRBNB_AFFILIATE_TAG',
    tag: 'airbnb',
  },
  {
    match: (h) => /(^|\.)vrbo\./.test(h),
    param: 'utm_source',
    envVar: 'VITE_VRBO_AFFILIATE_TAG',
    tag: 'vrbo',
  },
];

export interface AffiliateRewriteResult {
  /** The (possibly rewritten) URL to navigate to. */
  url: string;
  /** Partner tag identifier, or null if no rule matched. */
  tag: 'booking' | 'airbnb' | 'vrbo' | null;
  /** True only if the URL was actually mutated (param appended). */
  didRewrite: boolean;
}

/**
 * Apply the matching affiliate rule, if any. The `env` argument is
 * injectable for tests; default reads `import.meta.env`.
 */
export function applyAffiliateTag(
  input: string,
  env: Record<string, string | undefined> = import.meta.env as unknown as Record<
    string,
    string | undefined
  >,
): AffiliateRewriteResult {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return { url: input, tag: null, didRewrite: false };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { url: input, tag: null, didRewrite: false };
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  for (const rule of RULES) {
    if (!rule.match(host)) continue;
    const value = env[rule.envVar];
    if (!value || !value.trim()) {
      return { url: input, tag: rule.tag, didRewrite: false };
    }
    if (parsed.searchParams.has(rule.param)) {
      // Don't override an upstream attribution param.
      return { url: parsed.toString(), tag: rule.tag, didRewrite: false };
    }
    parsed.searchParams.set(rule.param, value.trim());
    return { url: parsed.toString(), tag: rule.tag, didRewrite: true };
  }
  return { url: input, tag: null, didRewrite: false };
}
