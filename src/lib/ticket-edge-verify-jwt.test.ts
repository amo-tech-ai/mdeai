/**
 * EVT-009 — config.toml gateway JWT must match handler auth design for ticket edges.
 * @see https://supabase.com/docs/guides/functions/function-configuration
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CONFIG_PATH = resolve(process.cwd(), "supabase/config.toml");

function parseTicketVerifyJwt(config: string): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  let current: string | null = null;
  for (const line of config.split("\n")) {
    const section = line.match(/^\[functions\.([^\]]+)\]/);
    if (section) {
      current = section[1];
      continue;
    }
    const jwt = line.match(/^verify_jwt\s*=\s*(true|false)\s*$/);
    if (jwt && current?.startsWith("ticket-")) {
      out[current] = jwt[1] === "true";
    }
  }
  return out;
}

describe("ticket edge verify_jwt (EVT-009)", () => {
  const config = readFileSync(CONFIG_PATH, "utf8");
  const jwt = parseTicketVerifyJwt(config);

  it("ticket-checkout has verify_jwt=false (anonymous checkout allowed)", () => {
    expect(jwt["ticket-checkout"]).toBe(false);
  });

  it("ticket-validate has verify_jwt=false (custom staff HS256 JWT in-handler)", () => {
    expect(jwt["ticket-validate"]).toBe(false);
  });

  it("ticket-payment-webhook has verify_jwt=false (Stripe signature only)", () => {
    expect(jwt["ticket-payment-webhook"]).toBe(false);
  });

  it("handler comments document verify_jwt=false for checkout", () => {
    const src = readFileSync(
      resolve(process.cwd(), "supabase/functions/ticket-checkout/index.ts"),
      "utf8",
    );
    expect(src).toMatch(/verify_jwt\s*=\s*false/i);
  });

  it("handler comments document verify_jwt=false for validate", () => {
    const src = readFileSync(
      resolve(process.cwd(), "supabase/functions/ticket-validate/index.ts"),
      "utf8",
    );
    expect(src).toMatch(/verify_jwt\s*=\s*false/i);
  });
});
