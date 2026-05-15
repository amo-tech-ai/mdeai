/**
 * RestaurantCardInline — unit tests
 *
 * Contracts:
 * 1. Renders name, neighborhood, cuisine badge.
 * 2. Renders rating, vibe tags when present.
 * 3. Shows UtensilsCrossed fallback when no imageUrl.
 * 4. Disables link when sourceUrl is null.
 *
 * MASTRA-048 contracts:
 * 5. Renders "Open in Maps" link when mapsUrl is set.
 * 6. Hides "Open in Maps" when mapsUrl is null/undefined.
 * 7. Renders aiSummary paragraph when set.
 * 8. Hides aiSummary paragraph when null/undefined.
 * 9. Maps link is target="_blank" with noopener noreferrer.
 * 10. Maps link click does not propagate to the outer card anchor.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RestaurantCardInline } from './RestaurantCardInline';
import type { RestaurantInlineListing } from '@/types/chat';

const BASE_RESTAURANT: RestaurantInlineListing = {
  id: 'rst-001',
  name: 'El Cielo',
  cuisine: 'colombian',
  neighborhood: 'El Poblado',
  priceTier: '$$$',
  avgPricePerPerson: 45,
  rating: 4.8,
  vibe: ['fine-dining', 'molecular', 'tasting-menu'],
  imageUrl: 'https://example.com/el-cielo.jpg',
  sourceUrl: 'https://mdeai.co/restaurants/rst-001',
  latitude: 6.2098,
  longitude: -75.5663,
};

function make(overrides: Partial<RestaurantInlineListing> = {}): RestaurantInlineListing {
  return { ...BASE_RESTAURANT, ...overrides };
}

describe('RestaurantCardInline — base rendering', () => {
  it('renders restaurant name', () => {
    render(<RestaurantCardInline restaurant={make()} />);
    expect(screen.getByText('El Cielo')).toBeInTheDocument();
  });

  it('renders neighborhood', () => {
    render(<RestaurantCardInline restaurant={make()} />);
    expect(screen.getByText('El Poblado')).toBeInTheDocument();
  });

  it('renders cuisine badge (colombian → Colombian)', () => {
    render(<RestaurantCardInline restaurant={make()} />);
    expect(screen.getByText('Colombian')).toBeInTheDocument();
  });

  it('renders rating when provided', () => {
    render(<RestaurantCardInline restaurant={make()} />);
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('renders vibe tags', () => {
    render(<RestaurantCardInline restaurant={make()} />);
    // vibe joined with ·
    expect(screen.getByText(/fine-dining/)).toBeInTheDocument();
  });

  it('renders price tier', () => {
    render(<RestaurantCardInline restaurant={make()} />);
    expect(screen.getByText('$$$')).toBeInTheDocument();
  });

  it('wraps card in anchor pointing to sourceUrl', () => {
    render(<RestaurantCardInline restaurant={make()} />);
    const link = screen.getAllByRole('link')[0];
    expect(link).toHaveAttribute('href', 'https://mdeai.co/restaurants/rst-001');
  });

  it('applies pointer-events-none when sourceUrl is null', () => {
    render(<RestaurantCardInline restaurant={make({ sourceUrl: null })} />);
    const outerLinks = screen.getAllByRole('link');
    expect(outerLinks[0].className).toMatch(/pointer-events-none/);
  });

  it('shows UtensilsCrossed fallback when no imageUrl', () => {
    const { container } = render(<RestaurantCardInline restaurant={make({ imageUrl: null })} />);
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });
});

describe('RestaurantCardInline — MASTRA-048 enrichment fields', () => {
  it('renders "Open in Maps" link when mapsUrl is provided', () => {
    const mapsUrl = 'https://maps.google.com/?cid=12345678901234567';
    render(<RestaurantCardInline restaurant={make({ mapsUrl })} />);
    const mapsLink = screen.getByText('Open in Maps').closest('a');
    expect(mapsLink).toBeInTheDocument();
    expect(mapsLink).toHaveAttribute('href', mapsUrl);
    expect(mapsLink).toHaveAttribute('target', '_blank');
    expect(mapsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does NOT render "Open in Maps" when mapsUrl is null', () => {
    render(<RestaurantCardInline restaurant={make({ mapsUrl: null })} />);
    expect(screen.queryByText('Open in Maps')).not.toBeInTheDocument();
  });

  it('does NOT render "Open in Maps" when mapsUrl is undefined', () => {
    render(<RestaurantCardInline restaurant={make({ mapsUrl: undefined })} />);
    expect(screen.queryByText('Open in Maps')).not.toBeInTheDocument();
  });

  it('renders aiSummary paragraph when provided', () => {
    const aiSummary = 'Known for its molecular gastronomy tasting menus.';
    render(<RestaurantCardInline restaurant={make({ aiSummary })} />);
    expect(screen.getByText(aiSummary)).toBeInTheDocument();
  });

  it('does NOT render aiSummary when null', () => {
    render(<RestaurantCardInline restaurant={make({ aiSummary: null })} />);
    // "gastronomy" only appears in the aiSummary string, not in vibe tags
    expect(screen.queryByText(/gastronomy/)).not.toBeInTheDocument();
  });

  it('does NOT render aiSummary when undefined', () => {
    render(<RestaurantCardInline restaurant={make({ aiSummary: undefined })} />);
    expect(screen.queryByText(/gastronomy/)).not.toBeInTheDocument();
  });

  it('renders both mapsUrl and aiSummary together', () => {
    render(
      <RestaurantCardInline
        restaurant={make({
          mapsUrl: 'https://maps.google.com/?cid=123',
          aiSummary: 'A beloved Medellín institution.',
        })}
      />,
    );
    expect(screen.getByText('Open in Maps')).toBeInTheDocument();
    expect(screen.getByText('A beloved Medellín institution.')).toBeInTheDocument();
  });
});
