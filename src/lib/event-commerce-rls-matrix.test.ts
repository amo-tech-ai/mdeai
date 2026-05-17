import { describe, expect, it } from "vitest";
import {
  ANON_ORDER_ACCESS_RPC,
  EVENT_COMMERCE_POLICIES,
  EVENT_COMMERCE_RLS_TABLES,
  PAYMENTS_EVENT_ORDER_POLICY,
  allEventCommercePolicyNames,
} from "./event-commerce-rls-matrix";

describe("event-commerce-rls-matrix (EVT-010)", () => {
  it("lists all commerce tables with expected policy counts", () => {
    expect(EVENT_COMMERCE_RLS_TABLES).toHaveLength(5);
    expect(EVENT_COMMERCE_POLICIES.event_orders).toEqual([
      "orders_buyer_select",
      "orders_organizer_select",
    ]);
    expect(EVENT_COMMERCE_POLICIES.event_attendees).toEqual([
      "attendees_via_order_select",
    ]);
    expect(EVENT_COMMERCE_POLICIES.event_check_ins).toEqual([
      "checkins_organizer_select",
    ]);
  });

  it("documents anon buyer path via RPC not direct orders SELECT", () => {
    expect(ANON_ORDER_ACCESS_RPC).toBe("get_anonymous_order");
    expect(EVENT_COMMERCE_POLICIES.event_orders).not.toContain(
      "orders_anon_select",
    );
  });

  it("includes payments bridge policy for event orders", () => {
    const names = allEventCommercePolicyNames();
    expect(names).toContain(PAYMENTS_EVENT_ORDER_POLICY);
    expect(names.length).toBe(9);
  });
});
