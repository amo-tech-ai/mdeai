import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { PUBLIC_EVENT_STATUSES } from "./events-catalog";
import { readViteEnv } from "./read-vite-env";

const env = readViteEnv();
const url = env.VITE_SUPABASE_URL;
const key =
  env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || "";

const canRunLive = Boolean(url && key);

describe.skipIf(!canRunLive)("EVT-011 live RLS negatives (anon)", () => {
  const anon = createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  it("anon cannot SELECT event_orders", async () => {
    const { data, error } = await anon.from("event_orders").select("id").limit(5);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("anon cannot SELECT event_attendees", async () => {
    const { data, error } = await anon
      .from("event_attendees")
      .select("id")
      .limit(5);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("anon cannot SELECT event_check_ins", async () => {
    const { data, error } = await anon
      .from("event_check_ins")
      .select("id")
      .limit(5);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("anon cannot SELECT draft events", async () => {
    const { data, error } = await anon
      .from("events")
      .select("id, status")
      .eq("status", "draft");
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("anon can SELECT published/live events only", async () => {
    const { data, error } = await anon
      .from("events")
      .select("id, status")
      .limit(20);
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
    for (const row of data ?? []) {
      expect(PUBLIC_EVENT_STATUSES).toContain(row.status);
    }
  });

  it("anon cannot INSERT event_orders", async () => {
    const { error } = await anon.from("event_orders").insert({
      event_id: "00000000-0000-0000-0000-000000000001",
      buyer_email: "probe@test.local",
      status: "pending",
    } as never);
    expect(error).not.toBeNull();
  });

  it("get_anonymous_order rejects wrong access_token", async () => {
    const { data, error } = await anon.rpc("get_anonymous_order", {
      p_order_id: "00000000-0000-0000-0000-000000000099",
      p_access_token: "invalid-token-probe",
    });
    expect(error).toBeNull();
    expect(data).toBeNull();
  });
});
