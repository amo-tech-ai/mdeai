/// <reference types="@types/google.maps" />
/**
 * React wrapper for google.maps.Circle.
 *
 * Adapted from: vendor/googlemaps/codelab-maps-platform-101-react-js/solution/src/components/circle.tsx
 * Change: replaced @vis.gl/react-google-maps context with an explicit `map` prop
 * so this works with mde's vanilla Maps loader (src/lib/google-maps-loader.ts).
 *
 * Usage: only render this component after `librariesReady` is true in ChatMap —
 * google.maps.Circle requires the Maps library to be loaded first.
 *
 * Example (in ChatMap, for proximity radius on grounded "near X" results):
 *   {proximityCenter && librariesReady && (
 *     <Circle
 *       map={mapRef.current}
 *       center={proximityCenter}
 *       radius={800}
 *       strokeColor="#10b981"
 *       strokeOpacity={0.8}
 *       strokeWeight={2}
 *       fillColor="#10b981"
 *       fillOpacity={0.08}
 *     />
 *   )}
 */

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

type CircleEventProps = {
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onDrag?: (e: google.maps.MapMouseEvent) => void;
  onDragStart?: (e: google.maps.MapMouseEvent) => void;
  onDragEnd?: (e: google.maps.MapMouseEvent) => void;
  onMouseOver?: (e: google.maps.MapMouseEvent) => void;
  onMouseOut?: (e: google.maps.MapMouseEvent) => void;
  onRadiusChanged?: (r: ReturnType<google.maps.Circle['getRadius']>) => void;
  onCenterChanged?: (p: ReturnType<google.maps.Circle['getCenter']>) => void;
};

export type CircleProps = google.maps.CircleOptions &
  CircleEventProps & {
    /** The map instance from ChatMap's mapRef.current. Required to attach the circle. */
    map: google.maps.Map | null;
  };

function latLngEquals(
  a: google.maps.LatLng | google.maps.LatLngLiteral | null | undefined,
  b: google.maps.LatLng | null | undefined,
): boolean {
  if (!a || !b) return false;
  const aLat =
    typeof (a as google.maps.LatLng).lat === 'function'
      ? (a as google.maps.LatLng).lat()
      : (a as google.maps.LatLngLiteral).lat;
  const aLng =
    typeof (a as google.maps.LatLng).lng === 'function'
      ? (a as google.maps.LatLng).lng()
      : (a as google.maps.LatLngLiteral).lng;
  return aLat === b.lat() && aLng === b.lng();
}

function useCircle(props: CircleProps) {
  const {
    map,
    onClick,
    onDrag,
    onDragStart,
    onDragEnd,
    onMouseOver,
    onMouseOut,
    onRadiusChanged,
    onCenterChanged,
    radius,
    center,
    ...circleOptions
  } = props;

  // Stable ref for callbacks so event listeners don't need to be re-attached
  // every time a callback prop identity changes (common without useCallback).
  const callbacks = useRef<Record<string, (e: unknown) => void>>({});
  Object.assign(callbacks.current, {
    onClick,
    onDrag,
    onDragStart,
    onDragEnd,
    onMouseOver,
    onMouseOut,
    onRadiusChanged,
    onCenterChanged,
  });

  // Circle instance is stable across renders — only created once.
  // Safe because this component is only mounted after librariesReady in ChatMap.
  const circle = useRef(new google.maps.Circle()).current;

  circle.setOptions(circleOptions);

  useEffect(() => {
    if (!center) return;
    if (!latLngEquals(center, circle.getCenter())) circle.setCenter(center);
  }, [center]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (radius === undefined || radius === null) return;
    if (radius !== circle.getRadius()) circle.setRadius(radius);
  }, [radius]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map) {
      circle.setMap(null);
      return;
    }
    circle.setMap(map);
    return () => {
      circle.setMap(null);
    };
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const gme = google.maps.event;
    [
      ['click', 'onClick'],
      ['drag', 'onDrag'],
      ['dragstart', 'onDragStart'],
      ['dragend', 'onDragEnd'],
      ['mouseover', 'onMouseOver'],
      ['mouseout', 'onMouseOut'],
    ].forEach(([eventName, callbackKey]) => {
      gme.addListener(circle, eventName, (e: google.maps.MapMouseEvent) => {
        const cb = callbacks.current[callbackKey];
        if (cb) cb(e);
      });
    });
    gme.addListener(circle, 'radius_changed', () => {
      callbacks.current.onRadiusChanged?.(circle.getRadius());
    });
    gme.addListener(circle, 'center_changed', () => {
      callbacks.current.onCenterChanged?.(circle.getCenter());
    });
    return () => {
      gme.clearInstanceListeners(circle);
    };
  }, [circle]); // eslint-disable-line react-hooks/exhaustive-deps

  return circle;
}

/**
 * Renders a google.maps.Circle overlay on the map.
 * Returns null — the circle renders directly onto the Maps canvas, not into the React tree.
 */
export const Circle = forwardRef<google.maps.Circle | null, CircleProps>(
  (props, ref) => {
    const circle = useCircle(props);
    useImperativeHandle(ref, () => circle);
    return null;
  },
);

Circle.displayName = 'Circle';
