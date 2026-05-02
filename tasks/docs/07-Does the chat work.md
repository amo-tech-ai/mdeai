# Does the chat work? **Partially. What you're seeing is broken.**

Your screenshot shows the exact bug pattern I flagged in the audit:

- User sent **"list rentals poblado"** ✓
- An assistant bubble appeared with **"General Concierge"** label ✓
- But the bubble is **empty** — no response text ✗

That's a **dead stream**. The AI started responding, then returned nothing.

## Why it's doing that (3 likely causes, ranked)

### 1. You're not logged in (most likely — 70%)

[`useChat.ts:129`](https://claude.ai/epitaxy/src/hooks/useChat.ts:129) has this line:

```ts
if (!user || !content.trim()) return;
```

**If no user is logged in, `sendMessage` silently returns.** No error. No toast. Nothing. The button does nothing and you don't know why. The empty bubble you see is stale from a previous render.

**Fix:** Add `toast.error('Please log in to chat')` or allow true anonymous chat with clear UX. Right now it's a ghost button for signed-out users.

### 2. Tool call succeeded but returned no content (20%)

The model called `rentals_search` (it's a rental query, that's correct). The tool ran → called the `rentals` edge function → got an error or empty result → Gemini's follow-up stream returned no tokens → empty `assistantContent` → inserted empty row in DB → blank bubble shown.

[`ai-chat/index.ts:849-865`](https://claude.ai/epitaxy/supabase/functions/ai-chat/index.ts:849) — if `rentals` returns an error object, the second Gemini call may produce zero content chunks. No error is thrown, so the UI stays with an empty placeholder.

**Fix:** If `assistantContent === ''` after stream, show "I couldn't find any listings right now" instead of an empty bubble.

### 3. The `rentals` edge function is failing (10%)

Since your database has **0 rows in `apartments`** and **no `rentals` seed data**, the tool call hits empty results → Gemini has nothing useful to say → blanks out.

Confirm by checking browser DevTools → Network tab → look at the `/functions/v1/ai-chat` response body. If you see a stream with only `[DONE]` and no content chunks, cause #2 or #3 is the culprit.

## The audit in one paragraph

The chat system is **62/100**. The pipes (Gemini call, SSE streaming, RLS, realtime) are wired correctly. The bugs are in **state handling and trust**: your own messages appear duplicated because client UUID ≠ server UUID; the server blindly trusts whatever history the client sends (prompt injection); rapid clicks fire duplicate requests (double Gemini bills); anonymous users can burn your API key with no durable rate limit; assistant messages are only saved _after_ the stream finishes (lose messages on reload). **Plus the silent-return-when-logged-out bug you're hitting right now.**

## The 5 fixes that make it work

|#|Fix|Time|Effect|
|---|---|---|---|
|1|Show an error/login prompt instead of silent return when `user` is null|15 min|**Fixes your screenshot immediately**|
|2|Fallback text when stream ends with empty content|15 min|No more blank bubbles|
|3|Seed 20 apartments so tool calls return something|2 hours|Tools actually work|
|4|Return user message's server UUID from INSERT; use it in optimistic state|30 min|No duplicate messages|
|5|Require auth on edge function + DB-backed rate limit|2 hours|Can't get your Gemini bill nuked|

## Your next action

1. **Open the site in a normal browser tab** (not signed in). Type anything in the chat. If nothing happens, that confirms #1 above.
2. **Then sign in and try again.** If the bubble is still empty, open DevTools → Network → look at the `ai-chat` response. Paste the stream contents to me and I'll tell you exactly which bug fired.

The chat _can_ work. Right now, in its current state, **it does not work reliably for signed-out users, and it looks broken even when it's technically succeeding** (empty bubble = technically a successful stream with no content).