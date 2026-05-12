import { assertEquals } from "jsr:@std/assert@1";
import {
  auditIgnore,
  edgeTestJwt,
  gatewayOptions,
  gatewayPost,
  userJwtHeaders,
} from "./audit_helpers.ts";

const SLUG = "sponsor-audience-match";

Deno.test({
  name: `${SLUG} — OPTIONS`,
  ignore: auditIgnore(),
  async fn() {
    assertEquals([200, 204, 503].includes(await gatewayOptions(SLUG)), true);
  },
});

Deno.test({
  name: `${SLUG} — POST anon Bearer → not authed sponsor path`,
  ignore: auditIgnore(),
  async fn() {
    const { status } = await gatewayPost(
      SLUG,
      JSON.stringify({
        organization_id: "00000000-0000-4000-8000-000000000099",
        brand_description: "Test brand audit description long enough.",
        brand_keywords: ["coffee"],
      }),
    );
    assertEquals([401, 403].includes(status), true);
  },
});

Deno.test({
  name: `${SLUG} — POST EDGE_TEST_USER_JWT + random UUID → 403/404 (ownership)`,
  ignore: auditIgnore() || !edgeTestJwt(),
  async fn() {
    const { status } = await gatewayPost(
      SLUG,
      JSON.stringify({
        organization_id: "00000000-0000-4000-8000-000000000099",
        brand_description: "Test brand audit description long enough.",
        brand_keywords: ["coffee"],
      }),
      userJwtHeaders(edgeTestJwt()),
    );
    assertEquals([403, 404].includes(status), true);
  },
});
