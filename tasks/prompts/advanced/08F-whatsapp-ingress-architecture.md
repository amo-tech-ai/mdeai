---
id: 08F
diagram_id: MERM-04
prd_section: "8. Multi-channel — WhatsApp"
title: WhatsApp ingress architecture — Infobip vs OpenClaw (single primary path)
skills:
  - openclaw
  - mdeai-tasks
epic: E8
phase: ADVANCED
priority: P1
status: Open
owner: Backend
dependencies: []
estimated_effort: S
percent_complete: 0
outcome: O5
---

# E8-005: WhatsApp ingress — architecture decision (one primary brain)

> **Why:** [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md) — **Infobip Cloud API** and **OpenClaw WhatsApp (Baileys)** are different stacks; **E8 must state one** primary ingress or a **bridge spec** to avoid double-send / lost replies.  
> **Epic index:** [`08E-multi-channel.md`](08E-multi-channel.md)

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Ingress ADR picks Infobip vs Baileys with security and ops implications documented. |
| **Workflow** | Compare options → decide → update 08B/08E. |
| **Proof** | Signed webhook story defined for chosen path. |
| **Gates** | Blocks 08B implementation detail. |
| **Rollout** | Doc + review meeting. |

---

## Prompt

**Choose and document** one of:

| Option | Pattern |
|--------|---------|
| **A — Infobip primary** | [`08A`](08A-infobip-whatsapp-webhook.md) webhook → Supabase edge → **forward** to OpenClaw Gateway HTTP/WS → reply → Infobip outbound. OpenClaw = **routing + tools**, not duplicate WA receiver. |
| **B — OpenClaw owns Baileys** | OpenClaw channel receives WA; Infobip deprioritized or legacy-only; document migration. |
| **C — Infobip-only (no OpenClaw)** | Edge + `ai-chat` only — then **defer** [`05H`](05H-openclaw-gateway-adapter.md) / [`08B`](08B-openclaw-whatsapp-adapter.md) until product revisits. |

**Deliverable:** `tasks/openclaw/ingress-architecture.md` (or section in `AGENTS.md`) with **sequence diagram** (MERM-04 update): single orchestrator per channel, **no** two bots on one number.

**Latency:** If chain is webhook → OpenClaw → edge → back, note **&lt;5s first response** requirement from PRD and caching/streaming plan.

## Acceptance criteria

- [ ] Written decision **A / B / C** with owner sign-off date.
- [ ] **08A** / **08B** prompts updated to reference this doc (no contradictory assumptions).
- [ ] **Pairing + allowlist** called out before marketing WA number (**audit P0**).

## References

- [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md) § Key Problems (Infobip vs OpenClaw), § Improvements (1)
- [OpenClaw WhatsApp channel](https://docs.openclaw.ai/channels/whatsapp)
