import { describe, expect, it } from 'vitest';
import {
  mergePinsByCategory,
  PIN_CATEGORY_CONFIG,
  type MapPin,
  type MapPinCategory,
} from './MapContext';

const ALL_PIN_CATEGORIES: MapPinCategory[] = [
  'rental',
  'restaurant',
  'event',
  'attraction',
  'grounded',
];

describe('PIN_CATEGORY_CONFIG', () => {
  it('defines emoji, color, and label for every MapPinCategory', () => {
    for (const c of ALL_PIN_CATEGORIES) {
      const row = PIN_CATEGORY_CONFIG[c];
      expect(row).toBeDefined();
      expect(row.emoji.length).toBeGreaterThan(0);
      expect(row.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(row.label.length).toBeGreaterThan(0);
    }
  });

  it('uses neutral gray for grounded (Grounding Lite pins)', () => {
    expect(PIN_CATEGORY_CONFIG.grounded.color).toBe('#6B7280');
    expect(PIN_CATEGORY_CONFIG.grounded.label).toBe('Place');
  });
});

describe('mergePinsByCategory', () => {
  const rental = (id: string): MapPin => ({ id, category: 'rental', title: 'R' });

  it('accumulates events then restaurants (multi-tool)', () => {
    let pins: MapPin[] = [];
    pins = mergePinsByCategory(pins, 'event', [{ id: 'e1', category: 'event', title: 'E' }]);
    pins = mergePinsByCategory(pins, 'restaurant', [{ id: 'r1', category: 'restaurant', title: 'Food' }]);
    expect(pins.map((p) => p.category).sort()).toEqual(['event', 'restaurant']);
  });

  it('second event batch replaces only event pins; keeps restaurants', () => {
    let pins: MapPin[] = [];
    pins = mergePinsByCategory(pins, 'event', [{ id: 'e1', category: 'event', title: 'E1' }]);
    pins = mergePinsByCategory(pins, 'restaurant', [{ id: 'rst', category: 'restaurant', title: 'X' }]);
    pins = mergePinsByCategory(pins, 'event', [{ id: 'e2', category: 'event', title: 'E2' }]);
    expect(pins.filter((p) => p.category === 'event').map((p) => p.id)).toEqual(['e2']);
    expect(pins.some((p) => p.id === 'rst' && p.category === 'restaurant')).toBe(true);
  });

  it('single-tool rental query replaces only prior rentals', () => {
    let pins = mergePinsByCategory([], 'rental', [rental('a'), rental('b')]);
    pins = mergePinsByCategory(pins, 'rental', [rental('c')]);
    expect(pins).toHaveLength(1);
    expect(pins[0].id).toBe('c');
  });

  it('grounded batch replaces only grounded pins; keeps rentals', () => {
    const grounded = (id: string): MapPin => ({
      id,
      category: 'grounded',
      title: 'Cafe',
      latitude: 6.24,
      longitude: -75.58,
    });
    let pins = mergePinsByCategory([], 'rental', [rental('apt')]);
    pins = mergePinsByCategory(pins, 'grounded', [grounded('g1')]);
    pins = mergePinsByCategory(pins, 'grounded', [grounded('g2')]);
    expect(pins.some((p) => p.id === 'apt' && p.category === 'rental')).toBe(true);
    expect(pins.filter((p) => p.category === 'grounded').map((p) => p.id)).toEqual(['g2']);
  });
});
