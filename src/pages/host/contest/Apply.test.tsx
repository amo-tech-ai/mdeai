/**
 * Apply.test.tsx — Contestant intake wizard tests (task 018).
 *
 * Test cases:
 * 1. Redirects to login when unauthenticated
 * 2. Shows "Concurso no disponible" when contest status is not 'live'
 * 3. StepBio: rejects bio shorter than 50 chars
 * 4. StepConsent: submit button disabled when checkboxes unchecked
 * 5. CompletenessMeter: shows 0% when draft is null
 * 6. StepPhotos: shows moderation warning when verdict is 'rejected'
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ─── Mock useAuth ─────────────────────────────────────────────────────────────
const useAuthMock = vi.fn();
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => useAuthMock() }));

// ─── Mock useContest ──────────────────────────────────────────────────────────
const useContestMock = vi.fn();
vi.mock("@/hooks/useContest", () => ({
  useContest:        () => useContestMock(),
  useContestEntities: vi.fn(() => ({ data: [], isLoading: false })),
  useContestTally:    vi.fn(() => ({ data: [], isLoading: false })),
}));

// ─── Mock useContestApply ─────────────────────────────────────────────────────
const mockSaveBio    = vi.fn();
const mockUploadPhoto = vi.fn();
const mockUploadIdDoc = vi.fn();
const mockUploadWaiver = vi.fn();
const mockSubmit      = vi.fn();
const mockSetStep     = vi.fn();

vi.mock("@/hooks/useContestApply", () => ({
  useContestApply: () => ({
    draft:        null,
    step:         1,
    setStep:      mockSetStep,
    isLoading:    false,
    saveBio:      mockSaveBio,
    uploadPhoto:  mockUploadPhoto,
    uploadIdDoc:  mockUploadIdDoc,
    uploadWaiver: mockUploadWaiver,
    submit:       mockSubmit,
  }),
}));

// ─── Mock supabase (needed by hoisted imports) ────────────────────────────────
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from:      vi.fn(() => ({ select: vi.fn() })),
    storage:   { from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn() })) },
    functions: { invoke: vi.fn() },
    schema:    vi.fn(() => ({ from: vi.fn(() => ({ insert: vi.fn(), update: vi.fn(), select: vi.fn() })) })),
    auth:      { getUser: vi.fn() },
  },
}));

// ─── Mock react-router navigate ───────────────────────────────────────────────
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

import Apply from "./Apply";
import { StepBio }           from "@/components/contest/intake/StepBio";
import { StepConsent }       from "@/components/contest/intake/StepConsent";
import { CompletenessMeter } from "@/components/contest/intake/CompletenessMeter";
import { StepPhotos }        from "@/components/contest/intake/StepPhotos";
import type { ModerationResult } from "@/types/contestApply";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LIVE_PAGEANT = {
  id:      "contest-1",
  slug:    "reina-antioquia-2026",
  kind:    "pageant",
  title:   "Reina de Antioquia 2026",
  status:  "live",
  org_id:  "org-1",
  starts_at: new Date().toISOString(),
  ends_at:   new Date(Date.now() + 86_400_000).toISOString(),
  free_votes_per_user_per_day: 1,
  description: null,
  cover_url:   null,
};

function renderApply(slug = "reina-antioquia-2026") {
  return render(
    <MemoryRouter initialEntries={[`/host/contest/${slug}/apply`]}>
      <Routes>
        <Route path="/host/contest/:slug/apply" element={<Apply />} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Apply page — auth guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. redirects to /login when user is unauthenticated", () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    useContestMock.mockReturnValue({ data: LIVE_PAGEANT, isLoading: false, error: null });

    renderApply();

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });
});

describe("Apply page — contest guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ user: { id: "user-1" }, loading: false });
  });

  it("2. shows 'Concurso no disponible' when contest status is not live", () => {
    useContestMock.mockReturnValue({
      data:      { ...LIVE_PAGEANT, status: "draft" },
      isLoading: false,
      error:     null,
    });

    renderApply();

    expect(screen.getByText("Concurso no disponible")).toBeInTheDocument();
  });
});

describe("StepBio — validation", () => {
  it("3. rejects bio shorter than 50 characters on submit", async () => {
    const onSubmit = vi.fn();

    render(
      <MemoryRouter>
        <StepBio draft={null} saving={false} onSubmit={onSubmit} />
      </MemoryRouter>,
    );

    // Fill display_name
    fireEvent.change(screen.getByPlaceholderText(/Valentina Restrepo/i), {
      target: { value: "María García" },
    });

    // Fill a bio that is too short (< 50 chars)
    fireEvent.change(screen.getByPlaceholderText(/Cuéntale/i), {
      target: { value: "Corta" },
    });

    // Fill at least one social
    fireEvent.change(screen.getByPlaceholderText(/instagram.com/i), {
      target: { value: "https://instagram.com/maria" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Guardar y continuar/i }));

    await waitFor(() => {
      expect(screen.getByText(/al menos 50 caracteres/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("StepConsent — submit button state", () => {
  it("4. submit button is disabled when both checkboxes are unchecked", () => {
    const onSubmit = vi.fn();
    const onBack   = vi.fn();

    render(
      <MemoryRouter>
        <StepConsent submitting={false} onSubmit={onSubmit} onBack={onBack} />
      </MemoryRouter>,
    );

    const submitBtn = screen.getByTestId("submit-button");
    expect(submitBtn).toBeDisabled();
  });
});

describe("CompletenessMeter", () => {
  it("5. shows 0% when draft is null", () => {
    render(
      <MemoryRouter>
        <CompletenessMeter draft={null} />
      </MemoryRouter>,
    );

    expect(screen.getByText("0% completado")).toBeInTheDocument();
  });
});

describe("StepPhotos — moderation warning", () => {
  it("6. shows moderation warning when hero verdict is 'rejected'", async () => {
    const rejectedModeration: ModerationResult = {
      verdict: "rejected",
      flags:   ["nudity"],
      reasons: ["La imagen contiene contenido inapropiado"],
    };

    const onUpload = vi.fn().mockResolvedValue({
      url:        "contests/slug/entity-1/hero.jpg",
      moderation: rejectedModeration,
    });

    const draftWithRejection = {
      entity_id:         "entity-1",
      display_name:      "Test",
      bio:               "",
      socials:           {},
      hero_url:          null,
      photo2_url:        null,
      photo3_url:        null,
      hero_moderation:   rejectedModeration,
      photo2_moderation: null,
      photo3_moderation: null,
      id_front_url:      null,
      id_back_url:       null,
      waiver_url:        null,
      habeas_data:       false,
      image_rights:      false,
      completed_steps:   new Set<number>(),
    };

    render(
      <MemoryRouter>
        <StepPhotos
          draft={draftWithRejection}
          contest={LIVE_PAGEANT}
          onUpload={onUpload}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    );

    // Warning should be shown for the rejected hero moderation from draft
    await waitFor(() => {
      expect(screen.getByTestId("moderation-warning")).toBeInTheDocument();
    });

    expect(screen.getByText("Foto rechazada")).toBeInTheDocument();
  });
});
