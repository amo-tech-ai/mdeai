---
id: 08J
diagram_id: MERM-04
prd_section: "8. Multi-channel — Workflows"
title: Lobster workflows — spike (lead.qualify, showing.book, gated flows)
skills:
  - openclaw
  - mdeai-tasks
epic: E8
phase: ADVANCED
priority: P3
status: Open
owner: Backend
dependencies:
  - E8-007
estimated_effort: M
percent_complete: 0
outcome: O5
---

# E8-009: Lobster (OpenClaw) — workflow spike

> **Why:** [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md) — **Lobster** not referenced in prompts; **typed, resumable, human-gated** flows suit money/legal steps better than ad-hoc chat.  
> **Not** a commitment to ship Lobster in MVP — **spike** only.

## Prompt

1. Read [Lobster](https://github.com/openclaw/lobster) + [docs](https://docs.openclaw.ai/tools/lobster) and map **one** workflow to mde: e.g. **`lead.qualify`** (audit table) — inbound → structured prefs → `lead` row → human gate if stuck.

2. Document **go / no-go**: effort vs Hand-rolled edge state machine; dependency on Gateway stability (**05M**).

3. **Payments:** Stripe / Supabase remain SoT; Lobster **never** auto-commits money without Paperclip gate (**05G** / **05L**).

## Acceptance criteria

- [ ] Spike doc in `tasks/openclaw/lobster-spike.md` with recommendation and **out of scope** for MVP.
- [ ] **08E** index links this file under “Future / P3”.

## References

- [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md) § Lobster Workflows, § Key Problems (No Lobster)
