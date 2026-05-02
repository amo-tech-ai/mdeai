import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  loadGoogleMapsLibrary,
  isMapsAuthFailed,
  onMapsAuthFailed,
} from "@/lib/google-maps-loader";

/**
 * Step 1 — Address (Google Places autocomplete).
 *
 * Behavior:
 *   - Loads Maps `places` library on demand via the singleton loader.
 *   - Binds google.maps.places.Autocomplete to a regular <input>.
 *   - When a place is picked, derives address + city + neighborhood +
 *     lat/lng from the place's address_components and pushes them up.
 *   - Bias: country=co (Colombia). Neighborhoods preferred but not enforced.
 *   - Auth-failure aware: if Maps key is bad, falls back to a free-form
 *     address textbox so the wizard isn't blocked.
 */

export interface Step1AddressValue {
  address: string;
  city: string;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
}

interface Step1AddressProps {
  value: Step1AddressValue;
  onChange: (next: Step1AddressValue) => void;
  onSubmit: () => void;
}

export function Step1Address({ value, onChange, onSubmit }: Step1AddressProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [authFailed, setAuthFailed] = useState(isMapsAuthFailed());
  const [error, setError] = useState<string | null>(null);
  // User-initiated fallback. Maps may be authed but Places suggestions can
  // fail silently (region mismatch, rate limit, address not in their
  // database, etc). The "Can't find your address?" link flips this and
  // unblocks the wizard. Server-side geocoding handles the missing
  // lat/lng — same path used by the auth-failure fallback. (P1 bug found
  // in QA 2026-05-02: Continue button stayed disabled forever in headless
  // preview because no Places suggestion ever fired.)
  const [manualFallback, setManualFallback] = useState(false);

  // Load + attach Places Autocomplete once.
  useEffect(() => {
    let disposed = false;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as
      | string
      | undefined;
    if (!apiKey) {
      setError(
        "Google Maps key is missing — set VITE_GOOGLE_MAPS_API_KEY to enable address autocomplete.",
      );
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const lib = await loadGoogleMapsLibrary<google.maps.PlacesLibrary>(
          "places",
          apiKey,
        );
        if (disposed || !inputRef.current) return;
        const ac = new lib.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "co" },
          fields: ["address_components", "formatted_address", "geometry", "name"],
          types: ["address"],
        });
        autocompleteRef.current = ac;
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const next = mapPlaceToValue(place, value);
          onChange(next);
        });
        setLoading(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!disposed) {
          setError(`Couldn't load address autocomplete: ${msg}`);
          setLoading(false);
        }
      }
    })();
    return () => {
      disposed = true;
      // Autocomplete doesn't expose a destructor; drop the ref so it GCs.
      autocompleteRef.current = null;
    };
    // We intentionally only attach once. Re-attaching on `value` change
    // would create stacked listeners and the existing autocomplete already
    // fires updates via the listener inside this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fallback = authFailed || error !== null || manualFallback;

  // Continue is gated on text fields always. lat/lng are required only
  // when Places autocomplete is working — if Maps auth-failed (bad key,
  // referrer not whitelisted, billing off, etc.) we accept a manual
  // address and let the listing-create edge function geocode it
  // server-side. The Medellín-metro auto-moderation check tolerates
  // missing coords (treats them as "needs_review").
  const submitDisabled =
    !value.address.trim() ||
    !value.city.trim() ||
    !value.neighborhood.trim() ||
    (!fallback && (value.latitude === null || value.longitude === null));

  return (
    <div className="space-y-6" data-testid="step1-address-form">
      {fallback ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-amber-300/40 bg-amber-50/40 px-4 py-3 text-sm"
        >
          <AlertTriangle
            className="w-4 h-4 mt-0.5 text-amber-600"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-foreground">
              Autocomplete unavailable.
            </p>
            <p className="text-muted-foreground mt-1">
              Type the address manually. We'll geocode it on submit.
            </p>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="address">
          Property address
          {!fallback ? (
            <span className="ml-1 text-xs text-muted-foreground font-normal">
              (start typing — pick from suggestions)
            </span>
          ) : null}
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            id="address"
            type="text"
            autoComplete="street-address"
            placeholder="e.g. Calle 10 #42-50, El Poblado"
            value={value.address}
            onChange={(e) =>
              onChange({ ...value, address: e.target.value })
            }
            className="pl-10 h-12"
            data-testid="step1-address-input"
          />
          {loading && !fallback ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Neighborhood</Label>
          <Input
            id="neighborhood"
            value={value.neighborhood}
            onChange={(e) =>
              onChange({ ...value, neighborhood: e.target.value })
            }
            placeholder="El Poblado"
            data-testid="step1-neighborhood-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            placeholder="Medellín"
            data-testid="step1-city-input"
          />
        </div>
      </div>

      {value.latitude !== null && value.longitude !== null ? (
        <p className="text-xs text-muted-foreground">
          📍 {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
        </p>
      ) : !fallback ? (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Pick a suggestion above to lock in the location on the map.
          </p>
          <button
            type="button"
            onClick={() => setManualFallback(true)}
            className="text-xs text-primary hover:underline"
            data-testid="step1-manual-fallback"
          >
            Can't find your address? Type it manually →
          </button>
        </div>
      ) : null}

      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={onSubmit}
        disabled={submitDisabled}
        data-testid="step1-submit"
      >
        Continue to specs
      </Button>
    </div>
  );
}

function mapPlaceToValue(
  place: google.maps.places.PlaceResult,
  current: Step1AddressValue,
): Step1AddressValue {
  const components = place.address_components ?? [];
  const find = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name ?? "";

  const neighborhood =
    find("neighborhood") ||
    find("sublocality_level_1") ||
    find("sublocality") ||
    find("administrative_area_level_2") ||
    "";
  const city =
    find("locality") ||
    find("administrative_area_level_2") ||
    find("administrative_area_level_1") ||
    current.city ||
    "Medellín";

  return {
    address: place.formatted_address ?? current.address,
    city,
    neighborhood: neighborhood || current.neighborhood,
    latitude: place.geometry?.location?.lat() ?? null,
    longitude: place.geometry?.location?.lng() ?? null,
  };
}
