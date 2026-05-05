import { assertEquals } from "jsr:@std/assert@1";
import { requireCronSecret } from "../_shared/cron.ts";

Deno.test("requireCronSecret — all scenarios (serial env)", () => {
  const prev = Deno.env.get("CRON_SECRET");
  try {
    Deno.env.delete("CRON_SECRET");
    assertEquals(
      requireCronSecret(new Request("https://example.com", { method: "POST" })),
      null,
    );

    Deno.env.set("CRON_SECRET", "unit-test-secret");
    assertEquals(
      requireCronSecret(new Request("https://example.com", { method: "POST" }))
        ?.status,
      403,
    );
    assertEquals(
      requireCronSecret(
        new Request("https://example.com", {
          method: "POST",
          headers: { "x-cron-secret": "unit-test-secret" },
        }),
      ),
      null,
    );
  } finally {
    if (prev !== undefined) Deno.env.set("CRON_SECRET", prev);
    else Deno.env.delete("CRON_SECRET");
  }
});
