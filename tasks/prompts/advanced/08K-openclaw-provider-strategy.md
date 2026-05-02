---
id: 08K
diagram_id: MERM-04
prd_section: "8. Multi-channel — AI providers"
title: OpenClaw vs Supabase Gemini — provider strategy (single orchestrator)
skills:
  - openclaw
  - gemini
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

# E8-010: AI provider strategy — avoid dual replies (edge vs OpenClaw)

> **Why:** [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md) — **split brain:** app AI = **Gemini via Supabase edges**; OpenClaw has **its own** provider config; **E8-002** “OpenClaw → ai-router → ai-chat” needs explicit **routing rules** to avoid duplicate/contradictory answers.  
> **Related:** [`11A-real-estate-search-stack.md`](11A-real-estate-search-stack.md) (Hermes vs search).

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Provider routing strategy (models, failover) is decided for WA AI. |
| **Workflow** | Options → pick → update 08B + cost model. |
| **Proof** | Failover tested; costs bounded. |
| **Gates** | Blocks full 08B. |
| **Rollout** | Doc sign-off. |

---

## Prompt

Document **one** primary pattern:

| Pattern | When |
|---------|------|
| **Transport-only** | OpenClaw = channels + session; **all** LLM calls go to **Supabase edge** (Gemini). OpenClaw tools = thin HTTP clients; **minimal** provider config in Gateway. |
| **Hybrid** | OpenClaw handles small talk; **edges** handle listing/ranking — requires **explicit** handoff rules in [`08B`](08B-openclaw-whatsapp-adapter.md). |

**Tools profile:** Prefer **messaging** / **minimal** tool sets per [OpenClaw tools](https://docs.openclaw.ai/tools) to reduce surprise `exec`.

## Acceptance criteria

- [ ] One paragraph in **`AGENTS.md`** or **`tasks/openclaw/provider-strategy.md`** states chosen pattern.
- [ ] **08B** updated to match (no two models answering the same user turn without design).

## References

- [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md) § Key Problems (split brain), § Improvements (7), § Recommended Architecture (2)
