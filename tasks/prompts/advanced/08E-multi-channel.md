# Epic 8: Multi-Channel (WhatsApp) — index

> **Diagrams:** MERM-04 (chat flow), MERM-07 (agent architecture)  
> **Phase:** ADVANCED | **Outcome:** O5  
> **Hypothesis:** WhatsApp integration captures leads from non-web users, converting >=10%.

---

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | E8 multi-channel index: order and gates for WA v2 + OpenClaw. |
| **Workflow** | Use this file to sequence; don’t start 08B until ADRs closed. |
| **Proof** | Checklist: 08F + 08K + 05M green. |
| **Gates** | Conflicts with CORE 08L bridge resolved in planning. |
| **Rollout** | Roadmap only until gates green. |

---

## Subtasks (IDs map to E8-001…E8-004)

Lettered files **skip `08E`** in the basename so the epic index stays the only `08E-*.md` file (same pattern as [`05E`](05E-agent-infrastructure.md), [`07E`](07E-contract-automation.md)).

| ID | Was | File | Status |
|----|-----|------|--------|
| **08A** | E8-001 | [`08A-infobip-whatsapp-webhook.md`](08A-infobip-whatsapp-webhook.md) | Open |
| **08B** | E8-002 | [`08B-openclaw-whatsapp-adapter.md`](08B-openclaw-whatsapp-adapter.md) | Open |
| **08C** | E8-003 | [`08C-wa-lead-capture.md`](08C-wa-lead-capture.md) | Open |
| **08D** | E8-004 | [`08D-human-handover-escalation.md`](08D-human-handover-escalation.md) | Open |
| **08F** | E8-005 | [`08F-whatsapp-ingress-architecture.md`](08F-whatsapp-ingress-architecture.md) | Open |
| **08G** | E8-006 | [`08G-openclaw-correlation-observability.md`](08G-openclaw-correlation-observability.md) | Open |
| **08H** | E8-007 | [`08H-openclaw-wa-adapter-phase1.md`](08H-openclaw-wa-adapter-phase1.md) | Open |
| **08I** | E8-008 | [`08I-openclaw-mde-skills.md`](08I-openclaw-mde-skills.md) | Open |
| **08J** | E8-009 | [`08J-lobster-workflows-spike.md`](08J-lobster-workflows-spike.md) | Open |
| **08K** | E8-010 | [`08K-openclaw-provider-strategy.md`](08K-openclaw-provider-strategy.md) | Open |

**Audit (gaps → prompts):** [`tasks/audit/04-openclaw.md`](../audit/04-openclaw.md)

**Dependencies:** **08F** / **08K** first (architecture + provider — **no code blockers**). **[`05M-openclaw-gateway-health-stub.md`](05M-openclaw-gateway-health-stub.md)** (E5-012) before public WA. **08B** requires **[`05H-openclaw-gateway-adapter.md`](05H-openclaw-gateway-adapter.md)** (E5-007) + **08A** + **08F**; complete **[`08H`](08H-openclaw-wa-adapter-phase1.md)** before claiming full **08B**. **08G** with **08A**. **08C** requires **E2-001** (lead pipeline) + **08B**. **08D** requires **08B**. **08I** after **08H**. **08J** P3 after **08H**.

**Suggested order:** **08F** + **08K** → **08A** → **05M** → **05H** → **08H** → **08B** → **08G** (parallel) → **08C** & **08D** → **08I** → **08J** (optional).

---

## Verification

Infobip webhook + OpenClaw routing smoke tests; lead rows with `source: 'whatsapp'`; escalation path when confidence is below 0.3.
