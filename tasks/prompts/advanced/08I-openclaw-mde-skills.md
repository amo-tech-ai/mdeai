---
id: 08I
diagram_id: MERM-07
prd_section: "8. Multi-channel — Skills"
title: OpenClaw workspace skills — mde rental concierge (tone, legal, handoff)
skills:
  - openclaw
  - mdeai-tasks
epic: E8
phase: ADVANCED
priority: P2
status: Open
owner: Backend
dependencies:
  - E8-007
estimated_effort: S
percent_complete: 0
outcome: O5
---

# E8-008: mde OpenClaw / ClawHub skills pack

> **Why:** [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md) — no **mde-specific** skills in OpenClaw workspace; add minimal **`SKILL.md`** for rental concierge.  
> **Epic index:** [`08E-multi-channel.md`](08E-multi-channel.md)

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | mde domain skills in OpenClaw match product language (rentals, neighborhoods). |
| **Workflow** | Author skills → load in gateway → test prompts. |
| **Proof** | Skill responses grounded in DB or say unknown. |
| **Gates** | Version skills with git tag. |
| **Rollout** | Staging gateway. |

---

## Prompt

Add a **versioned** skill pack (repo path e.g. `.claude/skills/mde-openclaw-rentals/` or `tasks/openclaw/skills/`) with:

1. **Domain:** Medellín neighborhoods naming, furnished / medium-term vocabulary, COP vs USD caution.
2. **Forbidden claims:** No legal advice, no guaranteed visa outcomes, no “official” government statements without source.
3. **Handoff:** When to escalate to human (low confidence &lt;0.3 aligns **08D**), payout/legal keywords.
4. **Tools:** Prefer **Supabase edge** invocations for listing data — **listing IDs** from DB, not hallucinated addresses.
5. **Bilingual:** Default Spanish-first for WA Colombia; English when user uses English.

**ClawHub:** Optional pin list in `tasks/openclaw/links.md` for approved third-party skills (Brave, browser) per product policy.

## Acceptance criteria

- [ ] At least one **`SKILL.md`** merged with frontmatter and trigger phrases.
- [ ] Linked from **`tasks/openclaw/links.md`**.
- [ ] **08B** / OpenClaw workspace config references this skill in setup notes.

## References

- [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md) § Core Usage (Skills), § Improvements (4)
- [`11B-real-estate-search-llm-prompts.md`](11B-real-estate-search-llm-prompts.md) — safety add-on (consistency)
