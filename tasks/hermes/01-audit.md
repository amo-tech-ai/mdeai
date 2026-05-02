# Hermes + Paperclip Adapter — Audit

**Date:** 2026-04-05
**Hermes version:** v0.7.0 (2026.4.3)
**Adapter:** hermes-paperclip-adapter@0.2.1
**Paperclip:** running at http://127.0.0.1:3102
**Company:** mde (4 agents: CEO, CMO, CTO, OpsManager)

---

## Executive Summary

Hermes is installed and connected to Paperclip via the `hermes_local` built-in adapter. The adapter integration is **sound** — package installed, server/UI wired, model auto-detected. However the **runtime configuration has critical issues**: an exposed API key in plain text, timeout set to 0 (infinite), no `instructionsFilePath` visible, and the CEO agent still generates `curl | python3` commands that get blocked. The Hermes skill is serviceable but incomplete for real estate operations.

| Area | Score | Notes |
|------|-------|-------|
| Installation | 9/10 | Hermes + adapter fully installed and registered |
| Adapter wiring | 9/10 | Built-in adapter, all hooks (execute, skills, sessions, model detect) |
| Runtime config | 4/10 | Exposed key, 0 timeout, missing instructionsFilePath |
| Agent behavior | 3/10 | CEO uses curl\|python3, no workspace binding, empty queue loops |
| Real estate readiness | 2/10 | No RE-specific skills, no Supabase integration, no listing data |
| Skill quality | 6/10 | Good structure, missing adapter reference, stale snapshot |
| **Overall** | **5/10** | Plumbing works; config, behavior, and domain integration need work |

---

## 1. Installation Verification

### Hermes Agent (host)

```
Hermes Agent v0.7.0 (2026.4.3)
Project: /home/sk/.hermes/hermes-agent
Python: 3.11.15
OpenAI SDK: 2.30.0
Up to date
```

- **Location:** `~/.hermes/` (full directory tree present)
- **Install method:** Standalone installer (not pip — `pip list` shows no hermes packages)
- **Config:** `~/.hermes/config.yaml` — OpenRouter provider, `anthropic/claude-sonnet-4.6`
- **State:** SQLite at `~/.hermes/state.db` + WAL/SHM
- **Skills:** 24 categories in `~/.hermes/skills/`
- **Cron:** Empty (no scheduled jobs)
- **SOUL.md:** Present — personality/values manifesto (kawaii personality active)

### hermes-paperclip-adapter (npm)

- **Version:** 0.2.1 (installed at `node_modules/.pnpm/hermes-paperclip-adapter@0.2.1/`)
- **Declared in:** `paperclip/server/package.json` and `paperclip/ui/package.json` (`^0.2.0`)
- **Server imports:** execute, testEnvironment, sessionCodec, listSkills, syncSkills, detectModel
- **UI imports:** parseHermesStdoutLine, buildHermesConfig, SchemaConfigFields
- **Registration:** `hermes_local` in `BUILTIN_ADAPTER_TYPES` set — first-class built-in adapter

### Paperclip registration

The adapter is registered in `paperclip/server/src/adapters/registry.ts`:

```typescript
const hermesLocalAdapter: ServerAdapterModule = {
  type: "hermes_local",
  execute: hermesExecute,
  testEnvironment: hermesTestEnvironment,
  sessionCodec: hermesSessionCodec,
  listSkills: hermesListSkills,
  syncSkills: hermesSyncSkills,
  models: hermesModels,
  supportsLocalAgentJwt: true,
  agentConfigurationDoc: hermesAgentConfigurationDoc,
  detectModel: () => detectModelFromHermes(),
};
```

**Verdict:** Installation is complete and correct.

---

## 2. Adapter Configuration (from screenshot)

The Paperclip UI shows the CEO agent's adapter config:

