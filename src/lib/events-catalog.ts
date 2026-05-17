/** Statuses visible on public discover/detail routes (must match events_public_select_published RLS). */
export const PUBLIC_EVENT_STATUSES = ["published", "live"] as const;

export type PublicEventStatus = (typeof PUBLIC_EVENT_STATUSES)[number];

export function isPublicEventStatus(status: string): status is PublicEventStatus {
  return (PUBLIC_EVENT_STATUSES as readonly string[]).includes(status);
}
