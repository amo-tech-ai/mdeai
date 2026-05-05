# Google Maps Grounding

> Source: https://ai.google.dev/gemini-api/docs/maps-grounding (last updated 2026-04-28)
> **Status (2026-05-03):** Preview. Verified against the live docs by the mdeai gemini audit.

Maps grounding lets Gemini pull data from Google Maps (place details, opening hours, reviews snippets, neighborhood context, distance/time between points) into a single API call. It's a sibling of Google Search grounding — same response shape, different data source.

## When to use Maps vs Google Search

| Use Maps when… | Use Google Search when… |
|---|---|
| The user is asking "near me", "in [neighborhood]", "between X and Y" | The user is asking about facts, news, prices, current events |
| You need place details (address, hours, photos, ratings) | You need a free-form web answer |
| You need walking/driving distance between two points | You need real-time data not on Maps (sports scores, etc.) |
| Geographic reasoning is the dominant intent | The query has no geographic anchor |

For mdeai specifically: turn Maps **on** in `043-ai-venue-optimizer-edge-fn` (venue placement around a city); leave it **off** in `009-chatbot-event-creation` unless the user explicitly mentions a neighborhood.

## API configuration

Minimum config — adds Maps as an available tool the model can call:

```json
{
  "tools": [{ "googleMaps": {} }]
}
```

Optional `retrievalConfig` for "near me" queries — supplies the user's coordinates so Maps can rank nearby results:

```json
{
  "tools": [{ "googleMaps": {} }],
  "toolConfig": {
    "retrievalConfig": {
      "latLng": { "latitude": 6.244, "longitude": -75.581 }
    }
  }
}
```

(Coordinates above are downtown Medellín. Get them server-side from the user's IP geolocation or from `navigator.geolocation` in the browser.)

## SDK example (TypeScript / Deno)

```typescript
import { GoogleGenAI } from "npm:@google/genai@^1.0.0";

const ai = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY") });

const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: "I'm planning a 200-person event in El Poblado on Saturday night. " +
    "Suggest 3 venues with their address, capacity hint, and walking distance from Parque Lleras.",
  config: {
    tools: [{ googleMaps: {} }],
    toolConfig: {
      retrievalConfig: {
        latLng: { latitude: 6.2087, longitude: -75.5670 }, // Parque Lleras
      },
    },
  },
});

console.log(response.text);
```

## Combining with other tools

Maps + Google Search + custom function calling all work together in a single request (Gemini 3 only):

```typescript
config: {
  tools: [
    { googleMaps: {} },
    { googleSearch: {} },
    { functionDeclarations: [/* your custom fns */] },
  ],
}
```

See [`tool-combination.md`](./tool-combination.md) for required settings (`include_server_side_tool_invocations`, signature preservation).

## Response: groundingChunks

Like Google Search, Maps grounding returns `groundingMetadata` with `groundingChunks`. Each chunk represents a Maps place or directions result:

```typescript
const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
for (const chunk of chunks) {
  // chunk.web for Search-style results
  // chunk.maps for Maps-specific (when present)
  console.log(chunk.web?.uri, chunk.web?.title);
}
```

**G5 reminder:** persist these to `ai_runs.metadata.citations` so the UI can display "data from Google Maps" attribution per the [Maps Platform terms](https://cloud.google.com/maps-platform/terms).

## Pricing

| Tier | Cost |
|---|---|
| Free tier | 500 grounded prompts/day |
| Paid | $25 per 1,000 grounded prompts |

Billing is **per prompt**, not per query — even if Maps issues multiple internal lookups for one user message, you're charged once. (Contrast with Google Search on Gemini 3, which bills per *search query*.)

**Off by default:** Maps is opt-in. Don't enable it on every request — only when geographic intent is detected (regex on neighborhood names, "near", "between", etc.) or for tasks where it's always relevant (like venue optimizer).

## Models supporting Maps grounding

All current Gemini 3 models (Pro, Flash, Flash-Lite). Image preview models do not support Maps grounding.

## Limitations

- Cannot return raw Maps API objects (place IDs, photo references) — only natural-language summaries plus `groundingChunks` URLs
- Coverage is global but quality varies by region; Latin America is well-covered (Medellín included)
- No driving directions polyline — for that, call our `google-directions` edge function separately

## Anti-patterns

- ❌ Always-on Maps for every chat turn — burns the free tier in <12 hours and adds latency
- ❌ Passing `latLng` of `(0, 0)` as a placeholder — Maps treats this as off-the-coast-of-Africa and returns nothing useful; omit `retrievalConfig` instead
- ❌ Ignoring `groundingChunks` — without them you can't show source attribution, which the Maps Platform terms require
- ❌ Asking for routing/polylines — wrong tool, use `google-directions` edge function

## See also

- [`google-search.md`](./google-search.md) — sibling grounding tool, same response shape
- [`tool-combination.md`](./tool-combination.md) — using Maps + Search + custom functions together
- Live docs: https://ai.google.dev/gemini-api/docs/maps-grounding
