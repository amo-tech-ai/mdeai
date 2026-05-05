/**
 * VenuePicker.test.tsx — task 035 venue picker (Phase 1 Events).
 *
 * Contracts tested:
 * 1. Shows "No venues yet" empty state when list is empty
 * 2. "New venue" button opens the create-venue dialog
 * 3. Submitting the create form calls useCreateVenue.mutate with parsed input
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn() })),
    auth: { getUser: vi.fn() },
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ user: { id: "organizer-1" }, loading: false })),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

const mockMutate = vi.fn();

vi.mock("@/hooks/useVenues", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useVenues")>("@/hooks/useVenues");
  return {
    ...actual,
    useVenues: vi.fn(() => ({ data: [], isLoading: false, error: null, refetch: vi.fn() })),
    useCreateVenue: vi.fn(() => ({ mutate: mockMutate, isPending: false })),
  };
});

import { VenuePicker } from "./VenuePicker";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderPicker(value: string | null = null, onChange = vi.fn()) {
  return render(
    <MemoryRouter>
      <VenuePicker value={value} onChange={onChange} />
    </MemoryRouter>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("VenuePicker — empty state", () => {
  it("1. shows 'No venues yet' when the list is empty", () => {
    renderPicker();
    expect(screen.getByText(/no venues yet/i)).toBeInTheDocument();
  });
});

describe("VenuePicker — dialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("2. clicking 'New venue' opens the create-venue dialog", async () => {
    renderPicker();

    fireEvent.click(screen.getByRole("button", { name: /new venue/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Add a new venue")).toBeInTheDocument();
    });
  });

  it("3. filling the form and submitting calls createVenue.mutate", async () => {
    mockMutate.mockImplementation((_input, { onSuccess }) => {
      onSuccess({ id: "v-1", name: "Hotel Test", address: "Calle 1", city: "Medellín", capacity: 100, postal_code: null });
    });

    renderPicker();

    fireEvent.click(screen.getByRole("button", { name: /new venue/i }));

    await screen.findByRole("dialog");

    fireEvent.change(screen.getByPlaceholderText(/Hotel Intercontinental/i), {
      target: { value: "Hotel Test" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Calle 16/i), {
      target: { value: "Calle 1 #2-3, Laureles" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create venue/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Hotel Test", address: "Calle 1 #2-3, Laureles" }),
        expect.any(Object),
      );
    });
  });
});
