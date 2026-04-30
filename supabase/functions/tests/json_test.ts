import { assertEquals } from "jsr:@std/assert@1";
import { safeJsonParse } from "../_shared/json.ts";

Deno.test("safeJsonParse — valid object", () => {
  const v = safeJsonParse('{"a":1}');
  assertEquals(v, { a: 1 });
});

Deno.test("safeJsonParse — invalid returns null", () => {
  assertEquals(safeJsonParse("{"), null);
});
