import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = join(
  process.cwd(),
  "supabase/migrations/20260517120000_evt001_events_rls_alignment.sql",
);

describe("EVT-001 events RLS migration contract", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("backfills legacy active rows to published", () => {
    expect(sql).toMatch(/SET status = 'published'/);
    expect(sql).toMatch(/is_active = true/);
  });

  it("drops legacy is_active-only SELECT policies", () => {
    expect(sql).toContain('DROP POLICY IF EXISTS "anon_can_view_active_events"');
    expect(sql).toContain(
      'DROP POLICY IF EXISTS "authenticated_can_view_active_events"',
    );
  });

  it("defines status-based public SELECT and organizer scoping", () => {
    expect(sql).toContain('"events_public_select_published"');
    expect(sql).toMatch(/status IN \('published', 'live'\)/);
    expect(sql).toContain('"events_organizer_select_own"');
    expect(sql).toContain("organizer_id = (SELECT auth.uid())");
    expect(sql).toContain('"events_organizer_insert_own"');
    expect(sql).toContain('"events_organizer_update_own"');
  });

  it("grants admin full read/write and preserves admin delete policy", () => {
    expect(sql).toContain('"events_admin_select_all"');
    expect(sql).toContain('"events_admin_insert"');
    expect(sql).toContain('"events_admin_update"');
    expect(sql).not.toMatch(/DROP POLICY.*admins_can_delete_events/);
  });
});