| Field | Value | Assessment |
|-------|-------|------------|
| Adapter type | Hermes Agent | Correct |
| Command | `hermes` | Correct (finds CLI on PATH) |
| Model | `anthropic/claude-sonnet-4.6` | Correct for OpenRouter |
| Thinking effort | Auto | Fine |
| Extra args | (empty) | OK for now |
| OPENROUTER_API_KEY | `sk-or-v1-cf3caeef834e...` (Plain) | **CRITICAL — exposed, not sealed** |
| Timeout (sec) | 0 | **CRITICAL — means infinite; runaway risk** |
| Interrupt grace period | 15 | Fine |

### Issues found

#### P0: API key exposed in plain text

The OpenRouter API key is visible as a **Plain** environment variable in the Paperclip agent config UI. It should be **Sealed** (click the "Seal" button next to it). Additionally, this key is now visible in the screenshot shared in this conversation.

**Action:** Seal the key in Paperclip UI immediately. Consider rotating the key at https://openrouter.ai/settings/keys since it was exposed.

#### P0: Timeout set to 0

A timeout of 0 means the Hermes process can run indefinitely. If it gets stuck (model loops, tool hangs, network timeout), it will consume resources forever.

**Action:** Set to 300 (5 minutes) — the adapter default. For complex tasks, 600 max.

#### P1: No instructionsFilePath visible

The adapter config supports `instructionsFilePath` — an absolute path to a markdown file injected into the agent's system prompt. Without it, the agent has no project-specific instructions and falls back to whatever SOUL.md and default prompt provide.

**Action:** Set `instructionsFilePath` to `/home/sk/mde/AGENTS.md` (or create a dedicated file like `/home/sk/mde/agents/ceo-instructions.md` with the canonical CEO instructions from `tasks/paperclip/REFERENCE.md`). This is how you stop the CEO from using curl|python3.

#### P1: Duplicate key source

The `OPENROUTER_API_KEY` is set in **two places**:
1. `~/.hermes/.env` (Hermes config)
2. Paperclip agent config UI (per-agent env var)

The adapter injects the Paperclip-configured env var, which overrides the Hermes-native one. This is fine but should be documented to avoid confusion when debugging auth issues.

---

## 3. Hermes Config Analysis (`~/.hermes/config.yaml`)

| Setting | Value | Assessment |
|---------|-------|------------|
| Provider | openrouter | Correct — matches OPENROUTER_API_KEY |
| Model | anthropic/claude-sonnet-4.6 | Correct OpenRouter model ID |
| Max turns | 12 | Low for complex multi-step tasks; consider 20-30 for CEO |
| Compression | 0.7 threshold | Good — prevents context overflow |
| Personality | kawaii | **Misaligned** — a real estate business agent should not be kawaii |
| Session reset | Inactivity 60min + daily 4AM | Fine |
| Terminal timeout | 180s | Fine |
| Browser | local, 120s inactivity | Fine |
| Checkpoints | enabled (50 max) | Good |
| Memory | enabled, 2200 char profile | Good |
| TTS/STT | enabled | Unnecessary for headless agent runs; wastes resources |
| Image gen | disabled | Correct |
| Show cost | false | **Should be true** — need cost visibility for budget tracking |

### SOUL.md content

SOUL.md contains a generic personality manifesto ("be helpful, concise, earn trust through competence"). It does **not** contain:
- Any real estate domain knowledge
- Medellin-specific context
- mdeai.co product awareness
- Paperclip coordination rules

**Verdict:** SOUL.md is generic. Domain knowledge should go in `instructionsFilePath` (AGENTS.md), not SOUL.md — this is correct separation. But the kawaii personality is wrong for a business agent.

---

## 4. Hermes Skills Inventory

24 skill categories installed in `~/.hermes/skills/`:

```
apple, autonomous-ai-agents, creative, data-science, devops, diagramming,
dogfood, domain, email, feeds, gaming, gifs, github, inference-sh, leisure,
mcp, media, mlops, note-taking, openclaw-imports, productivity, red-teaming,
research, smart-home, social-media, software-development
```

**Missing for real estate:**
- No `real-estate` skill (property search, listing analysis, market data)
- No `supabase` skill (database queries, RLS-aware operations)
- No `shopify` skill (product/order management)
- No `mdeai` skill (project-specific workflows)
- No `paperclip` skill in Hermes (Paperclip coordination for Hermes side)

