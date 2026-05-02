---
id: 08H
diagram_id: MERM-04
prd_section: "8. Multi-channel — OpenClaw"
title: OpenClaw WhatsApp adapter — Phase 1 (echo + allowlist, no full AI chain)
skills:
  - openclaw
  - mdeai-tasks
epic: E8
phase: ADVANCED
priority: P1
status: Open
owner: Backend
dependencies:
  - E8-005
  - E8-001
estimated_effort: M
percent_complete: 0
outcome: O5
---

# E8-007: OpenClaw WhatsApp adapter — Phase 1 (vertical slice)

> **Why:** [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md) — **E8-002** bundles transport + AI + i18n; need **demoable checkpoints**. Phase 1 proves **one** path works before **ai-router → ai-chat**.  
> **Full scope:** [`08B-openclaw-whatsapp-adapter.md`](08B-openclaw-whatsapp-adapter.md).

## Prompt

Per **audit Improvement (5)** decomposition:

| Phase | Scope |
|-------|--------|
| **1 (this prompt)** | Inbound text → OpenClaw (per **08F** ingress) → **echo** or static ack → outbound to **allowlisted** numbers only; **pairing** enforced. |
| **2** | Intent routing to `ai-router` / structured lead extract |
| **3** | Rich messages / carousel if product requires |
| **4** | Paperclip delegation / approvals |

**Security:** No public blast until **`openclaw security audit`** + allowlist (**05M**).

## Acceptance criteria

- [ ] **08F** architecture doc exists and this phase matches chosen ingress.
- [ ] End-to-end: test message → visible reply on allowlisted WA; **no** duplicate bot on same number.
- [ ] Documented **rollback** if Gateway down (**05M** runbook).
- [ ] **08B** remains open until Phases 2–4 complete; checklist in **08B** references this file.

## References

- [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md) § Improvements (5), § Task Strategy
- [`05M-openclaw-gateway-health-stub.md`](05M-openclaw-gateway-health-stub.md)
