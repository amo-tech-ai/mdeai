# Epic 5: Agent Infrastructure — index

> **Diagrams:** MERM-07 (agent architecture), MERM-02 (system architecture)  
> **Phase:** MVP | **Outcomes:** O3, O6, O7, O8  
> **Hypothesis:** Fixing agent configuration enables automated ops and intelligent ranking.

---

## Gemini (G1–G5) for agent-spawned AI

When Paperclip delegates to Hermes or agents call edge functions that invoke Gemini, the **G1–G5** rules apply (see `02E-lead-to-lease-pipeline.md` header). For this epic, emphasize **G4** (`x-goog-api-key`) and **G5** (grounding citations in `ai_runs` / `agent_audit_log`).

---

## Subtasks (IDs map to former E5-00x)

Lettered files **skip `05E`** in the basename so the epic index stays the only `05E-*.md` file (same pattern as [`06E`](06E-hermes-intelligence.md) vs `06A`–`06D`, `06F`).

| ID | Was | File | Status |
|----|-----|------|--------|
| **05A** | E5-001 | [`05A-paperclip-ceo-instructions.md`](05A-paperclip-ceo-instructions.md) | Open |
| **05B** | E5-002 | [`05B-paperclip-workspace-bind.md`](05B-paperclip-workspace-bind.md) | Open |
| **05C** | E5-003 | [`05C-hermes-config-instructions-timeout.md`](05C-hermes-config-instructions-timeout.md) | Open |
| **05D** | E5-004 | [`05D-hermes-local-adapter.md`](05D-hermes-local-adapter.md) | Open |
| **05F** | E5-005 | [`05F-paperclip-heartbeat-schedule.md`](05F-paperclip-heartbeat-schedule.md) | Open |
| **05G** | E5-006 | [`05G-approval-gates.md`](05G-approval-gates.md) | Open |
| **05H** | E5-007 | [`05H-openclaw-gateway-adapter.md`](05H-openclaw-gateway-adapter.md) | Open |
| **05I** | E5-008 | [`05I-paperclip-api-lifecycle.md`](05I-paperclip-api-lifecycle.md) | Open |
| **05J** | E5-009 | [`05J-paperclip-goals-sync.md`](05J-paperclip-goals-sync.md) | Open |
| **05K** | E5-010 | [`05K-paperclip-agent-audit-log-ordering.md`](05K-paperclip-agent-audit-log-ordering.md) | Open |
| **05L** | E5-011 | [`05L-paperclip-approval-gates-phase1.md`](05L-paperclip-approval-gates-phase1.md) | Open |
| **05M** | E5-012 | [`05M-openclaw-gateway-health-stub.md`](05M-openclaw-gateway-health-stub.md) | Open |
| **05N** | E5-008 | [`05N-paperclip-ceo-human-escalation.md`](05N-paperclip-ceo-human-escalation.md) | Open |

**Audit (gaps → prompts):** [`tasks/audit/03-paperclip..md`](../audit/03-paperclip..md) · OpenClaw: [`tasks/audit/04-openclaw.md`](../audit/04-openclaw.md)

**Suggested order:** **05A** → **05B** → **05N** (CEO escalation — can parallel after 05A draft) → **05C** → **05K** (audit log path — unblocks gates/adapters) → **05I** (API hygiene) → **05D** (05D depends on 05C) → **05F** (depends on 05A) → **05L** (Phase 1 gate slice) → **05G** (full G1–G7 when ready) → **05J** (goals/sync — can parallelize after 05A) → **05M** (OpenClaw health/idempotency — before **05H** prod) → **05H** (OpenClaw gateway adapter; see **[`08E-multi-channel.md`](08E-multi-channel.md)**).

---

## Verification

Paperclip + Hermes smoke tests per subtask; cross-check [`tasks/notes/02-hermes-notes.md`](../notes/02-hermes-notes.md) for CLI vs product boundaries.
