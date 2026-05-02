---
id: 05C
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Hermes"
title: Set Hermes instructionsFilePath + timeout=30s
skills:
  - hermes
  - mdeai-tasks
epic: E5
phase: MVP
priority: P0
status: Open
owner: Backend
dependencies: []
estimated_effort: S
percent_complete: 0
outcome: O3
---

# E5-003: Set Hermes Configuration

```yaml
---
id: E5-003
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Hermes"
title: Set Hermes instructionsFilePath + timeout=30s
skill: agent-config
phase: MVP
priority: P0
status: Open
owner: Backend
dependencies: []
estimated_effort: S
percent_complete: 0
epic: E5
outcome: O3
---
```

### Prompt

Configure the Hermes agent with proper instructions file path and timeout settings for mdeai use cases.

**Epic index:** [`05E-agent-infrastructure.md`](05E-agent-infrastructure.md) · Notes: [`tasks/notes/02-hermes-notes.md`](../notes/02-hermes-notes.md)

**Read first:**
- `tasks/mermaid/07-agent-architecture.mmd` — Hermes: Claude via OpenRouter, 637 skills, instructionsFilePath
- `.claude/skills/hermes/` — Hermes skill reference
- `~/.hermes/` — existing Hermes config directory

**The build:**
- Set `instructionsFilePath` to point at an mdeai-specific instructions markdown file
- Create the instructions file with context about mdeai: rental marketplace, Medellin, composite ranking, lease analysis
- Set execution timeout to 30 seconds
- Configure model: Claude via OpenRouter (verify `OPENROUTER_API_KEY` exists)
- Verify Hermes CLI responds: `hermes chat -q "test"`

**Design:**
The instructions file should give Hermes context about:
- mdeai is a rental marketplace for Medellin, Colombia
- It handles apartment ranking, lease review, market intelligence, taste profiles
- Data lives in Supabase PostgreSQL (via edge functions, not direct DB access)
- Hermes is spawned by Paperclip's hermes_local adapter per heartbeat

### Acceptance Criteria
- [ ] Hermes config has `instructionsFilePath` pointing to an existing file
- [ ] Instructions file provides mdeai context
- [ ] Timeout set to 30 seconds
- [ ] Model configured for Claude via OpenRouter
- [ ] `hermes chat -q "What is mdeai?"` returns a contextual response
- [ ] Config is idempotent (running setup twice doesn't break anything)

**Next:** [`05D-hermes-local-adapter.md`](05D-hermes-local-adapter.md) (depends on this task).

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Hermes config loads with timeouts so agents don’t hang silently. |
| **Workflow** | Config file location + health check → document models. |
| **Proof** | CLI returns within timeout; errors surface to Paperclip. |
| **Gates** | API keys via env; not committed. |
| **Rollout** | Dev machines first. |

---

