import { z } from "zod";

/**
 * Phase 1 events MVP — wizard schema + types.
 *
 * Source of truth: tasks/events/prompts/002-host-event-new-wizard.md
 * Backed by:       supabase/migrations/20260503011925_event_phase1.sql
 *                  (events, event_venues, event_tickets)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Basics
// ─────────────────────────────────────────────────────────────────────────────

export const eventBasicsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Event name needs at least 3 characters")
      .max(120, "Keep it under 120 characters"),
    description: z
      .string()
      .trim()
      .max(2000, "Description max is 2,000 characters")
      .optional()
      .or(z.literal("")),
    event_type: z.enum([
      "pageant",
      "concert",
      "workshop",
      "networking",
      "fashion_show",
      "festival",
      "other",
    ]),
    event_start_time: z.string().min(1, "Pick a start date + time"),
    event_end_time: z.string().min(1, "Pick an end date + time"),
    timezone: z.string().default("America/Bogota"),
    venue_id: z.string().uuid().nullable().optional(),
    address: z
      .string()
      .trim()
      .min(5, "Add a venue address (10+ chars)")
      .max(300, "Address max is 300 characters"),
    city: z
      .string()
      .trim()
      .min(2, "City required")
      .max(80)
      .default("Medellín"),
    website: z
      .string()
      .url("Use a full URL — https://...")
      .optional()
      .or(z.literal("")),
    age_restriction: z
      .enum(["", "13+", "16+", "18+", "21+"])
      .optional()
      .default(""),
    primary_image_url: z.string().url().optional().or(z.literal("")),
  })
  .refine(
    (v) => new Date(v.event_end_time) > new Date(v.event_start_time),
    { path: ["event_end_time"], message: "End time must be after start time" },
  );

export type EventBasicsInput = z.infer<typeof eventBasicsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Tickets
// ─────────────────────────────────────────────────────────────────────────────

export const ticketTierSchema = z.object({
  // Optional id: present for tickets that round-trip through draft autosave
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(2, "Tier name needs 2+ chars")
    .max(60, "Tier name max 60"),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  // COP cents — keep as int.
  price_cents: z
    .number()
    .int("Price must be a whole number of cents")
    .min(0, "Price cannot be negative")
    .max(100_000_000, "Price cents must be ≤ 100,000,000 (≈$1M COP)"),
  qty_total: z
    .number()
    .int()
    .min(1, "At least 1 seat per tier")
    .max(100_000, "Max 100,000 seats per tier"),
  is_active: z.boolean().default(true),
  position: z.number().int().min(0).default(0),
  min_per_order: z.number().int().min(1).max(50).default(1),
  max_per_order: z.number().int().min(1).max(50).default(10),
});

export type TicketTierInput = z.infer<typeof ticketTierSchema>;

export const ticketsStepSchema = z
  .object({
    tickets: z
      .array(ticketTierSchema)
      .min(1, "Add at least one ticket tier to publish")
      .max(5, "Phase 1 supports up to 5 tiers — Phase 2 adds more"),
  })
  .refine(
    (v) => v.tickets.every((t) => t.max_per_order >= t.min_per_order),
    { path: ["tickets"], message: "max_per_order must be ≥ min_per_order on every tier" },
  );

export type TicketsStepInput = z.infer<typeof ticketsStepSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Combined draft + step transitions
// ─────────────────────────────────────────────────────────────────────────────

export type WizardStep = 1 | 2 | 3 | 4;

export const STEP_LABELS: Record<WizardStep, string> = {
  1: "Basics",
  2: "Tickets",
  3: "Review",
  4: "Publish",
};

export interface EventDraft {
  id: string | null; // null until first save
  basics: Partial<EventBasicsInput>;
  tickets: TicketTierInput[];
}

/** Slug generator — strip accents, replace spaces with `-`, max 80 chars. */
export function generateSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
