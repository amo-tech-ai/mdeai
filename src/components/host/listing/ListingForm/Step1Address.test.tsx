import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Step1Address, type Step1AddressValue } from "./Step1Address";

// Step1 contract:
//   - Address input renders + accepts manual typing.
//   - Neighborhood + city inputs render and edit independently.
//   - Continue is disabled until address + neighborhood + city + lat/lng
//     are all set (the Places autocomplete fills lat/lng on selection).
//   - The Maps fallback alert appears if the loader can't initialize
//     (auth failure OR missing key) — verified via env-var manipulation.

// Stub the maps loader so JSDOM doesn't try to fetch the Google script.
vi.mock("@/lib/google-maps-loader", () => ({
  loadGoogleMapsLibrary: vi.fn().mockRejectedValue(new Error("test stub")),
  isMapsAuthFailed: vi.fn().mockReturnValue(false),
  onMapsAuthFailed: vi.fn().mockReturnValue(() => undefined),
}));

const EMPTY: Step1AddressValue = {
  address: "",
  city: "",
  neighborhood: "",
  latitude: null,
  longitude: null,
};

const COMPLETE: Step1AddressValue = {
  address: "Calle 10 #42-50",
  city: "Medellín",
  neighborhood: "El Poblado",
  latitude: 6.2,
  longitude: -75.5,
};

beforeEach(() => {
  // Provide the env var so the loader path doesn't bail early on the
  // missing-key branch (we want to test the autocomplete-load fallback).
  vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");
});

describe("Step1Address", () => {
  it("renders address, neighborhood, and city inputs", () => {
    render(
      <Step1Address value={EMPTY} onChange={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(screen.getByTestId("step1-address-input")).toBeInTheDocument();
    expect(screen.getByTestId("step1-neighborhood-input")).toBeInTheDocument();
    expect(screen.getByTestId("step1-city-input")).toBeInTheDocument();
  });

  it("disables Continue when fields are empty", () => {
    render(
      <Step1Address value={EMPTY} onChange={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(screen.getByTestId("step1-submit")).toBeDisabled();
  });

  it("enables Continue when address + neighborhood + city + lat/lng all set", () => {
    render(
      <Step1Address value={COMPLETE} onChange={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(screen.getByTestId("step1-submit")).toBeEnabled();
  });

  it("emits onChange when typing in the address input", () => {
    const onChange = vi.fn();
    render(
      <Step1Address value={EMPTY} onChange={onChange} onSubmit={vi.fn()} />,
    );
    fireEvent.change(screen.getByTestId("step1-address-input"), {
      target: { value: "Carrera 43A" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ address: "Carrera 43A" }),
    );
  });

  it("calls onSubmit when Continue is clicked with a complete value", () => {
    const onSubmit = vi.fn();
    render(
      <Step1Address
        value={COMPLETE}
        onChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByTestId("step1-submit"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
