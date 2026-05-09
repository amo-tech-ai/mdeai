# Edge Function Patterns

## Location

All edge functions live in `supabase/functions/<name>/index.ts`

## Request Lifecycle

Every edge function follows this order:

1. **CORS** — Handle OPTIONS preflight
2. **Auth** — Extract and validate JWT from Authorization header
3. **Input** — Parse body and validate with Zod schema
4. **Logic** — Execute business logic
5. **Response** — Return structured JSON

```typescript
// Standard template
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return errorResponse(401, 'UNAUTHORIZED', 'Missing auth');

  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) return errorResponse(401, 'UNAUTHORIZED', 'Invalid token');

  const body = schema.parse(await req.json());
  // ... logic
  return successResponse(result);
});
```

## Response Format

```typescript
// Success
{ success: true, data: T, meta?: { total, page, limit } }

// Error
{ success: false, error: { code: string, message: string, details?: any } }
```

## AI-Specific Rules

- Log every AI call to `ai_runs` table: agent_name, input_tokens, output_tokens, duration_ms, status
- Rate limit: 10 AI calls/min/user, 30 search calls/min/user
- Timeout: 30s for Gemini API, 10s for DB queries
- Stream responses for chat (SSE)
- Never return raw model output — always validate and structure
- Production AI is **Gemini-only**. No `@anthropic-ai/*` SDK calls in `supabase/functions/`.

## Secrets

Edge function secrets are loaded from Infisical → Supabase (see [.claude/skills/mde-infisical/](../skills/mde-infisical/)). Never hardcoded, never in `.env`.
- `GEMINI_API_KEY` — Google Gemini API (all edge AI calls)
- `SUPABASE_SERVICE_ROLE_KEY` — admin DB access
- `GOOGLE_MAPS_API_KEY` — directions API
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — payments (`mde-stripe`)
- `STAFF_LINK_SECRET`, `QR_SIGNING_SECRET` — ticket / staff links
