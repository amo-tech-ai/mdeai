---
id: 12C
diagram_id: MERM-07
prd_section: "Cross-cutting — AI routing"
title: AI routing feature flags — Gemini edge vs Hermes vs OpenClaw per channel
skills:
  - mdeai-tasks
epic: cross-cutting
phase: MVP
priority: P1
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
outcome: O10
---

# Trio AI routing & feature flags

> **Why:** [`tasks/audit/05-trio-agents.md`](../../audit/05-trio-agents.md) § Architecture Assessment — **three brains** risk without **single routing rule** per channel; Appendix A #6 **feature flag** “user chat brain = Gemini edge only” until explicitly routed.  
> **Related:** **[`08K-openclaw-provider-strategy.md`](08K-openclaw-provider-strategy.md)** (OpenClaw vs edge providers).

## Prompt

1. **Define flags** (env or remote config — align **09E** if needed):

   | Flag (example) | Behavior when OFF | When ON |
   |----------------|-------------------|---------|
   | `VITE_AI_USER_BRAIN=gemini-edge` | (default) All user web chat via Supabase edges only | — |
   | `OPENCLAW_ROUTES_REASONING` | OpenClaw transport-only; no local LLM for prod WA | Hermes/OpenClaw model participates (must match **08K** decision) |

2. **Per channel matrix** — document in `integration-contract` (**12A**) or here:

   | Channel | Primary brain | Escalation |
   |---------|----------------|------------|
   | Web `/explore` | Gemini edge | — |
   | WhatsApp | Per **08F** / **08K** | Human handover **08D** |

3. **Kill switch:** If Hermes or OpenClaw **misbehaves**, flag forces **edge-only** replies or **static** message + human queue.

4. **Vertical priority (Appendix A #10):** One paragraph in [`tasks/roadmap.md`](../../roadmap.md) or **CLAUDE.md** — **rental / CRM** vs **coffee/Shopify** focus for the next sprint (avoid split focus if team is small).

## Acceptance criteria

- [ ] Flags (or equivalent config) named and default-safe for production (edge-only user path).
- [ ] **08B** / **08K** cross-link this prompt; no channel **double-answers** without explicit hybrid design.
- [ ] Roadmap or CLAUDE notes **vertical priority** for the current phase.

## References

- [`tasks/audit/05-trio-agents.md`](../../audit/05-trio-agents.md) § Improvements (6), Appendix A #8, #10
- [`11A-real-estate-search-stack.md`](11A-real-estate-search-stack.md)
