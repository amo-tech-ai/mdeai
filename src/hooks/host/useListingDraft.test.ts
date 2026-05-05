import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useListingDraft, EMPTY_DRAFT } from "./useListingDraft";

// Hook contract:
//   - Generates a stable draftId across re-renders.
//   - Returns EMPTY_DRAFT on first mount when sessionStorage is empty.
//   - updateDraft patches fields atomically.
//   - Persists to sessionStorage after every change; hydrates on mount.
//   - clearDraft wipes both state and sessionStorage.

beforeEach(() => {
  if (typeof window !== "undefined") window.sessionStorage.clear();
});

describe("useListingDraft", () => {
  it("returns the empty draft on first mount", () => {
    const { result } = renderHook(() => useListingDraft());
    expect(result.current.draft).toEqual(EMPTY_DRAFT);
  });

  it("generates a uuid-shaped draftId that is stable across renders", () => {
    const { result, rerender } = renderHook(() => useListingDraft());
    const id1 = result.current.draftId;
    rerender();
    const id2 = result.current.draftId;
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^[a-f0-9-]+$/i);
  });

  it("patches fields via updateDraft without dropping existing values", () => {
    const { result } = renderHook(() => useListingDraft());
    act(() => {
      result.current.updateDraft({ address: "Calle 10", bedrooms: 2 });
    });
    expect(result.current.draft.address).toBe("Calle 10");
    expect(result.current.draft.bedrooms).toBe(2);
    expect(result.current.draft.bathrooms).toBe(EMPTY_DRAFT.bathrooms);
  });

  it("persists changes to sessionStorage under the draftId key", () => {
    const { result } = renderHook(() => useListingDraft());
    const id = result.current.draftId;
    act(() => {
      result.current.updateDraft({ address: "Carrera 43A" });
    });
    const raw = window.sessionStorage.getItem(`mdeai.listing-draft.${id}`);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toMatchObject({ address: "Carrera 43A" });
  });

  it("clearDraft wipes both state and sessionStorage", () => {
    const { result } = renderHook(() => useListingDraft());
    const id = result.current.draftId;
    act(() => {
      result.current.updateDraft({ price_monthly: 1500000 });
    });
    expect(window.sessionStorage.getItem(`mdeai.listing-draft.${id}`)).toBeTruthy();
    act(() => {
      result.current.clearDraft();
    });
    expect(result.current.draft).toEqual(EMPTY_DRAFT);
    expect(window.sessionStorage.getItem(`mdeai.listing-draft.${id}`)).toBeNull();
  });
});
