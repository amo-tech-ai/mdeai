# Hermes setup — final state (snapshot)

> **Purpose:** Operational snapshot for this workspace. Update when `config.yaml`, tools, or integrations change.  
> **Official docs:** [Hermes Agent docs](https://hermes-agent.nousresearch.com/docs/) · [GitHub](https://github.com/NousResearch/hermes-agent)

## Verified install (this host)

Captured from `sk` @ `~/mde` — **Hermes Agent v0.7.0 (2026.4.3)**.

### `hermes --version`

```
Hermes Agent v0.7.0 (2026.4.3)
Project: /home/sk/.hermes/hermes-agent
Python: 3.11.15
OpenAI SDK: 2.30.0
Up to date
```

### `~/.hermes/` (state + config home)

```
audio_cache  auth.lock    cron          hooks        logs      migration              pairing    sessions  SOUL.md   state.db-shm  whatsapp
auth.json    config.yaml  hermes-agent  image_cache  memories  models_dev_cache.json  sandboxes  skills    state.db  state.db-wal
```

Notes:

- **`config.yaml`** — main config.
- **`hermes-agent/`** — full engine checkout used by this install (`Project:` path above).
- **`state.db`** (+ `-shm` / `-wal`) — SQLite session store.
- **`skills/`** — user/installed skills (separate from upstream repo `skills/` inside `hermes-agent/`).
- **`whatsapp`** — present on disk; messaging may still be disabled in config — confirm in `config.yaml`.

### `~/.hermes/hermes-agent/` (engine repo root)

Top-level (full clone — `run_agent.py`, `cli.py`, `gateway/`, `agent/`, `hermes_cli/`, `skills/`, `plugins/`, `website/`, `venv/`, etc.):

```
acp_adapter              CONTRIBUTING.md          flake.nix              landingpage         optional-skills    README.md          rl_cli.py        toolset_distributions.py
acp_registry             cron                     gateway                LICENSE             package.json       RELEASE_v0.2.0.md  run_agent.py     toolsets.py
agent                    datagen-config-examples  hermes                 MANIFEST.in         package-lock.json  RELEASE_v0.3.0.md  scripts          trajectory_compressor.py
AGENTS.md                docker                   hermes_agent.egg-info  mcp_serve.py        packaging          RELEASE_v0.4.0.md  setup-hermes.sh  utils.py
assets                   Dockerfile               hermes_cli             mini_swe_runner.py  plans              RELEASE_v0.5.0.md  skills           uv.lock
batch_runner.py          docs                     hermes_constants.py    model_tools.py      plugins            RELEASE_v0.6.0.md  tests            venv
cli-config.yaml.example  environments             hermes_state.py        nix                 __pycache__        RELEASE_v0.7.0.md  tinker-atropos   website
cli.py                   flake.lock               hermes_time.py         node_modules        pyproject.toml     requirements.txt   tools
```

## Core configuration

| Setting | Value |
|---------|--------|
| Provider | OpenRouter |
| Default model | Claude Sonnet 4.6 |
| Backend | Local |
| Max iterations | 12 |
| Compression | 0.7 |
| Session reset | Inactivity + daily |
| Inactivity timeout | 60 min |
| Daily reset | 4 AM |

## Tools enabled

**Active (core)**

| Area | Notes |
|------|--------|
| Web search | Firecrawl (API connected) |
| Browser | Local Chromium |
| Terminal + process | — |
| File operations | — |
| Code execution | — |
| Vision / images | — |
| Task planning | — |
| Memory (persistent) | — |
| Session search | — |
| Clarifying questions | — |
| Delegation | Multi-agent behavior |
| Cron | Automation |

**Disabled / not configured**

- Image generation (no key)
- RL training
- GitHub Skills Hub
- Messaging (WhatsApp, Telegram, etc.)

**Assessment:** Appropriate for current stage (standalone brain, CLI-first).

## External integrations

| Component | Status |
|-----------|--------|
| Firecrawl | Connected |
| Browser | Local |
| Webhooks | Configured, not active |
| Messaging | Not enabled |

## System capabilities (current)

1. **Real-estate-style intelligence** — search, compare, explain, qualitative “market insight” (verify against real data sources before production claims).
2. **Automation** — workflows, scheduled jobs via cron.
3. **Multi-agent** — delegate, plan steps.
4. **Memory** — persist threads, preferences, user profile signals.

## Known issues (observed)

| Issue | Notes |
|-------|--------|
| Firecrawl / `web_search` errors | Possible API limits or tool config — tune via `hermes setup tools` / provider dashboards. |
| No primary structured data store yet | Scraping + model knowledge vs Supabase (or other) for listings — **next integration step**. |

## Architecture: current vs target (mdeai)

**Current (standalone)**

```text
User → Hermes CLI → web search / browser → model → output
```

**Target (trio + data)**

```text
User → OpenClaw (mouth) → Hermes (brain) → Supabase (memory + data)
      → Paperclip (CEO / control) → Product UI
```

## Setup score (subjective)

| Category | Score |
|----------|--------|
| Installation | 100% |
| Configuration | 95% |
| Tooling | 90% |
| Production readiness | 60% |
| Integration readiness | 40% |

**Overall ~80%** — strong local agent; integrations are the remaining lift.

## Critical gaps (prioritized)

1. **Supabase** — listings, user-scoped memory, structured queries.
2. **Real-estate ranking** — scoring, filters, preference learning (product logic).
3. **OpenClaw** — chat + future WhatsApp.
4. **Paperclip** — budgets, tasks, governance.

## Example behavior (documented)

**Prompt:** apartments under $500.

**Observed flow:** Firecrawl failed → browser scraping + internal knowledge → structured answer. Confirms reasoning path works; data plumbing still required for authoritative listings.

## References (official)

- [Tips & best practices](https://hermes-agent.nousresearch.com/docs/guides/tips)
- [Use SOUL.md with Hermes](https://hermes-agent.nousresearch.com/docs/guides/use-soul-with-hermes)
- [Architecture](https://hermes-agent.nousresearch.com/docs/developer-guide/architecture)
- [Docs home](https://hermes-agent.nousresearch.com/docs/)
- [CLI / reference](https://hermes-agent.nousresearch.com/docs/reference/) (index)

Third-party overview (non-official): [MindStudio — Hermes vs OpenClaw](https://www.mindstudio.ai/blog/what-is-hermes-agent-openclaw-alternative) (editorial; verify against Nous docs).
