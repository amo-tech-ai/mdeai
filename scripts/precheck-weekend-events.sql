-- precheck-summer-events.sql
--
-- Confirms the events table has ≥1 published row in the May–Sep 2026 window
-- BEFORE running the MASTRA-038 / MASTRA-039 smoke. If this returns zero rows,
-- do NOT run the smoke — the AI will return empty results and the test will
-- fail for "no data", not a real Mastra fault.
--
-- Run (read-only):
--   supabase db query --linked -f scripts/precheck-weekend-events.sql
--
-- Expected: ≥1 row. Key fields: name, local_start, city, status.

select
  e.id,
  e.name,
  e.event_start_time                                         as starts_at_utc,
  e.event_start_time at time zone 'America/Bogota'          as local_start,
  e.city,
  e.address,
  e.ticket_price_min,
  e.currency,
  e.status
from public.events e
where e.status = 'published'
  and e.is_active = true
  and e.event_start_time >= now()
  and e.event_start_time <= '2026-09-30 23:59:59 America/Bogota'::timestamptz
order by e.event_start_time asc
limit 15;