**Unnecessary for business agent:**
- `gaming`, `gifs`, `leisure`, `red-teaming`, `smart-home`, `social-media` — add noise, no business value

---

## 5. Environment Variables (`~/.hermes/.env`)

18 variables present (names only — values not exposed):

| Variable | Purpose | Assessment |
|----------|---------|------------|
| OPENROUTER_API_KEY | LLM provider auth | Required, present |
| FIRECRAWL_API_KEY | Web scraping | Present but Firecrawl has quota issues |
| HERMES_GATEWAY_TOKEN | Gateway auth | Present |
| HERMES_MAX_ITERATIONS | Iteration limit | Present |
| BROWSER_* (3 vars) | Browser config | Fine |
| TERMINAL_* (3 vars) | Terminal config | Fine |
| WEBHOOK_ENABLED | Webhook support | Present |
| MESSAGING_CWD | Messaging workdir | Present |
| WHATSAPP_ALLOWED_USERS | WhatsApp auth | Present |
| *_DEBUG (4 vars) | Debug flags | Should be off in production |

**Missing:**
- No `SUPABASE_URL` / `SUPABASE_ANON_KEY` — Hermes can't query mdeai database
- No `GOOGLE_MAPS_API_KEY` — Hermes can't do location-aware tasks
- No `PAPERCLIP_*` vars — these are injected at runtime by the adapter (correct)

---

## 6. Claude Skill Review (`.claude/skills/hermes/`)

### SKILL.md (34 lines)

**Strengths:**
- Clear description mentioning key triggers (config.yaml, OpenRouter, models, Firecrawl, browser, terminal, SOUL.md, sessions)
- Good "when to load what" table pointing to references
- Anti-patterns section (don't trust MindStudio blogs, don't put paths in SOUL.md)
- Integration stance documenting standalone vs. target architecture

**Weaknesses:**
- Description is very long — could be trimmed for better triggering
- No mention of `hermes-paperclip-adapter` package or its config fields
- No mention of `instructionsFilePath` (the key adapter config field)
- No mention of Paperclip env injection (`PAPERCLIP_*` vars)
- Missing reference to adapter configuration documentation
- "Integration stance" is vague — doesn't specify concrete wiring steps

### references/setup-final-state.md (162 lines)

**Strengths:**
- Detailed operational snapshot with verified install data
- Good architecture comparison (current vs. target)
- Setup score with reasoning
- Critical gaps prioritized

**Weaknesses:**
- Snapshot is dated — doesn't reflect current Paperclip integration (adapter is now working)
- Claims "Integration readiness: 40%" but adapter is fully wired
- Still references "scraping + model knowledge" as the data path — Supabase tables exist
- No mention of the 4 agents (CEO, CMO, CTO, OpsManager) now running

### references/official-links.md (23 lines)

Good — comprehensive URL map. No issues.

---

## 7. Task Docs Review (`tasks/hermes/`)

### REFERENCE.md (167 lines)

**Strengths:**
- Clear role separation (Hermes = brain, Paperclip = control plane)
- Correct adapter config example
- Good "Common issues" table
- Workspace binding instructions

**Weaknesses:**
- Example `adapterConfig` doesn't mention `instructionsFilePath` — the #1 missing config
- Doesn't mention the `env` field in adapterConfig for per-agent environment variables
- Missing adapter version info

### setup.md (388 lines)

**Strengths:**
- Step-by-step verification (8 steps)
- Expected output patterns (GOOD vs BAD)
- Troubleshooting table
- Architecture diagram
- Golden rules

**Weaknesses:**
- Lists "Configure CEO agent instructions" but doesn't mention `instructionsFilePath`
- Architecture diagram doesn't show the adapter package
- "Golden rules" are good but not enforced (CEO still uses curl)

---

## 8. Paperclip ↔ Hermes Integration Status

