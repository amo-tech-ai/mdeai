---
id: 05B
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Paperclip"
title: Bind Paperclip workspace to /home/sk/mde
skills:
  - paperclip
  - mdeai-tasks
epic: E5
phase: MVP
priority: P0
status: Open
owner: Backend
dependencies: []
estimated_effort: S
percent_complete: 0
outcome: O7
---

# E5-002: Bind Paperclip Workspace

```yaml
---
id: E5-002
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Paperclip"
title: Bind Paperclip workspace to /home/sk/mde
skill: agent-config
phase: MVP
priority: P0
status: Open
owner: Backend
dependencies: []
estimated_effort: S
percent_complete: 0
epic: E5
outcome: O7
---
```

### Prompt

Configure the Paperclip company to use `/home/sk/mde` as its workspace root, so agents can read project files and execute within the correct context.

**Epic index:** [`05E-agent-infrastructure.md`](05E-agent-infrastructure.md)

**Read first:**
- `.claude/skills/paper-clip/` — Paperclip configuration reference
- Paperclip documentation on company/workspace binding
- `tasks/mermaid/07-agent-architecture.mmd` — company name: `mde`

**The build:**
- Set Paperclip company workspace path to `/home/sk/mde`
- Verify company name is `mde`
- Ensure 4 agent slots: CEO, CMO, CTO, OpsManager
- Configure port `:3102` for Paperclip server
- Verify agents can access Supabase edge functions from workspace context

### Acceptance Criteria
- [ ] Paperclip company `mde` is bound to `/home/sk/mde`
- [ ] 4 agents configured: CEO, CMO, CTO, OpsManager
- [ ] Paperclip server runs on `:3102`
- [ ] Agents can read project files within workspace
- [ ] `pnpm dev` or `pnpm start` starts the Paperclip server without errors
