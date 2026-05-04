/**
 * useAdminEntities — TanStack Query hook for the admin entity moderation queue.
 *
 * Queries vote.entities joined with vote.contests(title) filtered by tab:
 *   all        → all submitted entities (submitted_at IS NOT NULL)
 *   flagged    → entities where any photo moderation flagged issues
 *   awaiting   → approved = false, no rejection recorded
 *   rejected   → approved = false AND rejection_reason IS NOT NULL
 *
 * Mutations: approveEntity, rejectEntity(id, reason)
 *
 * NOTE: vote.entities does not have an ai_moderation_status column in the
 * current schema. The "AI Flagged" tab is derived from the media jsonb array
 * where any item has moderation.flagged = true.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminEntityTab = "all" | "flagged" | "awaiting" | "rejected";

export interface MediaItem {
  url: string;
  slot: string;
  moderation?: {
    flagged: boolean;
    reason?: string;
    score?: number;
  };
}

export interface AdminEntity {
  id: string;
  contest_id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  hero_url: string | null;
  media: MediaItem[];
  socials: Record<string, string | null>;
  approved: boolean;
  submitted_at: string | null;
  created_by_user_id: string | null;
  id_front_url: string | null;
  id_back_url: string | null;
  waiver_url: string | null;
  rejection_reason: string | null;
  created_at: string;
  // Joined from vote.contests
  contest_title: string;
  contest_slug: string;
  // Derived
  ai_flagged: boolean;
}

interface RawEntityRow {
  id: string;
  contest_id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  hero_url: string | null;
  media: unknown;
  socials: unknown;
  approved: boolean;
  submitted_at: string | null;
  created_by_user_id: string | null;
  id_front_url: string | null;
  id_back_url: string | null;
  waiver_url: string | null;
  rejection_reason: string | null;
  created_at: string;
  vote_contests: {
    title: string;
    slug: string;
  } | null;
}

// ─── Query key factory ────────────────────────────────────────────────────────

const QUERY_KEY = (tab: AdminEntityTab) => ["admin-entities", tab] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMediaArray(raw: unknown): MediaItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is MediaItem => {
    return typeof item === "object" && item !== null && "url" in item;
  });
}

function parseSocials(raw: unknown): Record<string, string | null> {
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, string | null>;
  }
  return {};
}

function isAiFlagged(media: MediaItem[]): boolean {
  return media.some((item) => item.moderation?.flagged === true);
}

function normalizeRow(row: RawEntityRow): AdminEntity {
  const media = parseMediaArray(row.media);
  return {
    id: row.id,
    contest_id: row.contest_id,
    slug: row.slug,
    display_name: row.display_name,
    bio: row.bio,
    hero_url: row.hero_url,
    media,
    socials: parseSocials(row.socials),
    approved: row.approved,
    submitted_at: row.submitted_at,
    created_by_user_id: row.created_by_user_id,
    id_front_url: row.id_front_url,
    id_back_url: row.id_back_url,
    waiver_url: row.waiver_url,
    rejection_reason: row.rejection_reason ?? null,
    created_at: row.created_at,
    contest_title: row.vote_contests?.title ?? "Unknown Contest",
    contest_slug: row.vote_contests?.slug ?? "",
    ai_flagged: isAiFlagged(media),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminEntities(tab: AdminEntityTab) {
  return useQuery({
    queryKey: QUERY_KEY(tab),
    queryFn: async (): Promise<AdminEntity[]> => {
      // Base query — only submitted applications
      let query = supabase
        .schema("vote" as never)
        .from("entities")
        .select(
          `id, contest_id, slug, display_name, bio, hero_url, media, socials,
           approved, submitted_at, created_by_user_id,
           id_front_url, id_back_url, waiver_url, rejection_reason, created_at,
           vote_contests:contests!contest_id(title, slug)`,
        )
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: true });

      // Tab-specific filters
      if (tab === "awaiting") {
        query = query.eq("approved", false).is("rejection_reason", null);
      } else if (tab === "rejected") {
        query = query.eq("approved", false).not("rejection_reason", "is", null);
      }
      // "all" and "flagged" return everything submitted; flagged is filtered client-side

      const { data, error } = await query;
      if (error) throw error;

      const rows = ((data ?? []) as unknown as RawEntityRow[]).map(normalizeRow);

      if (tab === "flagged") {
        return rows.filter((r) => r.ai_flagged);
      }
      return rows;
    },
    staleTime: 30_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useApproveEntity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (entityId: string): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .schema("vote" as never)
        .from("entities")
        .update({
          approved: true,
          rejection_reason: null,
          identity_verified_at: new Date().toISOString(),
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", entityId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-entities"] });
    },
  });
}

export function useRejectEntity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityId,
      reason,
    }: {
      entityId: string;
      reason: string;
    }): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .schema("vote" as never)
        .from("entities")
        .update({
          approved: false,
          rejection_reason: reason,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", entityId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-entities"] });
    },
  });
}
