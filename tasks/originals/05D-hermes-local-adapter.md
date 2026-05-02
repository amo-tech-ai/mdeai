---
id: 05D
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Adapter layer"
title: Wire hermes_local adapter to Hermes CLI
skills:
  - paperclip
  - hermes
  - mdeai-tasks
epic: E5
phase: MVP
priority: P1
status: Open
owner: Backend
dependencies:
  - E5-003
estimated_effort: M
percent_complete: 0
outcome: O3
---

# E5-004: Wire hermes_local Adapter

```yaml
---
id: E5-004
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Adapter layer"
title: Wire hermes_local adapter to Hermes CLI
skill: agent-config
phase: MVP
priority: P1
status: Open
owner: Backend
dependencies:
  - E5-003
estimated_effort: M
percent_complete: 0
epic: E5
outcome: O3
---
```

### Prompt

Implement the `hermes_local` adapter that allows Paperclip agents to delegate reasoning tasks to the Hermes CLI.

**Epic index:** [`05E-agent-infrastructure.md`](05E-agent-infrastructure.md)

**Depends on:** [`05C-hermes-config-instructions-timeout.md`](05C-hermes-config-instructions-timeout.md)

**Read first:**
- `tasks/mermaid/07-agent-architecture.mmd` — hermes_local: spawns `hermes chat -q`, instructionsFilePath, timeout 30s
- `.claude/skills/paper-clip/` — Paperclip adapter pattern
- `.claude/skills/hermes/` — Hermes CLI usage

**The build:**
- Create `hermes_local` adapter in Paperclip company configuration
- Adapter spawns `hermes chat -q "{query}"` as a child process
- Parse Hermes CLI output (stdout) and return structured result
- Handle timeout (30s) — kill process if exceeded, return timeout error
- Handle Hermes not installed (return graceful error, not crash)
- Log all Hermes invocations to `agent_audit_log` table via edge function

**Example:**
CEO delegates "Rank these 5 apartments for Marcus's preferences" to hermes_local. The adapter spawns `hermes chat -q "Rank apartments [42, 56, 78, 91, 103] for: budget 3-5M COP, Laureles preferred, needs wifi >50mbps"`. Hermes returns a ranked list with scores. The adapter parses the output and returns it to the CEO agent.

### Acceptance Criteria
- [ ] hermes_local adapter registered in Paperclip company config
- [ ] Spawns `hermes chat -q` with the delegated query
- [ ] Returns parsed response to the calling agent
- [ ] 30-second timeout with graceful error on exceeded
- [ ] Handles Hermes not installed or not responding
- [ ] Logs invocations (query, duration, success/failure)
- [ ] Works from Paperclip's heartbeat cycle
