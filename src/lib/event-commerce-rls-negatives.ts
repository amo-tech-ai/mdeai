/**
 * EVT-011 — negative RLS scenarios (anon + authenticated boundaries).
 * Live proofs run in event-commerce-rls-negatives.live.test.ts when Supabase env is set.
 */

export type RlsNegativeScenario = {
  id: string;
  role: "anon" | "authenticated";
  table: string;
  action: "select" | "insert" | "rpc";
  description: string;
  expect: "empty" | "error" | "null";
};

export const EVENT_RLS_NEGATIVE_SCENARIOS: readonly RlsNegativeScenario[] = [
  {
    id: "anon-no-orders",
    role: "anon",
    table: "event_orders",
    action: "select",
    description: "Anonymous client cannot list ticket orders",
    expect: "empty",
  },
  {
    id: "anon-no-attendees",
    role: "anon",
    table: "event_attendees",
    action: "select",
    description: "Anonymous client cannot list attendee QR rows",
    expect: "empty",
  },
  {
    id: "anon-no-checkins",
    role: "anon",
    table: "event_check_ins",
    action: "select",
    description: "Anonymous client cannot read door scan logs",
    expect: "empty",
  },
  {
    id: "anon-no-draft-events",
    role: "anon",
    table: "events",
    action: "select",
    description: "Anonymous client cannot read draft events",
    expect: "empty",
  },
  {
    id: "anon-no-order-insert",
    role: "anon",
    table: "event_orders",
    action: "insert",
    description: "Anonymous client cannot insert orders (RPC/service_role only)",
    expect: "error",
  },
  {
    id: "anon-bad-order-token",
    role: "anon",
    table: "get_anonymous_order",
    action: "rpc",
    description: "Wrong access_token returns null, not another buyer's order",
    expect: "null",
  },
] as const;
