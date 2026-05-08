import { getCorsHeaders, jsonResponse, errorBody } from "../_shared/http.ts";
import { getUserId } from "../_shared/supabase-clients.ts";
import { callGeminiStructured, withRetry } from "../_shared/gemini.ts";

// JSON schema for the AI optimization output (G1).
const optimizationSchema = {
  type: "object",
  properties: {
    order: {
      type: "array",
      items: { type: "integer", minimum: 1 },
      description: "1-indexed positions of items in their optimal sequence",
    },
    reasoning: {
      type: "string",
      description: "Brief explanation of the optimization logic",
    },
  },
  required: ["order", "reasoning"],
  additionalProperties: false,
};

interface OptimizationSchemaShape {
  order: number[];
  reasoning: string;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateTotalDistance(items: TripItemInput[]): number {
  let total = 0;
  for (let i = 0; i < items.length - 1; i++) {
    if (items[i].latitude && items[i].longitude && items[i + 1].latitude && items[i + 1].longitude) {
      total += calculateDistance(
        items[i].latitude!,
        items[i].longitude!,
        items[i + 1].latitude!,
        items[i + 1].longitude!,
      );
    }
  }
  return total;
}

interface TripItemInput {
  id: string;
  title: string;
  latitude: number | null;
  longitude: number | null;
  item_type: string;
  start_at: string | null;
}

interface OptimizeRequest {
  items: TripItemInput[];
  dayDate: string;
  preferences?: {
    startLocation?: { lat: number; lng: number };
    prioritizeByType?: string[];
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  // Optional user JWT — extract for logging, do not block unauthenticated callers
  const authHeader = req.headers.get("Authorization");
  const userId = await getUserId(authHeader);
  console.log("ai-optimize-route caller:", userId ?? "anonymous");

  try {
    const { items, dayDate, preferences } = (await req.json()) as OptimizeRequest;

    if (!items || items.length < 2) {
      return jsonResponse(
        { optimizedOrder: items?.map((i) => i.id) || [], explanation: "Need at least 2 items to optimize route.", savings: { distanceKm: 0, timeMinutes: 0 } },
        200,
        req,
      );
    }

    const itemsWithCoords = items.filter((i) => i.latitude && i.longitude);
    const itemsWithoutCoords = items.filter((i) => !i.latitude || !i.longitude);

    if (itemsWithCoords.length < 2) {
      return jsonResponse(
        { optimizedOrder: items.map((i) => i.id), explanation: "Not enough items with location data to optimize. Add addresses to your activities for better optimization.", savings: { distanceKm: 0, timeMinutes: 0 } },
        200,
        req,
      );
    }

    const originalDistance = calculateTotalDistance(itemsWithCoords);
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      const optimized = nearestNeighborOptimize(itemsWithCoords, preferences?.startLocation);
      const newDistance = calculateTotalDistance(optimized);
      const savings = originalDistance - newDistance;
      return jsonResponse(
        { optimizedOrder: [...optimized.map((i) => i.id), ...itemsWithoutCoords.map((i) => i.id)], explanation: `Route optimized using nearest-neighbor algorithm. Estimated savings: ${savings.toFixed(1)} km.`, savings: { distanceKm: Math.max(0, savings), timeMinutes: Math.round(Math.max(0, savings) / 25 * 60) } },
        200,
        req,
      );
    }

    const itemDescriptions = itemsWithCoords
      .map((item, idx) => `${idx + 1}. "${item.title}" (${item.item_type}) at coordinates (${item.latitude}, ${item.longitude})`)
      .join("\n");

    const systemInstruction = `You are an expert route optimizer for Medellín, Colombia. Given a list of activities with their coordinates, suggest the optimal order to visit them to minimize total travel time and distance.\n\nConsider:\n- Geographic clustering (visit nearby places together)\n- Typical traffic patterns in Medellín\n- Logical meal timing (restaurants around lunch/dinner hours)\n- Activity types (start with outdoor activities in morning when cooler)\n\nThe "order" array contains the original position numbers (1-indexed) in the optimal sequence.`;

    const userPrompt = `Optimize this itinerary for ${dayDate}:\n\n${itemDescriptions}\n\n${preferences?.startLocation ? `Starting from coordinates: (${preferences.startLocation.lat}, ${preferences.startLocation.lng})` : ""}`;

    let optimizationResult: OptimizationSchemaShape;
    try {
      const result = await withRetry(() =>
        callGeminiStructured<OptimizationSchemaShape>({
          model: "gemini-3-flash-preview",
          prompt: userPrompt,
          systemInstruction,
          responseJsonSchema: optimizationSchema,
          thinkingLevel: "low",
          agentName: "route_optimizer",
          timeoutMs: 15_000,
        })
      );
      optimizationResult = result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = (err as { status?: number })?.status;

      if (status === 429 || message === "RESOURCE_EXHAUSTED") {
        return jsonResponse({ error: "Rate limit exceeded. Please try again later." }, 429, req);
      }
      if (status === 402) {
        return jsonResponse({ error: "AI credits exhausted. Please add credits to continue." }, 402, req);
      }

      console.error("AI optimization failed, using nearest-neighbor:", message);
      const optimized = nearestNeighborOptimize(itemsWithCoords, preferences?.startLocation);
      const newDistance = calculateTotalDistance(optimized);
      const savings = originalDistance - newDistance;
      return jsonResponse(
        { optimizedOrder: [...optimized.map((i) => i.id), ...itemsWithoutCoords.map((i) => i.id)], explanation: `Route optimized algorithmically. Estimated savings: ${savings.toFixed(1)} km.`, savings: { distanceKm: Math.max(0, savings), timeMinutes: Math.round(Math.max(0, savings) / 25 * 60) } },
        200,
        req,
      );
    }

    const reorderedItems = optimizationResult.order.map((idx) => itemsWithCoords[idx - 1]).filter(Boolean);
    const newDistance = calculateTotalDistance(reorderedItems);
    const savings = originalDistance - newDistance;

    return jsonResponse(
      { optimizedOrder: [...reorderedItems.map((i) => i.id), ...itemsWithoutCoords.map((i) => i.id)], explanation: optimizationResult.reasoning, savings: { distanceKm: Math.max(0, savings), timeMinutes: Math.round(Math.max(0, savings) / 25 * 60) }, originalDistance, newDistance },
      200,
      req,
    );
  } catch (error) {
    console.error("Route optimization error:", error);
    return jsonResponse(errorBody("INTERNAL", error instanceof Error ? error.message : "Unknown error"), 500, req);
  }
});

function nearestNeighborOptimize(
  items: TripItemInput[],
  startLocation?: { lat: number; lng: number },
): TripItemInput[] {
  if (items.length <= 1) return items;
  const remaining = [...items];
  const result: TripItemInput[] = [];
  let current: { lat: number; lng: number };

  if (startLocation) {
    current = startLocation;
  } else {
    const first = remaining.shift()!;
    result.push(first);
    current = { lat: first.latitude!, lng: first.longitude! };
  }

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i];
      if (item.latitude && item.longitude) {
        const dist = calculateDistance(current.lat, current.lng, item.latitude, item.longitude);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }
    }
    const nearest = remaining.splice(nearestIdx, 1)[0];
    result.push(nearest);
    current = { lat: nearest.latitude!, lng: nearest.longitude! };
  }

  return result;
}
