import { describe, expect, it } from "vitest";
import { formatTicketPriceCents, getAvailableTicketQuantity } from "@/lib/event-ticket-tier";

describe("event ticket tier helpers", () => {
  it("keeps pending tickets out of the available count", () => {
    expect(
      getAvailableTicketQuantity({
        qty_total: 50,
        qty_sold: 12,
        qty_pending: 8,
      }),
    ).toBe(30);
  });

  it("never reports negative availability", () => {
    expect(
      getAvailableTicketQuantity({
        qty_total: 10,
        qty_sold: 9,
        qty_pending: 4,
      }),
    ).toBe(0);
  });

  it("formats ticket prices from cents", () => {
    expect(formatTicketPriceCents(250000, "COP")).toBe("COP 2,500");
    expect(formatTicketPriceCents(0, "COP")).toBe("Free");
  });
});
