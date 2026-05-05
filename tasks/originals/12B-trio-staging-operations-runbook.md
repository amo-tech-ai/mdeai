---
id: 12B
diagram_id: MERM-02
prd_section: "Cross-cutting — Operations"
title: Staging & agent operations runbook (Paperclip · OpenClaw · Gateway)
skills:
  - openclaw
  - paperclip
  - mdeai-tasks
epic: cross-cutting
phase: Reference
priority: P2
status: Open
owner: Backend
dependencies: []
estimated_effort: S
percent_complete: 0
outcome: O9
---

# Staging & trio operations runbook

> **Why:** [`tasks/audit/05-trio-agents.md`](../../audit/05-trio-agents.md) Appendix A #7 — **one** runbook for ports **3102**, Gateway bind, Paperclip auth, OpenClaw pairing, on-call.  
> **Prerequisite:** **[`05M-openclaw-gateway-health-stub.md`](05M-openclaw-gateway-health-stub.md)** (doctor / security audit).

## Prompt

Add **`tasks/openclaw/runbook.md`** and/or **`tasks/paperclip/staging-runbook.md`** (or a single **`tasks/operations/trio-staging.md`**) covering:

| Topic | Include |
|-------|---------|
| **Paperclip** | Default port `:3102`, CEO/workspace health, where auth tokens live (not in repo) |
| **OpenClaw Gateway** | Bind address, `openclaw doctor`, rollback if Gateway unhealthy (**05M**) |
| **Infobip / WA** | Link **08F** ADR; probe commands; **no** prod blast without allowlist |
| **Supabase** | `supabase link`, `db push`, **never** prod from unreviewed migrations |
| **On-call** | Who to page if CEO broken vs Gateway down vs edge 5xx |

**Extend** [`tasks/paperclip/links.md`](../../paperclip/links.md) and [`tasks/openclaw/links.md`](../../openclaw/links.md) per Appendix A #12 — adapters, CLI, OpenAPI, heartbeat protocol URLs (**03-paperclip** audit).

## Acceptance criteria

- [ ] Runbook exists; **new dev** can bring up Paperclip + OpenClaw **local smoke** using only this doc + CLAUDE.
- [ ] **`tasks/openclaw/links.md`** (or paperclip) lists **heartbeat-protocol** + **OpenAPI** canonical links if not already present.

## References

- [`tasks/audit/05-trio-agents.md`](../../audit/05-trio-agents.md) Appendix A #7, #12
- [`tasks/audit/03-paperclip..md`](../03-paperclip..md) Appendix links gaps
