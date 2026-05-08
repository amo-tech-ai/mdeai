-- Applied via MCP on 2026-05-08; captured as local file.
-- Registers hermes (researcher), openclaw (operations), postiz (marketing)
-- Roles constrained to: CEO | CTO | marketing | operations | researcher
INSERT INTO paperclip.agent_registrations
  (id, name, role, monthly_budget_cents, bypass_approvals, heartbeat_required)
VALUES
  ('a6e00001-0000-0000-0000-000000000001', 'hermes',   'researcher', 500000, false, true),
  ('a6e00001-0000-0000-0000-000000000002', 'openclaw', 'operations', 200000, false, true),
  ('a6e00001-0000-0000-0000-000000000003', 'postiz',   'marketing',  200000, false, true)
ON CONFLICT (id) DO NOTHING;
