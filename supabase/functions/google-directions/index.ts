import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

interface RouteStep {
  distanceMeters: number;
  durationSeconds: number;
  startLocation: { latitude: number; longitude: number };
  endLocation: { latitude: number; longitude: number };
  polyline: string;
}

interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
  startLocation: { latitude: number; longitude: number };
  endLocation: { latitude: number; longitude: number };
  steps: RouteStep[];
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth' } }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authError || !user) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Google Maps API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { waypoints, optimizeOrder = false }: DirectionsRequest = await req.json();

    if (!waypoints || waypoints.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'At least 2 waypoints required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the Routes API request
    // Using the new Routes API (computeRoutes)
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const intermediates = waypoints.slice(1, -1);

    const routeRequest: Record<string, unknown> = {
      origin: {
        location: {
          latLng: { latitude: origin.latitude, longitude: origin.longitude }
        }
      },
      destination: {
        location: {
          latLng: { latitude: destination.latitude, longitude: destination.longitude }
        }
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      languageCode: 'en-US',
      units: 'METRIC',
    };

    if (intermediates.length > 0) {
      routeRequest.intermediates = intermediates.map(wp => ({
        location: {
          latLng: { latitude: wp.latitude, longitude: wp.longitude }
        }
      }));
      
      if (optimizeOrder) {
        routeRequest.optimizeWaypointOrder = true;
      }
    }

    const response = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.duration,routes.legs.distanceMeters,routes.legs.polyline.encodedPolyline,routes.legs.startLocation,routes.legs.endLocation,routes.optimizedIntermediateWaypointIndex',
        },
        body: JSON.stringify(routeRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Routes API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Google Routes API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No route found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      durationSeconds: parseInt(leg.duration?.replace('s', '') || '0'),
      startLocation: {
        latitude: leg.startLocation?.latLng?.latitude || 0,
        longitude: leg.startLocation?.latLng?.longitude || 0,
      },
      endLocation: {
        latitude: leg.endLocation?.latLng?.latitude || 0,
        longitude: leg.endLocation?.latLng?.longitude || 0,
      },
      polyline: leg.polyline?.encodedPolyline || '',
      steps: [],
    })) || [];

    const result: DirectionsResponse = {
      success: true,
      legs,
      totalDistanceMeters: route.distanceMeters || legs.reduce((sum: number, l: RouteLeg) => sum + l.distanceMeters, 0),
      totalDurationSeconds: parseInt(route.duration?.replace('s', '') || '0') || legs.reduce((sum: number, l: RouteLeg) => sum + l.durationSeconds, 0),
      overviewPolyline: route.polyline?.encodedPolyline || '',
    };

    // Include optimized waypoint order if requested
    if (optimizeOrder && route.optimizedIntermediateWaypointIndex) {
      result.waypointOrder = route.optimizedIntermediateWaypointIndex;
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
