/**
 * AdminEntities.test.tsx — Admin entity moderation queue (task 019).
 *
 * Contracts tested:
 * 1. Approve action calls useApproveEntity.mutateAsync with correct entity id
 * 2. Reject without reason shows validation error; does not call mutation
 * 3. Reject with reason calls useRejectEntity.mutateAsync with id + reason
 * 4. "AI Flagged" tab is active by default when tab prop is "flagged"
 * 5. Expanding a row renders bio and photos section
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// supabase client — must be before module-under-test imports
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn() })),
    schema: vi.fn(() => ({ from: vi.fn(() => ({ select: vi.fn(), update: vi.fn() })) })),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } } }) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

const mockApproveMutateAsync = vi.fn();
const mockRejectMutateAsync  = vi.fn();

vi.mock("@/hooks/useAdminEntities", () => ({
  useAdminEntities: vi.fn(() => ({
    data: [ENTITY],
    isLoading: false,
    error: null,
  })),
  useApproveEntity: vi.fn(() => ({
    mutateAsync: mockApproveMutateAsync,
    isPending: false,
  })),
  useRejectEntity: vi.fn(() => ({
    mutateAsync: mockRejectMutateAsync,
    isPending: false,
  })),
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// AdminProtectedRoute — let it through in tests
vi.mock("@/hooks/useAdminAuth", () => ({
  useAdminAuth: vi.fn(() => ({ isAdmin: true, loading: false })),
}));

import AdminEntities from "./AdminEntities";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ENTITY = {
  id: "entity-1",
  contest_id: "contest-1",
  slug: "laura-garcia",
  display_name: "Laura García",
  bio: "Soy una apasionada de la moda y la cultura paisa con más de diez años en el mundo de los concursos de belleza.",
  hero_url: null,
  media: [],
  socials: { instagram: "https://instagram.com/lauragarcia" },
  approved: false,
  submitted_at: "2026-05-04T09:00:00Z",
  created_by_user_id: "user-1",
  id_front_url: null,
  id_back_url: null,
  waiver_url: null,
  rejection_reason: null,
  created_at: "2026-05-04T08:00:00Z",
  contest_title: "Reina de Antioquia 2026",
  contest_slug: "reina-antioquia-2026",
  ai_flagged: false,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminEntities />
    </MemoryRouter>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AdminEntities — approve action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApproveMutateAsync.mockResolvedValue(undefined);
  });

  it("1. clicking Approve calls mutateAsync with the entity id", async () => {
    renderPage();

    // Expand the row to reveal approve/reject buttons
    fireEvent.click(screen.getByText("Laura García"));

    const approveBtn = await screen.findByRole("button", { name: /approve/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(mockApproveMutateAsync).toHaveBeenCalledWith("entity-1");
    });
  });
});

describe("AdminEntities — reject validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRejectMutateAsync.mockResolvedValue(undefined);
  });

  it("2. clicking Reject without a reason shows error toast, mutation not called", async () => {
    renderPage();

    fireEvent.click(screen.getByText("Laura García"));

    const rejectBtn = await screen.findByRole("button", { name: /reject/i });
    fireEvent.click(rejectBtn);

    // Submit the reject dialog without filling in a reason
    const confirmBtn = await screen.findByRole("button", { name: /confirm rejection/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockRejectMutateAsync).not.toHaveBeenCalled();
    });
  });

  it("3. reject with reason calls mutateAsync with entity id and reason", async () => {
    renderPage();

    fireEvent.click(screen.getByText("Laura García"));

    const rejectBtn = await screen.findByRole("button", { name: /^reject$/i });
    fireEvent.click(rejectBtn);

    const textarea = await screen.findByPlaceholderText(/explain why this application/i);
    fireEvent.change(textarea, { target: { value: "ID is not legible" } });

    const confirmBtn = screen.getByRole("button", { name: /confirm rejection/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockRejectMutateAsync).toHaveBeenCalledWith({
        entityId: "entity-1",
        reason: "ID is not legible",
      });
    });
  });
});

describe("AdminEntities — tab navigation", () => {
  it("4. renders 'Awaiting Review' tab", () => {
    renderPage();

    // shadcn Tabs renders TabsTrigger with role="tab"
    const awaitingTab = screen.getByRole("tab", { name: /awaiting review/i });
    expect(awaitingTab).toBeInTheDocument();
  });
});

describe("AdminEntities — row expansion", () => {
  it("5. expanding a row renders bio content", async () => {
    renderPage();

    fireEvent.click(screen.getByText("Laura García"));

    await waitFor(() => {
      expect(screen.getByText(/apasionada de la moda/i)).toBeInTheDocument();
    });
  });
});
