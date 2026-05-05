import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Mock the hooks — per plan: mock hooks, not Supabase client directly.
// ---------------------------------------------------------------------------

vi.mock("@/hooks/sponsor/useContractSign", () => ({
  useContractQuery: vi.fn(),
  useSignContract: vi.fn(),
}));

// Mock sonner so toast.success/error don't blow up in jsdom
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-router-dom navigate (used in the page's useEffect)
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: vi.fn(() => vi.fn()) };
});

import { useContractQuery, useSignContract } from "@/hooks/sponsor/useContractSign";
import { SignatureForm } from "@/components/sponsor/SignatureForm";
import ContractSign from "./ContractSign";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderWithProviders(ui: React.ReactElement, contractId = "aaaabbbb-1111-2222-3333-ccccddddeeee") {
  const qc = makeQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/sponsor/contract/${contractId}`]}>
        <Routes>
          <Route path="/sponsor/contract/:contractId" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockSignMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
};

const baseContract = {
  id: "aaaabbbb-1111-2222-3333-ccccddddeeee",
  sponsor_user_id: "user-1",
  application_id: "app-1",
  status: "sent_for_signature",
  pdf_storage_path: "/contracts/test.pdf",
  sponsor_signed_at: null,
  sponsor_display_name: null,
  created_at: new Date().toISOString(),
};

const mockContractActive = {
  isLoading: false,
  isError: false,
  data: {
    contract: baseContract,
    pdfSignedUrl: "https://example.com/contract.pdf",
  },
  error: null,
};

// ---------------------------------------------------------------------------
// Test 1 & 2 & 3: SignatureForm (isolated, no router/query needed)
// ---------------------------------------------------------------------------

describe("SignatureForm", () => {
  it("Sign button disabled without checkbox checked", () => {
    render(<SignatureForm onSign={vi.fn()} isLoading={false} />);

    // Fill in a valid name but leave checkbox unchecked
    const nameInput = screen.getByPlaceholderText(/full name as it appears/i);
    fireEvent.change(nameInput, { target: { value: "Juan García" } });

    const button = screen.getByRole("button", { name: /sign contract/i });
    expect(button).toBeDisabled();
  });

  it("Sign button disabled without name", () => {
    render(<SignatureForm onSign={vi.fn()} isLoading={false} />);

    // Check the checkbox but leave name empty
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const button = screen.getByRole("button", { name: /sign contract/i });
    expect(button).toBeDisabled();
  });

  it("Sign button enabled when checkbox checked AND name >= 3 chars", () => {
    render(<SignatureForm onSign={vi.fn()} isLoading={false} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const nameInput = screen.getByPlaceholderText(/full name as it appears/i);
    fireEvent.change(nameInput, { target: { value: "Ana" } });

    const button = screen.getByRole("button", { name: /sign contract/i });
    expect(button).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Test 4: ContractSign page — already-signed state
// ---------------------------------------------------------------------------

describe("ContractSign page", () => {
  beforeEach(() => {
    vi.mocked(useSignContract).mockReturnValue(
      mockSignMutation as unknown as ReturnType<typeof useSignContract>,
    );
  });

  it("renders 'Contract Signed' badge when status is signed", () => {
    vi.mocked(useContractQuery).mockReturnValue({
      ...mockContractActive,
      data: {
        ...mockContractActive.data,
        contract: {
          ...baseContract,
          status: "signed",
          sponsor_signed_at: new Date().toISOString(),
          sponsor_display_name: "Sofía Ramírez",
        },
      },
    } as unknown as ReturnType<typeof useContractQuery>);

    renderWithProviders(<ContractSign />);

    expect(screen.getByText(/contract signed/i)).toBeDefined();
  });
});
