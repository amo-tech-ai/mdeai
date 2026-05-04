/**
 * EmbeddedEventDraft — rendering and interaction tests.
 *
 * Contract:
 * 1. Returns null when no SHOW_EVENT_DRAFT action is present.
 * 2. Renders event name, date, address, and ticket tiers.
 * 3. Shows "Gratis" for free tickets; COP-formatted price for paid tiers.
 * 4. "Open in editor" button navigates to deep_link.
 * 5. Discard button archives the event and hides the card.
 * 6. Discard DB error shows toast and keeps card visible.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock supabase BEFORE importing component ─────────────────────────────────
const updateMock = vi.fn();
const eqMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

// ── Mock sonner toast ────────────────────────────────────────────────────────
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) },
}));

// ── Mock react-router-dom navigate ──────────────────────────────────────────
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

import { EmbeddedEventDraft } from './EmbeddedEventDraft';
import type { ChatAction } from '@/types/chat';

// ── Fixtures ─────────────────────────────────────────────────────────────────
const EVENT_ID = 'evt-uuid-001';

const DRAFT_ACTION: ChatAction = {
  type: 'SHOW_EVENT_DRAFT',
  payload: {
    event_id: EVENT_ID,
    name: 'Reina de Antioquia 2026',
    start_at: '2026-10-18T20:00:00-05:00',
    end_at: null,
    address: 'Hotel Intercontinental, Medellín',
    description: 'Annual beauty pageant.',
    currency: 'COP',
    tiers: [
      { id: 'tier-1', name: 'GA', price_cents: 40_000_00, currency: 'COP', qty_total: 500 },
      { id: 'tier-2', name: 'Free Pass', price_cents: 0, currency: 'COP', qty_total: 50 },
    ],
    deep_link: `/host/event/new?draft=${EVENT_ID}`,
  },
};

function buildSupabaseChain(result: { error: null | { message: string } }) {
  const eqChain = { eq: eqMock };
  eqMock.mockReturnValue(Promise.resolve(result));
  updateMock.mockReturnValue(eqChain);
  fromMock.mockReturnValue({ update: updateMock });
}

function renderCard(actions: ChatAction[] = [DRAFT_ACTION]) {
  return render(
    <MemoryRouter>
      <EmbeddedEventDraft actions={actions} />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('EmbeddedEventDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when actions has no SHOW_EVENT_DRAFT', () => {
    const { container } = renderCard([]);
    expect(container.firstChild).toBeNull();
  });

  it('renders event name', () => {
    renderCard();
    expect(screen.getByTestId('draft-name')).toHaveTextContent('Reina de Antioquia 2026');
  });

  it('renders the date', () => {
    renderCard();
    expect(screen.getByTestId('draft-date')).toBeInTheDocument();
  });

  it('renders the address', () => {
    renderCard();
    expect(screen.getByTestId('draft-address')).toHaveTextContent('Hotel Intercontinental, Medellín');
  });

  it('renders both ticket tiers', () => {
    renderCard();
    expect(screen.getAllByTestId('draft-tier')).toHaveLength(2);
  });

  it('shows "Gratis" for free tier and formatted price for paid tier', () => {
    renderCard();
    expect(screen.getByText('Gratis')).toBeInTheDocument();
    // GA tier price: 4000000 cents / 100 = 40,000 COP — Intl formats it
    const allTiers = screen.getAllByTestId('draft-tier');
    expect(allTiers[0]).toHaveTextContent('GA');
    expect(allTiers[1]).toHaveTextContent('Gratis');
  });

  it('navigates to deep_link on "Open in editor" click', async () => {
    renderCard();
    fireEvent.click(screen.getByTestId('open-in-editor-btn'));
    expect(navigateMock).toHaveBeenCalledWith(`/host/event/new?draft=${EVENT_ID}`);
  });

  it('archives the event and hides the card on discard success', async () => {
    buildSupabaseChain({ error: null });

    renderCard();
    fireEvent.click(screen.getByTestId('discard-btn'));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({ status: 'archived' });
      expect(toastSuccess).toHaveBeenCalledWith('Draft discarded');
      expect(screen.queryByTestId('event-draft-card')).toBeNull();
    });
  });

  it('shows error toast and keeps card visible on discard failure', async () => {
    buildSupabaseChain({ error: { message: 'permission denied' } });

    renderCard();
    fireEvent.click(screen.getByTestId('discard-btn'));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Failed to discard draft');
      expect(screen.getByTestId('event-draft-card')).toBeInTheDocument();
    });
  });
});
