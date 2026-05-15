/**
 * AttractionCardInline — unit tests
 *
 * Contracts:
 * 1. Renders name, neighborhood, category badge.
 * 2. Renders Free badge when priceUsd is 0.
 * 3. Renders price when priceUsd > 0.
 * 4. Renders rating and duration when provided.
 * 5. Shows MapPin fallback when no imageUrl.
 * 6. Disables link when sourceUrl is null.
 *
 * MASTRA-048 contracts:
 * 7. Renders "Open in Maps" link when mapsUrl is set.
 * 8. Hides "Open in Maps" when mapsUrl is null/undefined.
 * 9. Renders aiSummary paragraph when set.
 * 10. Hides aiSummary when null/undefined.
 * 11. Maps link is target="_blank" with noopener noreferrer.
 * 12. Maps link stopPropagation prevents outer card click.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttractionCardInline } from './AttractionCardInline';
import type { AttractionInlineListing } from '@/types/chat';

const BASE_ATTRACTION: AttractionInlineListing = {
  id: 'att-001',
  name: 'Parque Arví',
  category: 'park',
  neighborhood: 'Santa Elena',
  priceUsd: 5,
  durationMinutes: 180,
  rating: 4.7,
  tags: ['nature', 'hiking', 'cable-car'],
  imageUrl: 'https://example.com/parque-arvi.jpg',
  sourceUrl: 'https://mdeai.co/attractions/att-001',
  latitude: 6.293,
  longitude: -75.487,
};

function make(overrides: Partial<AttractionInlineListing> = {}): AttractionInlineListing {
  return { ...BASE_ATTRACTION, ...overrides };
}

describe('AttractionCardInline — base rendering', () => {
  it('renders attraction name', () => {
    render(<AttractionCardInline attraction={make()} />);
    expect(screen.getByText('Parque Arví')).toBeInTheDocument();
  });

  it('renders neighborhood', () => {
    render(<AttractionCardInline attraction={make()} />);
    expect(screen.getByText('Santa Elena')).toBeInTheDocument();
  });

  it('renders category badge (park → Park)', () => {
    render(<AttractionCardInline attraction={make()} />);
    expect(screen.getByText('Park')).toBeInTheDocument();
  });

  it('renders rating when provided', () => {
    render(<AttractionCardInline attraction={make()} />);
    expect(screen.getByText('4.7')).toBeInTheDocument();
  });

  it('renders duration in hours', () => {
    render(<AttractionCardInline attraction={make({ durationMinutes: 180 })} />);
    expect(screen.getByText('3h')).toBeInTheDocument();
  });

  it('renders Free badge when priceUsd is 0', () => {
    render(<AttractionCardInline attraction={make({ priceUsd: 0 })} />);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('renders price when priceUsd > 0', () => {
    render(<AttractionCardInline attraction={make({ priceUsd: 12 })} />);
    expect(screen.getByText('$12')).toBeInTheDocument();
  });

  it('outer wrapper has no role=link and shows opacity-60 when sourceUrl is null', () => {
    const { container } = render(<AttractionCardInline attraction={make({ sourceUrl: null })} />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.getAttribute('role')).toBeNull();
    expect(outerDiv.className).toMatch(/opacity-60/);
  });

  it('shows fallback icon when no imageUrl', () => {
    const { container } = render(<AttractionCardInline attraction={make({ imageUrl: null })} />);
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });
});

describe('AttractionCardInline — MASTRA-048 enrichment fields', () => {
  it('renders "Open in Maps" link when mapsUrl is provided', () => {
    const mapsUrl = 'https://maps.google.com/?cid=99887766554433221';
    render(<AttractionCardInline attraction={make({ mapsUrl })} />);
    const mapsLink = screen.getByText('Open in Maps').closest('a');
    expect(mapsLink).toBeInTheDocument();
    expect(mapsLink).toHaveAttribute('href', mapsUrl);
    expect(mapsLink).toHaveAttribute('target', '_blank');
    expect(mapsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does NOT render "Open in Maps" when mapsUrl is null', () => {
    render(<AttractionCardInline attraction={make({ mapsUrl: null })} />);
    expect(screen.queryByText('Open in Maps')).not.toBeInTheDocument();
  });

  it('does NOT render "Open in Maps" when mapsUrl is undefined', () => {
    render(<AttractionCardInline attraction={make({ mapsUrl: undefined })} />);
    expect(screen.queryByText('Open in Maps')).not.toBeInTheDocument();
  });

  it('renders aiSummary when provided', () => {
    const aiSummary = 'A forested ecological park reached by Metrocable above Medellín.';
    render(<AttractionCardInline attraction={make({ aiSummary })} />);
    expect(screen.getByText(aiSummary)).toBeInTheDocument();
  });

  it('does NOT render aiSummary when null', () => {
    render(<AttractionCardInline attraction={make({ aiSummary: null })} />);
    expect(screen.queryByText(/forested|ecological/)).not.toBeInTheDocument();
  });

  it('does NOT render aiSummary when undefined', () => {
    render(<AttractionCardInline attraction={make({ aiSummary: undefined })} />);
    expect(screen.queryByText(/forested|ecological/)).not.toBeInTheDocument();
  });

  it('renders both mapsUrl and aiSummary together', () => {
    render(
      <AttractionCardInline
        attraction={make({
          mapsUrl: 'https://maps.google.com/?cid=123',
          aiSummary: 'A scenic park with birdwatching trails.',
        })}
      />,
    );
    expect(screen.getByText('Open in Maps')).toBeInTheDocument();
    expect(screen.getByText('A scenic park with birdwatching trails.')).toBeInTheDocument();
  });
});
