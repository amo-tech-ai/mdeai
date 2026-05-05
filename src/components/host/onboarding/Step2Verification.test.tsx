import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Step2Verification } from "./Step2Verification";

// Step2 contract:
//   - Submit is disabled until a valid file is picked.
//   - File over 10 MB or wrong MIME type shows a local error and clears
//     selection (no callback fires).
//   - Skip always advances regardless of file state.
//   - Submit fires onSubmit with { docKind, file } payload.
//
// Storage upload itself is verified at the integration layer (the
// useSubmitVerification mutation) — not this unit test.

function makeFile(name: string, type: string, sizeBytes: number) {
  // Construct a real File so the size + type are honored.
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

function setup() {
  const onSubmit = vi.fn();
  const onSkip = vi.fn();
  render(<Step2Verification onSubmit={onSubmit} onSkip={onSkip} />);
  return { onSubmit, onSkip };
}

describe("Step2Verification", () => {
  it("renders skip and submit, with submit disabled by default", () => {
    setup();
    const skip = screen.getByTestId("step2-skip");
    const submit = screen.getByTestId("step2-submit");
    expect(skip).toBeEnabled();
    expect(submit).toBeDisabled();
  });

  it("fires onSkip when 'Skip for now' is clicked", () => {
    const { onSkip, onSubmit } = setup();
    fireEvent.click(screen.getByTestId("step2-skip"));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a file over 10 MB", () => {
    const { onSubmit } = setup();
    const tooBig = makeFile("huge.pdf", "application/pdf", 11 * 1024 * 1024);
    const input = screen.getByTestId("step2-file-input") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [tooBig] } });
    expect(screen.getByRole("alert")).toHaveTextContent(/over 10 MB/i);
    expect(screen.getByTestId("step2-submit")).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects an unsupported MIME type", () => {
    const { onSubmit } = setup();
    const wrong = makeFile("data.csv", "text/csv", 1024);
    const input = screen.getByTestId("step2-file-input") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [wrong] } });
    expect(screen.getByRole("alert")).toHaveTextContent(/JPEG, PNG, WebP/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("accepts a valid PDF and fires onSubmit on click", () => {
    const { onSubmit } = setup();
    const ok = makeFile("id.pdf", "application/pdf", 200_000);
    const input = screen.getByTestId("step2-file-input") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [ok] } });
    expect(screen.getByTestId("step2-submit")).toBeEnabled();
    fireEvent.click(screen.getByTestId("step2-submit"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [payload] = onSubmit.mock.calls[0];
    expect(payload.docKind).toBe("national_id");
    expect(payload.file).toBe(ok);
  });
});
