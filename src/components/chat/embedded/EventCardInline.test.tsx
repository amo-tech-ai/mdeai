/**
 * EventCardInline — unit tests
 *
 * Contract:
 * 1. Renders event name, venue, and date in all states.
 * 2. Shows correct category badge color class.
 * 3. Falls back to Calendar icon when image errors or no imageUrl.
 * 4. Disables link (pointer-events-none) when sourceUrl is null.
 * 5. Renders Free label when pricePerTicket is 0.
 * 6. Renders $N price when pricePerTicket > 0.
 * 7. Hides price row when pricePerTicket is null/undefined.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventCardInline } from './EventCardInline';
import type { EventInlineListing } from '@/types/chat';

const BASE_EVENT: EventInlineListing = {
  id: 'evt-001',
  title: 'Salsa Night at Teatro Lido',
  category: 'nightlife',
  venue: 'Teatro Lido',
  neighborhood: 'El Poblado',
  startsAt: '2026-05-16T22:00:00.000Z',
  pricePerTicket: 15,
  currency: 'USD',
  imageUrl: 'https://example.com/salsa.jpg',
  sourceUrl: 'https://teatrolido.com/eventos',
  latitude: 6.2085,
  longitude: -75.5706,
};

function make(overrides: Partial<EventInlineListing> = {}): EventInlineListing {
  return { ...BASE_EVENT, ...overrides };
}

describe('EventCardInline', () => {
  it('renders title, venue and neighborhood', () => {
    render(<EventCardInline event={make()} />);
    expect(screen.getByText('Salsa Night at Teatro Lido')).toBeInTheDocument();
    // venue and neighborhood are rendered in the same span as "Venue · Neighborhood"
    expect(screen.getByText(/Teatro Lido · El Poblado/)).toBeInTheDocument();
  });

  it('shows category badge', () => {
    render(<EventCardInline event={make({ category: 'music' })} />);
    expect(screen.getByText('music')).toBeInTheDocument();
  });

  it('renders paid price', () => {
    render(<EventCardInline event={make({ pricePerTicket: 30 })} />);
    expect(screen.getByText('$30')).toBeInTheDocument();
  });

  it('renders Free when pricePerTicket is 0', () => {
    render(<EventCardInline event={make({ pricePerTicket: 0 })} />);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('hides price row when pricePerTicket is null', () => {
    render(<EventCardInline event={make({ pricePerTicket: null })} />);
    expect(screen.queryByText('Free')).not.toBeInTheDocument();
    expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
  });

  it('outer wrapper has role=link and aria-label when sourceUrl is set', () => {
    const { container } = render(<EventCardInline event={make()} />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.getAttribute('role')).toBe('link');
    expect(outerDiv.getAttribute('tabindex')).toBe('0');
    expect(outerDiv.getAttribute('aria-label')).toMatch(/Salsa Night/);
  });

  it('outer wrapper has no role=link and shows opacity-60 when sourceUrl is null', () => {
    const { container } = render(<EventCardInline event={make({ sourceUrl: null })} />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.getAttribute('role')).toBeNull();
    expect(outerDiv.className).toMatch(/opacity-60/);
  });

  it('shows Calendar fallback when no imageUrl', () => {
    const { container } = render(<EventCardInline event={make({ imageUrl: null })} />);
    // img should not be present; lucide Calendar is rendered as svg
    expect(container.querySelector('img')).not.toBeInTheDocument();
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('shows Calendar fallback on image load error', () => {
    const { container } = render(<EventCardInline event={make()} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    // Trigger error — component swaps to Calendar svg placeholder
    fireEvent.error(img!);
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('formats ISO date string into human-readable date', () => {
    render(<EventCardInline event={make({ startsAt: '2026-05-16T22:00:00.000Z' })} />);
    // Should contain "May" and "16" — locale formatting
    const dateText = screen.getByText(/May|16/);
    expect(dateText).toBeInTheDocument();
  });

  // ── MASTRA-048: Maps deep link tests ────────────────────────────────────────

  it('renders "Open venue in Maps" link when mapsUrl is provided', () => {
    const mapsUrl = 'https://maps.google.com/?cid=123456789';
    render(<EventCardInline event={make({ mapsUrl })} />);
    const mapsLink = screen.getByText('Open venue in Maps').closest('a');
    expect(mapsLink).toBeInTheDocument();
    expect(mapsLink).toHaveAttribute('href', mapsUrl);
    expect(mapsLink).toHaveAttribute('target', '_blank');
    expect(mapsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does NOT render Maps link when mapsUrl is null', () => {
    render(<EventCardInline event={make({ mapsUrl: null })} />);
    expect(screen.queryByText('Open venue in Maps')).not.toBeInTheDocument();
  });

  it('does NOT render Maps link when mapsUrl is undefined', () => {
    render(<EventCardInline event={make({ mapsUrl: undefined })} />);
    expect(screen.queryByText('Open venue in Maps')).not.toBeInTheDocument();
  });
});
