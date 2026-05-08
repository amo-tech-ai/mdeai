import { getCorsHeaders, jsonResponse, errorBody } from "../_shared/http.ts";
import { getUserId } from "../_shared/supabase-clients.ts";

interface Waypoint {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
}

interface DirectionsRequest {
  waypoints: Waypoint[];
  optimizeOrder?: boolean;
}

interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
  startLocation: { latitude: number; longitude: number };
  endLocation: { latitude: number; longitude: number };
  steps: unknown[];
  polyline: string;
}

interface DirectionsResponse {
  success: boolean;
  legs: RouteLeg[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  overviewPolyline: string;
  waypointOrder?: number[];
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  // Optional user JWT — extract for logging, do not block unauthenticated callers
  const authHeader = req.headers.get("Authorization");
  const userId = await getUserId(authHeader);
  console.log("google-directions caller:", userId ?? "anonymous");

  try {
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      return jsonResponse(errorBody("CONFIG_ERROR", "Google Maps API key not configured"), 500, req);
    }

    const { waypoints, optimizeOrder = false }: DirectionsRequest = await req.json();

    if (!waypoints || waypoints.length < 2) {
      return jsonResponse(errorBody("BAD_REQUEST", "At least 2 waypoints required"), 400, req);
    }

    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const intermediates = waypoints.slice(1, -1);

    const routeRequest: Record<string, unknown> = {
      origin: {
        location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } },
      },
      destination: {
        location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: false,
      languageCode: "en-US",
      units: "METRIC",
    };

    if (intermediates.length > 0) {
      routeRequest.intermediates = intermediates.map((wp) => ({
        location: { latLng: { latitude: wp.latitude, longitude: wp.longitude } },
      }));
      if (optimizeOrder) routeRequest.optimizeWaypointOrder = true;
    }

    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.duration,routes.legs.distanceMeters,routes.legs.polyline.encodedPolyline,routes.legs.startLocation,routes.legs.endLocation,routes.optimizedIntermediateWaypointIndex",
      },
      body: JSON.stringify(routeRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Routes API error:", errorText);
      return jsonResponse(errorBody("UPSTREAM_ERROR", `Google Routes API error: ${response.status}`), response.status, req);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return jsonResponse(errorBody("NOT_FOUND", "No route found"), 404, req);
    }

    const route = data.routes[0];
    const legs: RouteLeg[] = route.legs?.map((leg: {
      distanceMeters?: number;
      duration?: string;
      startLocation?: { latLng?: { latitude?: number; longitude?: number } };
      endLocation?: { latLng?: { latitude?: number; longitude?: number } };
      polyline?: { encodedPolyline?: string };
    }) => ({
      distanceMeters: leg.distanceMeters || 0,
      durationSeconds: parseInt(leg.duration?.replace("s", "") || "0"),
      startLocation: {
        latitude: leg.startLocation?.latLng?.latitude || 0,
        longitude: leg.startLocation?.latLng?.longitude || 0,
      },
      endLocation: {
        latitude: leg.endLocation?.latLng?.latitude || 0,
        longitude: leg.endLocation?.latLng?.longitude || 0,
      },
      polyline: leg.polyline?.encodedPolyline || "",
      steps: [],
    })) || [];

    const result: DirectionsResponse = {
      success: true,
      legs,
      totalDistanceMeters: route.distanceMeters || legs.reduce((sum: number, l: RouteLeg) => sum + l.distanceMeters, 0),
      totalDurationSeconds: parseInt(route.duration?.replace("s", "") || "0") || legs.reduce((sum: number, l: RouteLeg) => sum + l.durationSeconds, 0),
      overviewPolyline: route.polyline?.encodedPolyline || "",
    };

    if (optimizeOrder && route.optimizedIntermediateWaypointIndex) {
      result.waypointOrder = route.optimizedIntermediateWaypointIndex;
    }

    return jsonResponse(result as unknown as Record<string, unknown>, 200, req);
  } catch (error) {
    console.error("Edge function error:", error);
    return jsonResponse(errorBody("INTERNAL", error instanceof Error ? error.message : "Unknown error"), 500, req);
  }
});
