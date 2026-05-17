/// <reference types="@types/google.maps" />
import { useEffect, useRef } from 'react';
import { type MapPin } from '@/context/MapContext';
import { trackMapEvent } from '@/lib/maps-telemetry';
import { buildPinContent } from './pinContent';

export interface MdeMarkerProps {
  pin: MapPin;
  isHighlighted: boolean;
  /**
   * Called when the user clicks or keyboard-activates the marker.
   * `openInNewTab` is true when Cmd/Ctrl-click or middle-click.
   */
  onClick: (pin: MapPin, openInNewTab: boolean) => void;
  /**
   * Called when this marker is created so the parent clusterer can
   * register it. The returned cleanup function is called on unmount.
   */
  onMount: (marker: google.maps.marker.AdvancedMarkerElement) => () => void;
  /**
   * Called on every click with the pin and its AdvancedMarkerElement so the
   * parent can use the element as an InfoWindow anchor.
   */
  onMarkerClick?: (pin: MapPin, marker: google.maps.marker.AdvancedMarkerElement) => void;
}

/**
 * Renders a single AdvancedMarkerElement on the map.
 * Returns null — the marker renders onto the Maps canvas, not the React tree.
 *
 * Registers itself with the parent via `onMount` so the MdeMarkerCluster
 * can own the map visibility through MarkerClusterer.addMarkers().
 * Do NOT pass a `map` prop to the underlying AdvancedMarkerElement — the
 * clusterer manages that; double-assignment leaks markers behind clusters.
 */
export function MdeMarker({ pin, isHighlighted, onClick, onMount, onMarkerClick }: MdeMarkerProps) {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const clickHandlerRef = useRef<EventListener | null>(null);

  // Create marker once. Position + content updates are handled in a
  // separate effect so marker creation doesn't churn on every hover.
  useEffect(() => {
    // Use Number.isFinite (not truthy) so valid 0 coordinates aren't dropped
    // and NaN / Infinity / null / undefined are all rejected uniformly.
    const lat = Number(pin.latitude);
    const lng = Number(pin.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const MarkerCtor = google.maps.marker.AdvancedMarkerElement;
    const marker = new MarkerCtor({
      position: { lat, lng },
      content: buildPinContent(pin, false),
      // title is read by screen readers and shown as tooltip (WCAG compliance).
      // See: developers.google.com/maps/documentation/javascript/advanced-markers/accessible-markers
      title: `${pin.title}${pin.label ? ` — ${pin.label}` : ''}`,
      zIndex: 1,
      gmpClickable: true,
      // Hide lower-priority pins when overlapping; clusterer overrides visibility anyway.
      // Mirrors the collisionBehavior pattern from js-api-samples/advanced-markers-collision.
      collisionBehavior: google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY,
    });
    markerRef.current = marker;

    const clickHandler: EventListener = (event) => {
      const evt = event as Event & { domEvent?: MouseEvent | KeyboardEvent };
      const dom = evt.domEvent;
      const viaKeyboard = dom instanceof KeyboardEvent;
      const openInNewTab = !!(
        dom &&
        'metaKey' in dom &&
        (dom.metaKey || dom.ctrlKey || (dom instanceof MouseEvent && dom.button === 1))
      );
      trackMapEvent({ kind: 'pin_click', pinId: pin.id, viaKeyboard, newTab: openInNewTab });
      onClick(pin, openInNewTab);
      onMarkerClick?.(pin, marker);
    };
    clickHandlerRef.current = clickHandler;
    marker.addEventListener('gmp-click', clickHandler);

    // Register with parent (clusterer) and get cleanup callback.
    const cleanup = onMount(marker);

    return () => {
      if (clickHandlerRef.current) {
        marker.removeEventListener('gmp-click', clickHandlerRef.current);
      }
      cleanup();
    };
  // pin.id identifies this marker — if the pin identity changes, recreate.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin.id, pin.latitude, pin.longitude]);

  // Update content on highlight change without recreating the marker.
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.content = buildPinContent(pin, isHighlighted);
    marker.zIndex = isHighlighted ? 1000 : 1;
  }, [pin, isHighlighted]);

  return null;
}
