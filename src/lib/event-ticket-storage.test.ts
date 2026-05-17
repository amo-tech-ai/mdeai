import { describe, expect, it, beforeEach } from "vitest";
import {
  findStoredTicketOrder,
  readStoredTicketOrders,
  storedTicketOrderFromSearchParams,
  upsertStoredTicketOrder,
} from "./event-ticket-storage";

describe("event ticket storage", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) || null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
      },
    });
  });

  it("stores the anonymous order token without duplicating orders", () => {
    upsertStoredTicketOrder({
      orderId: "order-1",
      accessToken: "token-1",
      eventId: "event-1",
      eventName: "Launch Night",
      createdAt: "2026-05-16T00:00:00.000Z",
    });
    upsertStoredTicketOrder({
      orderId: "order-1",
      accessToken: "token-2",
      eventId: "event-1",
      eventName: "Launch Night",
      createdAt: "2026-05-16T01:00:00.000Z",
    });

    expect(readStoredTicketOrders()).toHaveLength(1);
    expect(findStoredTicketOrder("order-1")?.accessToken).toBe("token-2");
  });

  it("builds a stored order from webhook email query params", () => {
    const order = storedTicketOrderFromSearchParams(
      new URLSearchParams("order=order-2&token=token-2&event=event-2"),
    );

    expect(order).toMatchObject({
      orderId: "order-2",
      accessToken: "token-2",
      eventId: "event-2",
    });
  });

  it("ignores incomplete query params", () => {
    expect(storedTicketOrderFromSearchParams(new URLSearchParams("order=order-2"))).toBeNull();
    expect(storedTicketOrderFromSearchParams(new URLSearchParams("token=token-2"))).toBeNull();
  });
});
