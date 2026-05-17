import { describe, expect, it } from "vitest";
import { isPublicEventStatus, PUBLIC_EVENT_STATUSES } from "./events-catalog";

describe("events-catalog", () => {
  it("exposes published and live as public statuses", () => {
    expect(PUBLIC_EVENT_STATUSES).toEqual(["published", "live"]);
  });

  it("accepts only published/live as public", () => {
    expect(isPublicEventStatus("published")).toBe(true);
    expect(isPublicEventStatus("live")).toBe(true);
    expect(isPublicEventStatus("draft")).toBe(false);
    expect(isPublicEventStatus("closed")).toBe(false);
    expect(isPublicEventStatus("archived")).toBe(false);
  });
});
