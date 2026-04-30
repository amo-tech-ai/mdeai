import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Step3Welcome } from "./Step3Welcome";

// Step3 is purely informational. Contract:
//   - Greets the user by first name (split by space).
//   - "Document received" copy when verification was submitted; "Skipped"
//     copy otherwise.
//   - Two CTAs: "List your first property" -> /host/listings/new and
//     "Go to dashboard" -> /host/dashboard.

function renderStep3(displayName: string, verificationSubmitted: boolean) {
  render(
    <MemoryRouter>
      <Step3Welcome
        displayName={displayName}
        verificationSubmitted={verificationSubmitted}
      />
    </MemoryRouter>,
  );
}

describe("Step3Welcome", () => {
  it("greets the user by first name", () => {
    renderStep3("Maria Hernández", false);
    expect(
      screen.getByText(/welcome aboard, maria\./i),
    ).toBeInTheDocument();
  });

  it("uses the full display name when there is no space", () => {
    renderStep3("MariaHostel", false);
    expect(
      screen.getByText(/welcome aboard, mariahostel\./i),
    ).toBeInTheDocument();
  });

  it("shows 'Document received' copy when verification was submitted", () => {
    renderStep3("Maria", true);
    expect(
      screen.getByText(/document received\. founder typically reviews/i),
    ).toBeInTheDocument();
  });

  it("shows 'Skipped' copy when verification was skipped", () => {
    renderStep3("Maria", false);
    expect(
      screen.getByText(/skipped for now\. verify any time/i),
    ).toBeInTheDocument();
  });

  it("renders both CTAs with correct hrefs", () => {
    renderStep3("Maria", false);
    // shadcn `<Button asChild><Link/></Button>` renders the Link AS the
    // button — the data-testid is applied to the `<a>` tag directly.
    const listingCTA = screen.getByTestId("step3-cta-listing");
    const dashboardCTA = screen.getByTestId("step3-cta-dashboard");
    expect(listingCTA.tagName).toBe("A");
    expect(dashboardCTA.tagName).toBe("A");
    expect(listingCTA).toHaveAttribute("href", "/host/listings/new");
    expect(dashboardCTA).toHaveAttribute("href", "/host/dashboard");
  });
});
