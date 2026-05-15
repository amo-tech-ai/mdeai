/// <reference types="@types/google.maps" />
import { useEffect, useRef } from 'react';
import { type MapPin, type RentalPinMeta } from '@/context/MapContext';

export interface MdeInfoWindowProps {
  map: google.maps.Map | null;
  /**
   * The marker to anchor the InfoWindow to.
   * Pass null to close the InfoWindow.
   */
  anchor: google.maps.marker.AdvancedMarkerElement | null;
  pin: MapPin | null;
  onViewDetails: (pin: MapPin) => void;
}

/**
 * Builds the InfoWindow peek HTML: photo + title + neighborhood/BR/BA +
 * price/rating + "View details" CTA.
 *
 * Returns a detached HTMLDivElement — InfoWindow.setContent() takes ownership.
 * Uses imperative DOM (not innerHTML) so the "View details" button can
 * capture the pin closure cleanly.
 */
function buildInfoContent(pin: MapPin, onViewDetails: () => void): HTMLElement {
  const meta = (pin.meta ?? {}) as RentalPinMeta;

  const root = document.createElement('div');
  root.style.cssText = 'max-width:240px;font-family:inherit;';

  if (meta.image) {
    const img = document.createElement('img');
    img.src = meta.image;
    img.alt = pin.title;
    img.loading = 'lazy';
    img.style.cssText =
      'width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;display:block;';
    img.addEventListener('error', () => { img.style.display = 'none'; });
    root.appendChild(img);
  }

  const title = document.createElement('h3');
  title.textContent = pin.title;
  title.style.cssText =
    'font-size:14px;font-weight:600;line-height:1.3;margin:0 0 4px 0;color:#0f172a;';
  root.appendChild(title);

  const subParts: string[] = [];
  if (meta.neighborhood) subParts.push(meta.neighborhood);
  if (meta.bedrooms != null) subParts.push(`${meta.bedrooms} BR`);
  if (meta.bathrooms != null) subParts.push(`${meta.bathrooms} BA`);
  if (subParts.length > 0) {
    const sub = document.createElement('p');
    sub.textContent = subParts.join(' · ');
    sub.style.cssText = 'font-size:12px;color:#64748b;margin:0 0 6px 0;';
    root.appendChild(sub);
  }

  const row = document.createElement('div');
  row.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;';
  if (pin.label) {
    const price = document.createElement('span');
    price.textContent = pin.label;
    price.style.cssText = 'font-size:14px;font-weight:600;color:#0f172a;';
    row.appendChild(price);
  }
  if (meta.rating != null) {
    const rate = document.createElement('span');
    rate.textContent = `★ ${Number(meta.rating).toFixed(1)}`;
    rate.style.cssText = 'font-size:12px;color:#d97706;font-weight:500;';
    row.appendChild(rate);
  }
  if (row.children.length > 0) root.appendChild(row);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'View details →';
  btn.style.cssText =
    'background:#10b981;color:#fff;border:0;border-radius:6px;padding:7px 12px;font-size:12px;font-weight:500;cursor:pointer;width:100%;';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onViewDetails();
  });
  root.appendChild(btn);

  return root;
}

/**
 * Single reusable InfoWindow for map pin peeks.
 *
 * One instance is created per MdeInfoWindow mount and reused across all pins:
 * setContent() + open() at the new anchor rather than creating per-pin
 * InfoWindows (which would leak DOM and break the "one peek at a time" contract).
 *
 * Pass `anchor={null}` to close. Pins array changes also auto-close to
 * prevent the peek outliving its anchor (e.g. conversation switch).
 *
 * Returns null — renders onto the Maps canvas.
 */
export function MdeInfoWindow({ map, anchor, pin, onViewDetails }: MdeInfoWindowProps) {
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Create the InfoWindow once per map instance.
  useEffect(() => {
    if (!map) return;
    infoWindowRef.current = new google.maps.InfoWindow({ disableAutoPan: false });
    return () => {
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
    };
  }, [map]);

  // Open / update / close based on anchor + pin.
  useEffect(() => {
    const iw = infoWindowRef.current;
    if (!iw || !map) return;
    if (!anchor || !pin) {
      iw.close();
      return;
    }
    iw.setContent(buildInfoContent(pin, () => onViewDetails(pin)));
    iw.open({ map, anchor });
  }, [map, anchor, pin, onViewDetails]);

  return null;
}
