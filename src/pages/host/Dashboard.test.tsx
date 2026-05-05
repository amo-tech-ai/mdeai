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

vi.mock("@/components/layout/BrandLogo", () => ({
  BrandLogo: () => <span data-testid="brand-logo" />,
}));

// ── controllable auth ─────────────────────────────────────────────────────────
const mockAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => mockAuth() }));

// ── controllable data hooks ───────────────────────────────────────────────────
const mockProfile = vi.fn();
const mockListings = vi.fn();
const mockMetrics = vi.fn();
const mockLeads = vi.fn();

vi.mock("@/hooks/host/useLandlordOnboarding", () => ({
  useOwnLandlordProfile: () => mockProfile(),
}));

vi.mock("@/hooks/host/useListings", () => ({
  useOwnListings: () => mockListings(),
}));

vi.mock("@/hooks/host/useLandlordMetrics", () => ({
  useLandlordMetrics: () => mockMetrics(),
}));

vi.mock("@/hooks/host/useLeads", () => ({
  useLeads: () => mockLeads(),
}));

const LANDLORD_USER = {
  id: "u1",
  user_metadata: { account_type: "landlord" },
};

const LANDLORD_PROFILE = {
  id: "lp1",
  display_name: "Maria Hernández",
  kind: "individual",
  whatsapp_e164: "+573001234567",
  primary_neighborhood: "El Poblado",
  verification_status: "pending",
};

const EMPTY_METRICS = {
  metrics: {
    total: 0,
    active: 0,
    replied: 0,
    archived: 0,
    newCount: 0,
    replyRatePct: null,
    medianTtfrMs: null,
    windowDays: 30,
  },
  isLoading: false,
};

import HostDashboard from "./Dashboard";

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/host/dashboard"]}>
      <Routes>
        <Route path="/host/dashboard" element={<HostDashboard />} />
        <Route path="/login" element={<span data-testid="login-page" />} />
        <Route path="/dashboard" element={<span data-testid="renter-dashboard" />} />
        <Route path="/host/onboarding" element={<span data-testid="host-onboarding" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HostDashboard page", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockProfile.mockReset();
    mockListings.mockReset();
    mockMetrics.mockReset();
    mockLeads.mockReset();

    // Sensible defaults for data hooks (overridden per test when needed)
    mockListings.mockReturnValue({ data: [], isLoading: false, error: null, refetch: vi.fn() });
    mockMetrics.mockReturnValue(EMPTY_METRICS);
    mockLeads.mockReturnValue({ leads: [], isLoading: false, error: null, refetch: vi.fn(), counts: { all: 0, new: 0, viewed: 0, replied: 0, archived: 0 } });
  });

  it("shows a spinner while auth is loading", () => {
    mockAuth.mockReturnValue({ user: null, loading: true });
    mockProfile.mockReturnValue({ data: null, isLoading: false });
    renderPage();
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });

  it("redirects anon to /login with returnTo param", () => {
    mockAuth.mockReturnValue({ user: null, loading: false });
    mockProfile.mockReturnValue({ data: null, isLoading: false });
    renderPage();
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("redirects a renter to /dashboard", () => {
    mockAuth.mockReturnValue({
      user: { id: "u1", user_metadata: { account_type: "renter" } },
      loading: false,
    });
    mockProfile.mockReturnValue({ data: null, isLoading: false });
    renderPage();
    expect(screen.getByTestId("renter-dashboard")).toBeInTheDocument();
  });

  it("redirects a landlord with no profile to /host/onboarding", () => {
    mockAuth.mockReturnValue({ user: LANDLORD_USER, loading: false });
    mockProfile.mockReturnValue({ data: null, isLoading: false });
    renderPage();
    expect(screen.getByTestId("host-onboarding")).toBeInTheDocument();
  });

  it("renders dashboard header for a landlord with a profile", () => {
    mockAuth.mockReturnValue({ user: LANDLORD_USER, loading: false });
    mockProfile.mockReturnValue({ data: LANDLORD_PROFILE, isLoading: false });
    renderPage();
    expect(screen.getByTestId("host-dashboard-create")).toBeInTheDocument();
    expect(screen.getByText(/maria/i)).toBeInTheDocument();
  });

  it("renders the empty listings state when no listings exist", () => {
    mockAuth.mockReturnValue({ user: LANDLORD_USER, loading: false });
    mockProfile.mockReturnValue({ data: LANDLORD_PROFILE, isLoading: false });
    renderPage();
    expect(screen.getByTestId("host-listings-empty")).toBeInTheDocument();
  });

  it("shows listings skeleton while loading", () => {
    mockAuth.mockReturnValue({ user: LANDLORD_USER, loading: false });
    mockProfile.mockReturnValue({ data: LANDLORD_PROFILE, isLoading: false });
    mockListings.mockReturnValue({ data: undefined, isLoading: true, error: null, refetch: vi.fn() });
    renderPage();
    expect(screen.getByTestId("host-listings-loading")).toBeInTheDocument();
  });

  it("shows error state with retry button on listings fetch failure", () => {
    mockAuth.mockReturnValue({ user: LANDLORD_USER, loading: false });
    mockProfile.mockReturnValue({ data: LANDLORD_PROFILE, isLoading: false });
    mockListings.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("network failure"),
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByTestId("host-listings-error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("renders listing cards when listings exist", () => {
    mockAuth.mockReturnValue({ user: LANDLORD_USER, loading: false });
    mockProfile.mockReturnValue({ data: LANDLORD_PROFILE, isLoading: false });
    mockListings.mockReturnValue({
      data: [
        {
          id: "a1",
          title: "Bright 2-BR in El Poblado",
          neighborhood: "El Poblado",
          city: "Medellín",
          price_monthly: 4500000,
          currency: "COP",
          bedrooms: 2,
          bathrooms: 1,
          images: [],
          moderation_status: "approved",
          status: "active",
          rejection_reason: null,
          created_at: "2026-04-30T00:00:00Z",
          updated_at: "2026-04-30T00:00:00Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByTestId("host-listings-grid")).toBeInTheDocument();
    expect(screen.getByTestId("host-listing-card")).toBeInTheDocument();
    expect(screen.getByText("Bright 2-BR in El Poblado")).toBeInTheDocument();
  });

  it("does not render KPI strip when total leads = 0", () => {
    mockAuth.mockReturnValue({ user: LANDLORD_USER, loading: false });
    mockProfile.mockReturnValue({ data: LANDLORD_PROFILE, isLoading: false });
    renderPage();
    expect(screen.queryByTestId("landlord-performance")).not.toBeInTheDocument();
  });

  it("renders the host left nav with Listings + Leads items", () => {
    mockAuth.mockReturnValue({ user: LANDLORD_USER, loading: false });
    mockProfile.mockReturnValue({ data: LANDLORD_PROFILE, isLoading: false });
    renderPage();
    expect(screen.getByTestId("host-nav-listings")).toBeInTheDocument();
    expect(screen.getByTestId("host-nav-leads")).toBeInTheDocument();
  });
});
