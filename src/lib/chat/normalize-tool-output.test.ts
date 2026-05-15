import { describe, expect, it, vi } from 'vitest';
import {
  listingToolActionPassesVersionGate,
  normalizeToolOutput,
  unwrapToolOutput,
} from './normalize-tool-output';
import type { ChatAction } from '@/types/chat';

describe('unwrapToolOutput', () => {
  it('passes through arrays', () => {
    const arr = [{ id: '1' }];
    expect(unwrapToolOutput(arr)).toBe(arr);
  });

  it('unwraps results', () => {
    expect(unwrapToolOutput({ results: [1, 2] })).toEqual([1, 2]);
  });

  it('unwraps listings', () => {
    expect(unwrapToolOutput({ listings: ['a'] })).toEqual(['a']);
  });

  it('unwraps items', () => {
    expect(unwrapToolOutput({ items: [true] })).toEqual([true]);
  });
});

describe('listingToolActionPassesVersionGate', () => {
  it('allows version 1 listing actions', () => {
    const action: ChatAction = {
      version: 1,
      type: 'OPEN_EVENT_RESULTS',
      payload: { filters: {}, listings: [] },
    };
    expect(listingToolActionPassesVersionGate(action)).toBe(true);
  });

  it('rejects version 2 listing actions with warning', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const action = {
      version: 2,
      type: 'OPEN_EVENT_RESULTS',
      payload: {
        filters: {},
        listings: [
          {
            id: 'x',
            title: 't',
            category: '',
            venue: '',
            neighborhood: '',
            startsAt: '',
          },
        ],
      },
    } as ChatAction;
    expect(listingToolActionPassesVersionGate(action, 'searchEventsTool')).toBe(false);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('allows legacy listing payloads without version key', () => {
    const action = {
      type: 'OPEN_RENTALS_RESULTS',
      payload: { filters: {}, listings: [] },
    } as ChatAction;
    expect(listingToolActionPassesVersionGate(action)).toBe(true);
  });

  it('does not gate non-listing actions', () => {
    const action: ChatAction = {
      type: 'OPEN_LEAD_CAPTURED',
      payload: { lead_id: '1', message: 'x' },
    };
    expect(listingToolActionPassesVersionGate(action)).toBe(true);
  });
});

describe('normalizeToolOutput', () => {
  it('returns null for unknown tool without logging', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizeToolOutput('searchXyzTool', [{ id: 'x' }])).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('parses valid events', () => {
    const action = normalizeToolOutput('searchEventsTool', [
      {
        id: 'e1',
        title: 'Feria',
        category: 'culture',
        venue: 'Centro',
        neighborhood: 'Centro',
        startsAt: '2026-06-01T20:00:00Z',
        pricePerTicket: 25,
        currency: 'USD',
        imageUrl: 'https://ex/img.jpg',
        sourceUrl: 'https://ex/e1',
        latitude: 6.25,
        longitude: -75.56,
      },
    ]);
    expect(action?.type).toBe('OPEN_EVENT_RESULTS');
    expect(action?.payload.listings).toHaveLength(1);
    expect(action?.payload.listings?.[0]?.id).toBe('e1');
    expect(action?.payload.listings?.[0]?.currency).toBe('USD');
    expect(action?.version).toBe(1);
  });

  it('returns null when event id missing', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(
      normalizeToolOutput('searchEventsTool', [{ title: 'No ID', category: 'music' }]),
    ).toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('strips extra fields on events', () => {
    const action = normalizeToolOutput('searchEventsTool', [
      {
        id: 'e1',
        title: 'T',
        venue: 'v',
        neighborhood: 'n',
        startsAt: '2026-01-01',
        unknownField: 'gone',
      },
    ]);
    expect(action?.payload.listings?.[0]).not.toHaveProperty('unknownField');
    expect(action?.version).toBe(1);
  });

  it('rejects COP currency on events', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(
      normalizeToolOutput('searchEventsTool', [
        {
          id: 'e1',
          title: 'T',
          venue: 'v',
          neighborhood: 'n',
          startsAt: '2026-01-01',
          currency: 'COP',
        },
      ]),
    ).toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('transforms rentals nightly_price and image', () => {
    const action = normalizeToolOutput('searchRentalsTool', [
      {
        id: 'r1',
        title: 'Loft',
        neighborhood: 'Laureles',
        nightly_price: 80,
        image: 'a.jpg',
        bedrooms: 2,
        tags: ['wifi'],
        source_url: 'https://mde/r1',
      },
    ]);
    expect(action?.type).toBe('OPEN_RENTALS_RESULTS');
    const row = action?.payload.listings?.[0];
    expect(row?.price_daily).toBe(80);
    expect(row?.images).toEqual(['a.jpg']);
    expect(row?.amenities).toEqual(['wifi']);
    expect(action?.version).toBe(1);
  });

  it('parses valid restaurants', () => {
    const action = normalizeToolOutput('searchRestaurantsTool', [
      {
        id: 'rst',
        name: 'Carmen',
        cuisine: 'international',
        neighborhood: 'El Poblado',
        priceTier: '$$$$',
        avgPricePerPerson: 65,
        rating: 4.8,
        vibe: ['date-night'],
        imageUrl: 'https://i.jpg',
        sourceUrl: 'https://s',
      },
    ]);
    expect(action?.type).toBe('OPEN_RESTAURANT_RESULTS');
    expect(action?.payload.listings?.[0]?.name).toBe('Carmen');
    expect(action?.version).toBe(1);
  });

  it('parses valid attractions', () => {
    const action = normalizeToolOutput('searchAttractionsTool', [
      {
        id: 'a1',
        name: 'Comuna 13',
        category: 'tour',
        neighborhood: 'San Javier',
        priceUsd: 18,
        durationMinutes: 180,
        rating: 4.8,
        tags: ['walking'],
        imageUrl: 'https://i',
        sourceUrl: 'https://s',
      },
    ]);
    expect(action?.type).toBe('OPEN_ATTRACTION_RESULTS');
    expect(action?.payload.listings?.[0]?.priceUsd).toBe(18);
    expect(action?.version).toBe(1);
  });

  it('unwraps wrapped results for events', () => {
    const action = normalizeToolOutput('searchEventsTool', {
      results: [
        {
          id: 'e1',
          title: 'X',
          venue: 'v',
          neighborhood: 'n',
          startsAt: '2026-01-01',
        },
      ],
    });
    expect(action?.type).toBe('OPEN_EVENT_RESULTS');
    expect(action?.payload.listings).toHaveLength(1);
    expect(action?.version).toBe(1);
  });

  it('unwraps wrapped listings for rentals', () => {
    const action = normalizeToolOutput('searchRentalsTool', {
      listings: [
        {
          id: 'r1',
          title: 'T',
          nightly_price: 50,
          image: 'x.png',
        },
      ],
    });
    expect(action?.type).toBe('OPEN_RENTALS_RESULTS');
    expect(action?.payload.listings?.[0]?.price_daily).toBe(50);
    expect(action?.version).toBe(1);
  });

  it('unwraps wrapped items for restaurants', () => {
    const action = normalizeToolOutput('searchRestaurantsTool', {
      items: [
        {
          id: 'rst',
          name: 'Pizza',
          cuisine: 'italian',
          neighborhood: 'Estadio',
        },
      ],
    });
    expect(action?.type).toBe('OPEN_RESTAURANT_RESULTS');
    expect(action?.payload.listings).toHaveLength(1);
    expect(action?.payload.listings?.[0]?.name).toBe('Pizza');
    expect(action?.version).toBe(1);
  });

  // ── listing_ids ("See all on the map" fix) ─────────────────────────────────

  it('sets listing_ids on OPEN_RENTALS_RESULTS from listing ids', () => {
    const action = normalizeToolOutput('searchRentalsTool', [
      { id: 'apt-1', title: 'Loft A', nightly_price: 60 },
      { id: 'apt-2', title: 'Loft B', nightly_price: 70 },
      { id: 'apt-3', title: 'Loft C', nightly_price: 80 },
    ]);
    expect(action?.type).toBe('OPEN_RENTALS_RESULTS');
    // listing_ids must be present and match exactly the returned IDs
    expect((action?.payload as { listing_ids?: string[] }).listing_ids).toEqual([
      'apt-1',
      'apt-2',
      'apt-3',
    ]);
  });

  it('sets listing_ids on OPEN_EVENT_RESULTS from event ids', () => {
    const action = normalizeToolOutput('searchEventsTool', [
      { id: 'evt-10', title: 'Feria', venue: 'Centro', neighborhood: 'Centro', startsAt: '2026-06-01' },
      { id: 'evt-11', title: 'Jazz', venue: 'Park', neighborhood: 'Poblado', startsAt: '2026-06-02' },
    ]);
    expect(action?.type).toBe('OPEN_EVENT_RESULTS');
    expect((action?.payload as { listing_ids?: string[] }).listing_ids).toEqual(['evt-10', 'evt-11']);
  });

  it('sets empty listing_ids array when no listings returned', () => {
    const action = normalizeToolOutput('searchRentalsTool', []);
    expect(action?.type).toBe('OPEN_RENTALS_RESULTS');
    expect((action?.payload as { listing_ids?: string[] }).listing_ids).toEqual([]);
  });

  it('listing_ids matches listings order and count', () => {
    const raw = [
      { id: 'r-a', title: 'A', nightly_price: 50 },
      { id: 'r-b', title: 'B', nightly_price: 60 },
    ];
    const action = normalizeToolOutput('searchRentalsTool', raw);
    const ids = (action?.payload as { listing_ids?: string[] }).listing_ids ?? [];
    const listingIds = action?.payload.listings?.map((l) => l.id) ?? [];
    expect(ids).toEqual(listingIds);
  });
});
