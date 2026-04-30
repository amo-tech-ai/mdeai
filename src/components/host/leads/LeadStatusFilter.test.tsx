import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  LeadStatusFilter,
  type LeadFilter,
} from "./LeadStatusFilter";

const COUNTS: Record<LeadFilter, number> = {
  all: 12,
  new: 4,
  viewed: 5,
  replied: 2,
  archived: 1,
};

describe("LeadStatusFilter", () => {
  it("renders all 5 segments with their counts", () => {
    const onChange = vi.fn();
    render(
      <LeadStatusFilter value="all" onChange={onChange} counts={COUNTS} />,
    );
    expect(screen.getByTestId("lead-filter-all")).toHaveTextContent("All");
    expect(screen.getByTestId("lead-filter-all")).toHaveTextContent("12");
    expect(screen.getByTestId("lead-filter-new")).toHaveTextContent("4");
    expect(screen.getByTestId("lead-filter-viewed")).toHaveTextContent("5");
    expect(screen.getByTestId("lead-filter-replied")).toHaveTextContent("2");
    expect(screen.getByTestId("lead-filter-archived")).toHaveTextContent("1");
  });

  it("marks the active segment with aria-selected=true", () => {
    const onChange = vi.fn();
    render(
      <LeadStatusFilter value="new" onChange={onChange} counts={COUNTS} />,
    );
    expect(screen.getByTestId("lead-filter-new")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("lead-filter-all")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("fires onChange when a different segment is clicked", () => {
    const onChange = vi.fn();
    render(
      <LeadStatusFilter value="all" onChange={onChange} counts={COUNTS} />,
    );
    fireEvent.click(screen.getByTestId("lead-filter-replied"));
    expect(onChange).toHaveBeenCalledWith("replied");
  });

  it("renders zero counts when no leads are present", () => {
    const onChange = vi.fn();
    render(
      <LeadStatusFilter
        value="all"
        onChange={onChange}
        counts={{ all: 0, new: 0, viewed: 0, replied: 0, archived: 0 }}
      />,
    );
    // Each segment renders "0" — not crash
    expect(
      screen.getAllByText("0").length,
    ).toBeGreaterThanOrEqual(5);
  });
});
