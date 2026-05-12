import { assertEquals } from "jsr:@std/assert@1";
import {
  auditIgnore,
  edgeTestJwt,
  gatewayOptions,
  gatewayPost,
  userJwtHeaders,
} from "./audit_helpers.ts";

const SLUG = "sponsor-moderate";

Deno.test({
  name: `${SLUG} — OPTIONS`,
  ignore: auditIgnore(),
  async fn() {
    assertEquals([200, 204, 503].includes(await gatewayOptions(SLUG)), true);
  },
});

Deno.test({
  name: `${SLUG} — POST anon asset → 401/403`,
  ignore: auditIgnore(),
  async fn() {
    const { status } = await gatewayPost(
      SLUG,
      JSON.stringify({
        asset_id: "00000000-0000-4000-8000-000000000099",
        storage_url: "https://example.com/a.png",
        kind: "image",
      }),
    );
    assertEquals([401, 403].includes(status), true);
  },
});

Deno.test({
  name: `${SLUG} — POST EDGE_TEST_USER_JWT + foreign asset → 403`,
  ignore: auditIgnore() || !edgeTestJwt(),
  async fn() {
    const { status } = await gatewayPost(
      SLUG,
      JSON.stringify({
        asset_id: "00000000-0000-4000-8000-000000000088",
        storage_url: "https://example.com/a.png",
        kind: "image",
      }),
      userJwtHeaders(edgeTestJwt()),
    );
    assertEquals(status, 403);
  },
});
