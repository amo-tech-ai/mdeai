import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Step2Specs, type Step2SpecsValue } from "./Step2Specs";

// Step2 contract:
//   - All four blocks render (rooms, size+price, qualitative, amenities).
//   - NumberStepper +/- buttons fire onChange with bounded numbers.
//   - Continue is disabled until bedrooms + bathrooms + price_monthly are set.
//   - Amenity chip toggles add/remove from the array.

const BASE: Step2SpecsValue = {
  bedrooms: 1,
  bathrooms: 1,
  size_sqm: null,
  furnished: true,
  price_monthly: null,
  currency: "COP",
  minimum_stay_days: 30,
  amenities: [],
  building_amenities: [],
};

const COMPLETE: Step2SpecsValue = {
  ...BASE,
  size_sqm: 65,
  price_monthly: 1500000,
};

describe("Step2Specs", () => {
  it("renders bedrooms + bathrooms steppers + size + price + amenities", () => {
    render(
      <Step2Specs
        value={BASE}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("step2-bedrooms-value")).toHaveTextContent("1");
    expect(screen.getByTestId("step2-bathrooms-value")).toHaveTextContent("1");
    expect(screen.getByTestId("step2-size-input")).toBeInTheDocument();
    expect(screen.getByTestId("step2-price-input")).toBeInTheDocument();
    expect(screen.getByTestId("step2-amenity-wifi")).toBeInTheDocument();
  });

  it("disables Continue when price is missing", () => {
    render(
      <Step2Specs
        value={BASE}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("step2-submit")).toBeDisabled();
  });

  it("enables Continue when bedrooms + bathrooms + price set", () => {
    render(
      <Step2Specs
        value={COMPLETE}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("step2-submit")).toBeEnabled();
  });

  it("increments bedrooms when + clicked, bounded at max=10", () => {
    const onChange = vi.fn();
    render(
      <Step2Specs
        value={{ ...BASE, bedrooms: 9 }}
        onChange={onChange}
        onSubmit={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId("step2-bedrooms-inc"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ bedrooms: 10 }),
    );
  });

  it("does NOT decrement bathrooms below the min of 1", () => {
    const onChange = vi.fn();
    render(
      <Step2Specs
        value={{ ...BASE, bathrooms: 1 }}
        onChange={onChange}
        onSubmit={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("step2-bathrooms-dec")).toBeDisabled();
  });

  it("toggles an amenity into the array when clicked", () => {
    const onChange = vi.fn();
    render(
      <Step2Specs
        value={BASE}
        onChange={onChange}
        onSubmit={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    const wifiCheckbox = screen
      .getByTestId("step2-amenity-wifi")
      .querySelector("button[role=checkbox]");
    expect(wifiCheckbox).not.toBeNull();
    fireEvent.click(wifiCheckbox!);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ amenities: ["WiFi"] }),
    );
  });

  it("calls onBack when Back is clicked", () => {
    const onBack = vi.fn();
    render(
      <Step2Specs
        value={BASE}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onBack={onBack}
      />,
    );
    fireEvent.click(screen.getByTestId("step2-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
