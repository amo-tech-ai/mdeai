---
id: 05M
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Adapter layer"
title: OpenClaw Gateway — health check, idempotency stub & security audit ACs
skills:
  - openclaw
  - paperclip
  - mdeai-tasks
epic: E5
phase: MVP
priority: P1
status: Open
owner: Backend
dependencies:
  - E5-001
  - E5-002
estimated_effort: S
percent_complete: 0
outcome: O8
---

# E5-012: OpenClaw Gateway health stub (before full `openclaw_gateway`)

> **Why:** [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md) — ship **E5-007** capability in a **small vertical slice**: health + idempotency + **security audit** before claiming production; avoid example payloads that are not protocol-compliant.  
> **Full adapter:** [`05H-openclaw-gateway-adapter.md`](05H-openclaw-gateway-adapter.md).

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Gateway health stub enables safe 05H rollout and monitoring. |
| **Workflow** | Health endpoint → alert on fail → runbook link. |
| **Proof** | Load balancer / cron sees 200. |
| **Gates** | Secrets not in response body. |
| **Rollout** | Deploy before increasing OpenClaw traffic. |

---

## Prompt

1. **Health / readiness** — Document and automate checks: `openclaw doctor`, `gateway` status (or HTTP health endpoint per [OpenClaw Gateway](https://docs.openclaw.ai/gateway)), and **rollback** if Gateway unhealthy (runbook section in `tasks/openclaw/links.md` or new `tasks/openclaw/runbook.md`).

2. **Idempotency** — Any `message send` / RPC from Paperclip → OpenClaw carries **`Idempotency-Key`** (or documented equivalent) so retries do not double-send ([architecture](https://docs.openclaw.ai/concepts/architecture)).

3. **Security audit gate** — **Before** public WhatsApp or wide allowlists: `openclaw security audit` in CI or release checklist; DM pairing / allowlists per [channels](https://docs.openclaw.ai/channels).

4. **Protocol** — Replace placeholder `{ channel, recipient_id, message }` examples with references to **OpenAPI / WS contract** from official docs (link in runbook).

## Acceptance criteria

- [ ] Runbook lists **doctor + gateway status + probe** commands with expected OK output.
- [ ] **05H** / adapter code paths document idempotency key behavior.
- [ ] Release checklist includes **`openclaw security audit`** before enabling inbound WA from unknown numbers.
- [ ] Links to official Gateway docs added to **`tasks/openclaw/links.md`**.

## References

- [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md) § Improvements (2), § Key Problems (operational closure)
- [`08F-whatsapp-ingress-architecture.md`](08F-whatsapp-ingress-architecture.md) — must align with chosen ingress
