import { describe, expect, it } from "vitest";
import { EVENT_RLS_NEGATIVE_SCENARIOS } from "./event-commerce-rls-negatives";

describe("EVT-011 RLS negative scenario catalog", () => {
  it("defines anon scenarios for orders, attendees, check-ins, and drafts", () => {
    const ids = EVENT_RLS_NEGATIVE_SCENARIOS.map((s) => s.id);
    expect(ids).toContain("anon-no-orders");
    expect(ids).toContain("anon-no-attendees");
    expect(ids).toContain("anon-no-draft-events");
    expect(ids).toContain("anon-bad-order-token");
  });

  it("requires every scenario to use anon role for commerce MVP gate", () => {
    expect(
      EVENT_RLS_NEGATIVE_SCENARIOS.every((s) => s.role === "anon"),
    ).toBe(true);
  });
});
