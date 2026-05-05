import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({
          data: { path: "test/logo.png" },
          error: null,
        }),
      })),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: { application_id: "app-1", organization_id: "org-1" },
        },
        error: null,
      }),
    },
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ user: null, loading: false })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: vi.fn(() => vi.fn()) };
});

// ---------------------------------------------------------------------------
// Component imports (after mocks)
// ---------------------------------------------------------------------------

import { Step1Company }  from "@/components/sponsor/wizard/Step1Company";
import { Step2Package }  from "@/components/sponsor/wizard/Step2Package";
import { Step3Assets }   from "@/components/sponsor/wizard/Step3Assets";
import { Step4Review }   from "@/components/sponsor/wizard/Step4Review";
import type { WizardDraft } from "@/types/sponsor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={makeQc()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Test 1: Step1Company shows validation error when email is empty
// ---------------------------------------------------------------------------

describe("Step1Company", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("shows email validation error when email is empty and form is submitted", async () => {
    const onNext = vi.fn();

    wrapWithProviders(
      <Step1Company defaultValues={{}} onNext={onNext} />,
    );

    // Fill required fields except email
    fireEvent.change(screen.getByPlaceholderText("Acme S.A.S."), {
      target: { value: "Test Legal" },
    });
    fireEvent.change(screen.getByPlaceholderText("Acme"), {
      target: { value: "Test Brand" },
    });
    fireEvent.change(screen.getByPlaceholderText("María García"), {
      target: { value: "Test Contact" },
    });

    // Leave email blank and submit
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });

    expect(onNext).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Test 2: Step2Package requires tier and event selection before proceeding
// ---------------------------------------------------------------------------

describe("Step2Package", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation errors when event and tier are not selected", async () => {
    const onNext = vi.fn();
    const onBack = vi.fn();

    wrapWithProviders(
      <Step2Package
        defaultValues={{}}
        onNext={onNext}
        onBack={onBack}
      />,
    );

    // Click Next without selecting event or tier
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      // Validation message is a <p> with destructive styling inside the form
      const messages = screen.getAllByText(/select an event/i);
      const errorMsg = messages.find((el) => el.tagName.toLowerCase() === "p");
      expect(errorMsg).toBeInTheDocument();
    });

    expect(onNext).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Test 3: Step3Assets rejects non-SVG/PNG files
// ---------------------------------------------------------------------------

describe("Step3Assets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an error when a non-image file is selected for the logo", async () => {
    const onNext = vi.fn();
    const onBack = vi.fn();

    wrapWithProviders(
      <Step3Assets defaultValues={{}} onNext={onNext} onBack={onBack} />,
    );

    const fileInput = document.querySelector<HTMLInputElement>(
      "input[aria-label='Upload logo']",
    );
    expect(fileInput).not.toBeNull();

    const badFile = new File(["contents"], "test.exe", {
      type: "application/octet-stream",
    });

    fireEvent.change(fileInput!, { target: { files: [badFile] } });

    await waitFor(() => {
      // The error paragraph has class text-destructive; select the one that is the error msg
      const messages = screen.getAllByText(/SVG or PNG/i);
      const errorMsg = messages.find((el) =>
        el.classList.contains("text-destructive"),
      );
      expect(errorMsg).toBeInTheDocument();
    });

    expect(onNext).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Test 4: Step4Review shows sign-in CTA when user is null
// ---------------------------------------------------------------------------

describe("Step4Review", () => {
  it("shows Sign In link when user is not authenticated", () => {
    const minimalDraft: WizardDraft = {
      step: 4,
      organization: { display_name: "Acme", legal_name: "Acme S.A.S.", contact_full_name: "María", contact_email: "maria@acme.com" },
      application:  { event_id: "evt-1", event_title: "Festival 2026", activation_type: "digital", tier: "bronze", pricing_model: "flat", flat_price_cents: 50000000 },
      assets:       { utm_destination: "https://acme.com", logo_path: "logos/test.png" },
    };

    wrapWithProviders(
      <Step4Review
        draft={minimalDraft}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        user={null}
      />,
    );

    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login?redirect=/sponsor/apply",
    );
  });

  it("shows Proceed to Payment button when user is authenticated", () => {
    const minimalDraft: WizardDraft = {
      step: 4,
      organization: { display_name: "Acme", legal_name: "Acme S.A.S.", contact_full_name: "María", contact_email: "maria@acme.com" },
      application:  { event_id: "evt-1", event_title: "Festival 2026", activation_type: "digital", tier: "bronze", pricing_model: "flat", flat_price_cents: 50000000 },
      assets:       { utm_destination: "https://acme.com", logo_path: "logos/test.png" },
    };

    wrapWithProviders(
      <Step4Review
        draft={minimalDraft}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        user={{ id: "user-1" }}
      />,
    );

    expect(
      screen.getByRole("button", { name: /proceed to payment/i }),
    ).toBeInTheDocument();
  });
});
