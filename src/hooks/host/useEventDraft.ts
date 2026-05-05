import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  type EventBasicsInput,
  type EventDraft,
  type TicketTierInput,
  generateSlug,
} from "@/types/event-wizard";

/**
 * Phase 1 events MVP — draft persistence + publish hooks.
 * Covers task 002 (wizard) + the Step 4 publish flow (collision-handled slug).
 *
 * Auto-save shape: each step transition fires `useUpsertDraft` with the partial
 * shape. The page persists `draftId` in the URL (`?draft=:id`) so refreshing
 * or returning later resumes cleanly.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Loaders
// ─────────────────────────────────────────────────────────────────────────────

export function useEventDraft(draftId: string | null) {
  return useQuery({
    queryKey: ["event-draft", draftId],
    enabled: !!draftId,
    staleTime: 60_000, // 1 min — draft mutates on every step; allow some refetch quiet time
    queryFn: async (): Promise<EventDraft | null> => {
      if (!draftId) return null;

      const { data: event, error: eventErr } = await supabase
        .from("events")
        .select("*")
        .eq("id", draftId)
        .single();
      if (eventErr) throw new Error(eventErr.message);
      if (!event) return null;

      const { data: tickets, error: ticketsErr } = await supabase
        .from("event_tickets")
        .select("*")
        .eq("event_id", draftId)
        .order("position", { ascending: true });
      if (ticketsErr) throw new Error(ticketsErr.message);

      return {
        id: event.id,
        basics: {
          name: event.name ?? "",
          description: event.description ?? "",
          event_type: (event.event_type ?? "other") as EventBasicsInput["event_type"],
          event_start_time: event.event_start_time ?? "",
          event_end_time: event.event_end_time ?? "",
          timezone: event.timezone ?? "America/Bogota",
          venue_id: event.venue_id ?? null,
          address: event.address ?? "",
          city: event.city ?? "Medellín",
          website: event.website ?? "",
          age_restriction: "",
          primary_image_url: event.primary_image_url ?? "",
        },
        tickets: (tickets ?? []).map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description ?? "",
          price_cents: t.price_cents,
          qty_total: t.qty_total,
          is_active: t.is_active,
          position: t.position,
          min_per_order: t.min_per_order ?? 1,
          max_per_order: t.max_per_order ?? 10,
        })),
      };
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 + Step 2 — upsert draft (creates row on first call; updates after)
// ─────────────────────────────────────────────────────────────────────────────

interface UpsertBasicsArgs {
  draftId: string | null;
  basics: EventBasicsInput;
}

export function useUpsertEventBasics() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ draftId, basics }: UpsertBasicsArgs): Promise<{ id: string }> => {
      if (!user) throw new Error("Not authenticated");

      const payload = {
        name: basics.name,
        description: basics.description ?? null,
        event_type: basics.event_type,
        event_start_time: basics.event_start_time,
        event_end_time: basics.event_end_time,
        timezone: basics.timezone,
        venue_id: basics.venue_id ?? null,
        address: basics.address,
        city: basics.city,
        country: "Colombia",
        website: basics.website ?? null,
        primary_image_url: basics.primary_image_url ?? null,
        organizer_id: user.id,
        status: "draft" as const,
      };

      if (draftId) {
        const { data, error } = await supabase
          .from("events")
          .update(payload)
          .eq("id", draftId)
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        return { id: data.id };
      }

      const { data, error } = await supabase
        .from("events")
        .insert({ ...payload, source: "manual" })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: data.id };
    },
    onSuccess: (_, vars) => {
      if (vars.draftId) qc.invalidateQueries({ queryKey: ["event-draft", vars.draftId] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — upsert ticket tiers
// ─────────────────────────────────────────────────────────────────────────────

interface UpsertTicketsArgs {
  draftId: string;
  tickets: TicketTierInput[];
}

export function useUpsertEventTickets() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ draftId, tickets }: UpsertTicketsArgs): Promise<void> => {
      // Strategy: hard-replace tier set on every step transition.
      // Drafts have no buyers yet so deletion is safe. After publish, qty_sold
      // would prevent destructive deletes via RLS + CHECK.
      const { error: deleteErr } = await supabase
        .from("event_tickets")
        .delete()
        .eq("event_id", draftId);
      if (deleteErr) throw new Error(deleteErr.message);

      if (tickets.length === 0) return;

      const rows = tickets.map((t, i) => ({
        event_id: draftId,
        name: t.name,
        description: t.description ?? null,
        price_cents: t.price_cents,
        currency: "COP",
        qty_total: t.qty_total,
        is_active: t.is_active,
        position: i,
        min_per_order: t.min_per_order,
        max_per_order: t.max_per_order,
      }));

      const { error: insertErr } = await supabase
        .from("event_tickets")
        .insert(rows);
      if (insertErr) throw new Error(insertErr.message);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["event-draft", vars.draftId] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — publish (slug gen with collision retry, status=draft → published)
// ─────────────────────────────────────────────────────────────────────────────

interface PublishArgs {
  draftId: string;
  name: string;
}

const SLUG_MAX_RETRIES = 8;

export function usePublishEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ draftId, name }: PublishArgs): Promise<{ slug: string }> => {
      const baseSlug = generateSlug(name);

      // Try base, then -2, -3, …; the unique partial index events_slug_uk catches
      // collisions atomically. We retry on 23505 (unique_violation).
      for (let attempt = 1; attempt <= SLUG_MAX_RETRIES; attempt++) {
        const candidate = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;
        const { error } = await supabase
          .from("events")
          .update({ slug: candidate, status: "published" })
          .eq("id", draftId);

        if (!error) return { slug: candidate };

        // 23505 = unique_violation. Other errors throw.
        const msg = error.message ?? "";
        const code = (error as { code?: string }).code;
        const isCollision =
          code === "23505" || /duplicate key value|events_slug_uk/i.test(msg);
        if (!isCollision) throw new Error(msg || "Publish failed");

        // continue loop; try the next suffix
      }

      throw new Error(
        `Could not generate a unique slug after ${SLUG_MAX_RETRIES} tries — try a different event name.`,
      );
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["event-draft", vars.draftId] });
    },
  });
}
