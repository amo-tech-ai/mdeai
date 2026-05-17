import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ANON_ORDER_ACCESS_RPC,
  EVENT_COMMERCE_POLICIES,
  EVENT_COMMERCE_RLS_TABLES,
  PAYMENTS_EVENT_ORDER_POLICY,
} from "./event-commerce-rls-matrix";

const PHASE1_MIGRATION = join(
  process.cwd(),
  "supabase/migrations/20260503011925_event_phase1.sql",
);

describe("EVT-010 event commerce RLS migration contract", () => {
  const sql = readFileSync(PHASE1_MIGRATION, "utf8");

  it("enables RLS on all commerce tables", () => {
    for (const table of EVENT_COMMERCE_RLS_TABLES) {
      expect(sql).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`,
      );
    }
  });

  it("defines every policy in the canonical matrix", () => {
    for (const policies of Object.values(EVENT_COMMERCE_POLICIES)) {
      for (const name of policies) {
        expect(sql).toContain(`CREATE POLICY ${name}`);
      }
    }
    expect(sql).toContain(`CREATE POLICY ${PAYMENTS_EVENT_ORDER_POLICY}`);
  });

  it("scopes public ticket SELECT to published/live events", () => {
    expect(sql).toMatch(
      /tickets_public_select[\s\S]*?e\.status IN \('published','live'\)/,
    );
  });

  it("scopes buyer and organizer order SELECT separately", () => {
    expect(sql).toMatch(
      /orders_buyer_select[\s\S]*?buyer_user_id = \(select auth\.uid\(\)\)/,
    );
    expect(sql).toMatch(
      /orders_organizer_select[\s\S]*?e\.organizer_id = \(select auth\.uid\(\)\)/,
    );
  });

  it("chains attendee visibility through orders (buyer or organizer)", () => {
    expect(sql).toMatch(
      /attendees_via_order_select[\s\S]*?o\.buyer_user_id = \(select auth\.uid\(\)\)/,
    );
    expect(sql).toMatch(
      /attendees_via_order_select[\s\S]*?e\.organizer_id = \(select auth\.uid\(\)\)/,
    );
  });

  it("documents anon order RPC with grant to anon", () => {
    expect(sql).toContain(`FUNCTION public.${ANON_ORDER_ACCESS_RPC}`);
    expect(sql).toMatch(
      new RegExp(
        `GRANT EXECUTE ON FUNCTION public\\.${ANON_ORDER_ACCESS_RPC}[^;]+ TO anon`,
      ),
    );
  });

  it("does not add public INSERT on event_orders (writes via RPC/service_role)", () => {
    const orderPolicyBlock = sql.slice(
      sql.indexOf("orders_buyer_select"),
      sql.indexOf("event_attendees:"),
    );
    expect(orderPolicyBlock).not.toMatch(/FOR INSERT/);
  });
});