| Integration Point | Status | Notes |
|-------------------|--------|-------|
| Adapter registered | Working | `hermes_local` in BUILTIN_ADAPTER_TYPES |
| Model auto-detected | Working | detectModel reads config.yaml |
| Skills sync | Working | listSkills + syncSkills wired |
| Session persistence | Working | sessionCodec present |
| JWT support | Working | supportsLocalAgentJwt: true |
| Environment test | Working | testEnvironment available |
| UI config form | Working | SchemaConfigFields renders |
| Transcript parsing | Working | parseHermesStdoutLine parses output |
| `instructionsFilePath` | **Not configured** | Field exists but not set for any agent |
| Workspace binding | **Not configured** | Still using fallback workspace |
| PAPERCLIP_* injection | Working | Adapter injects at runtime |
| Real output quality | **Poor** | CEO generates curl\|python3 (blocked by sandbox) |

---

## 9. Real Estate Readiness

| Capability | Status | Gap |
|------------|--------|-----|
| Search listings | Not wired | No Supabase connection in Hermes |
| Price analysis | Not wired | No market data access |
| Location context | Not wired | No Google Maps key in Hermes env |
| Booking management | Not wired | No booking API access |
| Lead qualification | Not wired | No CRM data |
| AI chat (domain) | Partial | Hermes has general chat but no RE prompts |
| Coffee product search | Not wired | No Shopify/Gadget access |

**Verdict:** Hermes is a general-purpose agent with zero domain-specific configuration for real estate or mdeai.co.

---

## 10. Improvement Recommendations

### Immediate (do now)

| # | Action | How | Impact |
|---|--------|-----|--------|
| 1 | **Seal the API key** | Paperclip UI → CEO agent → Adapter → click "Seal" next to OPENROUTER_API_KEY | Security — stops key exposure |
| 2 | **Rotate the OpenRouter key** | https://openrouter.ai/settings/keys → revoke old → create new → update in Paperclip + ~/.hermes/.env | Security — old key was exposed |
| 3 | **Set timeout to 300** | Paperclip UI → CEO agent → Adapter → Timeout: 300 | Prevents runaway processes |
| 4 | **Set instructionsFilePath** | Create `/home/sk/mde/agents/ceo-instructions.md` with the canonical CEO instructions from `tasks/paperclip/REFERENCE.md`. Set `instructionsFilePath` in adapter config to this path | Fixes curl\|python3 behavior |
| 5 | **Bind workspace** | Paperclip UI → Projects → create project "mde" → add workspace with cwd `/home/sk/mde` → assign to issues | Fixes "fallback workspace" warning |

### Short-term (this week)

| # | Action | How | Impact |
|---|--------|-----|--------|
| 6 | **Change personality** | `~/.hermes/config.yaml` → `personality: helpful` (not kawaii) | Professional agent behavior |
| 7 | **Increase max turns** | `~/.hermes/config.yaml` → `max_turns: 25` | CEO can complete multi-step tasks |
| 8 | **Enable show_cost** | `~/.hermes/config.yaml` → `show_cost: true` | Cost visibility for budget tracking |
| 9 | **Disable TTS/STT** | `~/.hermes/config.yaml` → disable TTS/STT sections | Saves resources on headless runs |
| 10 | **Disable debug flags** | `~/.hermes/.env` → remove all `*_DEBUG` vars or set to false | Clean logs |
| 11 | **Set instructionsFilePath for all 4 agents** | Create per-agent instruction files: `ceo-instructions.md`, `cto-instructions.md`, `cmo-instructions.md`, `ops-instructions.md` | Each agent gets role-specific behavior |

### Medium-term (next sprint)

