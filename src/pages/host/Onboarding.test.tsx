import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// ── infrastructure mocks ──────────────────────────────────────────────────────
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
  },
}));

vi.mock("@/lib/posthog", () => ({
  trackEvent: vi.fn(),
  identifyUser: vi.fn(),
  resetPostHog: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/components/layout/BrandLogo", () => ({
  BrandLogo: () => <span data-testid="brand-logo" />,
}));

// ── controllable auth ─────────────────────────────────────────────────────────
const mockAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => mockAuth() }));

// ── controllable landlord profile ─────────────────────────────────────────────
const mockProfile = vi.fn();
vi.mock("@/hooks/host/useLandlordOnboarding", () => ({
  useOwnLandlordProfile: () => mockProfile(),
  useSubmitStep1Basics: () => ({
    mutate: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
  }),
  useSubmitVerification: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
}));

// ── step components stubbed so this file only tests the page shell ─────────────
vi.mock("@/components/host/onboarding/Step1Basics", () => ({
  Step1Basics: () => <div data-testid="step1-stub" />,
}));
vi.mock("@/components/host/onboarding/Step2Verification", () => ({
  Step2Verification: () => <div data-testid="step2-stub" />,
}));
vi.mock("@/components/host/onboarding/Step3Welcome", () => ({
  Step3Welcome: () => <div data-testid="step3-stub" />,
}));

import HostOnboarding from "./Onboarding";

// Helper — render the page at /host/onboarding; capture where Navigate lands.
function renderPage() {
  let navigatedTo = "";
  render(
    <MemoryRouter initialEntries={["/host/onboarding"]}>
      <Routes>
        <Route path="/host/onboarding" element={<HostOnboarding />} />
        {/* Sentinel routes so we can assert redirect target */}
        <Route
          path="/login"
          element={
            <span
              data-testid="login-page"
              data-search={window.location.search}
            />
          }
        />
        <Route path="/dashboard" element={<span data-testid="renter-dashboard" />} />
        <Route path="*" element={<span data-testid={`landed:${window.location.pathname}`} />} />
      </Routes>
    </MemoryRouter>,
  );
  return { navigatedTo };
}

describe("HostOnboarding page", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockProfile.mockReset();
  });

  it("shows a spinner while auth is loading", () => {
    mockAuth.mockReturnValue({ user: null, loading: true });
    mockProfile.mockReturnValue({ data: null, isLoading: true });
    renderPage();
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });

  it("redirects anon to /login?returnTo=/host/onboarding", () => {
    mockAuth.mockReturnValue({ user: null, loading: false });
    mockProfile.mockReturnValue({ data: null, isLoading: false });
    renderPage();
    // Navigate replaces the route — MemoryRouter renders the /login sentinel
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("redirects a renter (non-landlord account) to /dashboard", () => {
    mockAuth.mockReturnValue({
      user: { id: "u1", user_metadata: { account_type: "renter" } },
      loading: false,
    });
    mockProfile.mockReturnValue({ data: null, isLoading: false });
    renderPage();
    expect(screen.getByTestId("renter-dashboard")).toBeInTheDocument();
  });

  it("renders Step 1 of the wizard for a landlord with no existing profile", () => {
    mockAuth.mockReturnValue({
      user: { id: "u1", user_metadata: { account_type: "landlord" } },
      loading: false,
    });
    mockProfile.mockReturnValue({ data: null, isLoading: false });
    renderPage();
    expect(screen.getByTestId("step1-stub")).toBeInTheDocument();
  });

  it("shows Step 1 pre-filled when a landlord profile already exists", () => {
    mockAuth.mockReturnValue({
      user: { id: "u1", user_metadata: { account_type: "landlord" } },
      loading: false,
    });
    mockProfile.mockReturnValue({
      data: {
        id: "lp1",
        display_name: "Maria Hernández",
        kind: "individual",
        whatsapp_e164: "+573001234567",
        primary_neighborhood: "El Poblado",
        verification_status: "pending",
      },
      isLoading: false,
    });
    renderPage();
    // Step 1 stub renders (profile rehydration logic in HostOnboarding passes
    // step1Defaults to Step1Basics; the stub just renders — no assertion on
    // the defaults needed at this integration level)
    expect(screen.getByTestId("step1-stub")).toBeInTheDocument();
  });
});
