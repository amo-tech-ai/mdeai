/// <reference types="@types/google.maps" />
import { PIN_CATEGORY_CONFIG, type MapPin } from '@/context/MapContext';

/**
 * Builds the visible pill content for a map pin.
 * emoji dot + price/title label, highlights on hover.
 *
 * Shared by MdeMarker and any future map surfaces that render pins.
 * Extracted to its own file to satisfy react-refresh/only-export-components.
 */
export function buildPinContent(pin: MapPin, isHighlighted: boolean): HTMLElement {
  const cfg = PIN_CATEGORY_CONFIG[pin.category];
  const div = document.createElement('div');
  div.className = [
    'inline-flex items-center gap-1.5 pr-2.5 pl-1.5 py-1 rounded-full border-2 shadow-md cursor-pointer',
    'transition-all font-sans select-none whitespace-nowrap',
    isHighlighted
      ? 'bg-black text-white scale-110 z-20'
      : 'bg-white text-gray-900 hover:scale-105',
  ].join(' ');
  div.style.borderColor = isHighlighted ? '#000' : cfg.color;
  div.setAttribute('role', 'button');
  div.setAttribute('data-testid', 'map-pin');
  div.setAttribute('data-category', pin.category);
  div.setAttribute(
    'aria-label',
    `Open ${pin.title}${pin.label ? `, ${pin.label}` : ''}`,
  );
  if (isHighlighted) div.setAttribute('aria-current', 'true');

  const dot = document.createElement('span');
  dot.className = 'w-5 h-5 rounded-full flex items-center justify-center text-[11px]';
  dot.style.background = isHighlighted ? 'rgba(255,255,255,0.15)' : `${cfg.color}20`;
  dot.textContent = cfg.emoji;
  dot.setAttribute('aria-hidden', 'true');
  div.appendChild(dot);

  const label = document.createElement('span');
  label.className = 'text-[11px] font-medium max-w-[140px] truncate';
  label.textContent = pin.label || pin.title;
  div.appendChild(label);

  return div;
}