| # | Action | How | Impact |
|---|--------|-----|--------|
| 12 | **Create real-estate Hermes skill** | Add to `~/.hermes/skills/real-estate/` — listing search prompts, Medellin market context, price ranges, neighborhoods | Domain-specific agent behavior |
| 13 | **Add Supabase env vars** | Add `SUPABASE_URL` + `SUPABASE_ANON_KEY` to Hermes .env or per-agent adapter config env | Hermes can query mdeai database |
| 14 | **Update setup-final-state.md** | Reflect current state: adapter working, 4 agents, integration scores updated | Accurate reference for future sessions |
| 15 | **Add adapter config docs to Hermes skill** | Add `references/adapter-config.md` to `.claude/skills/hermes/` covering instructionsFilePath, env, timeout, promptTemplate fields | Skill completeness |
| 16 | **Remove unnecessary skills** | Remove `gaming`, `gifs`, `leisure`, `red-teaming`, `smart-home` from `~/.hermes/skills/` | Smaller prompt, fewer distractions |
| 17 | **Wire Paperclip skill into Hermes** | Install the Paperclip skill via Paperclip company skills API | Hermes agents understand Paperclip coordination |

---

## 11. hermes-paperclip-adapter — Status

**Already in use.** The adapter is installed (`hermes-paperclip-adapter@0.2.1`), registered as a built-in adapter type (`hermes_local`), and all 4 agents use it. The GitHub repo at `https://github.com/NousResearch/hermes-paperclip-adapter` is the upstream source.

The adapter provides:
- Hermes CLI spawning in single-query mode (`-q`)
- Session persistence across heartbeats (`--resume`)
- Structured transcript parsing (stdout → TranscriptEntry objects)
- Skill management (managed + native skill merge)
- Model auto-detection from `~/.hermes/config.yaml`
- Optional git worktree isolation and filesystem checkpoints

**Version check:** Installed 0.2.1, declared `^0.2.0` — compatible.

---

## 12. Risk Summary

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| API key exposure (screenshot) | Critical | Happened | Rotate key immediately |
| Infinite timeout (0) | High | Active | Set to 300 |
| curl\|python3 sandbox blocks | High | ~50% of runs | Set instructionsFilePath |
| Fallback workspace | Medium | Every run | Bind project workspace |
| No domain skills | Medium | Always | Create real-estate skill |
| kawaii personality | Low | Always | Change to helpful |
| Cost blindness | Medium | Always | Enable show_cost |

---

## Appendix A: Adapter Config Fields Reference

From `hermes-paperclip-adapter` documentation:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| model | string | (auto-detected) | LLM in `provider/model` format |
| provider | string | (auto) | API provider |
| timeoutSec | number | 300 | Execution timeout |
| graceSec | number | 10 | Shutdown grace period |
| toolsets | string | (all) | Comma-separated toolsets |
| persistSession | boolean | true | Resume sessions across heartbeats |
| worktreeMode | boolean | false | Git worktree isolation |
| checkpoints | boolean | false | Filesystem snapshots |
| hermesCommand | string | hermes | CLI binary path |
| verbose | boolean | false | Verbose output |
| extraArgs | string[] | [] | Additional CLI args |
| env | object | {} | Extra environment variables |
| promptTemplate | string | (default) | Custom prompt with {{variable}} placeholders |
| instructionsFilePath | string | -- | Absolute path to instructions markdown file |

Template variables: `{{agentId}}`, `{{agentName}}`, `{{companyId}}`, `{{companyName}}`, `{{runId}}`, `{{taskId}}`, `{{taskTitle}}`, `{{taskBody}}`, `{{projectName}}`

## Appendix B: File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| `tasks/hermes/REFERENCE.md` | 167 | Hermes - Paperclip reference sheet |
| `tasks/hermes/setup.md` | 388 | Step-by-step setup and verification |
| `.claude/skills/hermes/SKILL.md` | 34 | Claude skill for Hermes context |
| `.claude/skills/hermes/references/setup-final-state.md` | 162 | Operational snapshot (needs update) |
| `.claude/skills/hermes/references/official-links.md` | 23 | Hermes doc URL map |
| `~/.hermes/config.yaml` | ~200 | Hermes agent configuration |
| `~/.hermes/.env` | 18 vars | Secrets and feature flags |
| `~/.hermes/SOUL.md` | ~30 | Agent personality/values |

---

*Audit completed 2026-04-05. Next review: after implementing recommendations 1-5.*
