import { assertEquals } from "jsr:@std/assert@1";
import { httpStatusFromP1AtomicRpcError } from "../_shared/http.ts";

Deno.test("httpStatusFromP1AtomicRpcError — P0001 + p1_schedule_tour_atomic → 409", () => {
  assertEquals(
    httpStatusFromP1AtomicRpcError({
      code: "P0001",
      message:
        "p1_schedule_tour_atomic: a showing already exists this calendar day for this lead and apartment (different time)",
    }),
    409,
  );
});

Deno.test("httpStatusFromP1AtomicRpcError — P0001 + p1_start_rental_application_atomic → 409", () => {
  assertEquals(
    httpStatusFromP1AtomicRpcError({
      code: "P0001",
      message: "p1_start_rental_application_atomic: something",
    }),
    409,
  );
});

Deno.test("httpStatusFromP1AtomicRpcError — other DB error → 500", () => {
  assertEquals(
    httpStatusFromP1AtomicRpcError({
      code: "23505",
      message: "duplicate key value violates unique constraint",
    }),
    500,
  );
});

Deno.test("httpStatusFromP1AtomicRpcError — P0001 without p1 prefix → 500", () => {
  assertEquals(
    httpStatusFromP1AtomicRpcError({
      code: "P0001",
      message: "some other check constraint",
    }),
    500,
  );
});
