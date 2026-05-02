# Hermes — reference sheet (mde)

**Hermes** is the **execution/runtime agent** (tools, terminal, skills, multi-provider LLMs) that Paperclip **wakes** on heartbeats. Paperclip is the **control plane** (tasks, budgets, audit). This repo uses Hermes as the **adapter** behind agents like the **CEO**.

**Cross-links:** Paperclip CLI and workspace fixes → `tasks/paperclip/05-clifix.md` · errors → `tasks/paperclip/01-errors.md` · full Paperclip ref → `tasks/paperclip/REFERENCE.md`

---

## What Hermes does here

| Piece | Role |
|-------|------|
| **Hermes** | Runs the model, tools (terminal, files, web, …), skills, MCP — one “brain” per run. |
| **Paperclip** | Assigns issues, heartbeats, injects **`PAPERCLIP_*`** env, records runs. |
| **mde app** | Vite + Supabase + Shopify — **not** Hermes; Hermes only touches it if a **task** says so in a real repo **`cwd`**. |

---

## Install & config (typical)

```bash
pip install hermes-agent   # Python 3.10+
```

- **Global config:** `~/.hermes/config.yaml` — provider + default model.
- **Secrets / keys:** often `~/.hermes/.env` (per [providers](https://hermes-agent.nousresearch.com/docs/integrations/providers)).
- **Interactive model setup:** `hermes model` (OAuth, API keys, Copilot, Anthropic, OpenRouter, etc.).

Official docs: [Hermes Agent](https://hermes-agent.nousresearch.com/docs) · [Configuration](https://hermes-agent.nousresearch.com/docs/user-guide/configuration) · [AI Providers](https://hermes-agent.nousresearch.com/docs/integrations/providers)

---

## Local home directory (`~/.hermes`)

Hermes stores **everything** for the agent under **`~/.hermes`** (on your machine: **`/home/sk/.hermes`**). It is **not** inside the **`mde`** git repo.

**Check install:**

```bash
ls -la ~/.hermes
hermes --version
```

**Example — this repo operator’s machine (Apr 2026):**

```text
Hermes Agent v0.7.0 (2026.4.3)
Project: /home/sk/.hermes/hermes-agent
Python: 3.11.15
OpenAI SDK: 2.30.0
Up to date
```

| Path (under `~/.hermes`) | Role |
|-------------------------|------|
| **`config.yaml`** | Main config (provider, model, toolsets, …). |
| **`.env`** | API keys (`OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, …). |
| **`auth.json`** / **`auth.lock`** | Auth store (OAuth / tokens where applicable). |
| **`hermes-agent/`** | Hermes **project** checkout / bundled tree (matches `hermes --version` → **Project**). |
| **`sessions/`** | Session data. |
| **`skills/`** | Installed Hermes skills. |
| **`logs/`** | Log output. |
| **`state.db`** (+ **`-wal`** / **`-shm`**) | Local SQLite state. |
| **`models_dev_cache.json`** | Model catalog cache. |
| **`memories/`** | Long-term memory storage (if enabled). |
| **`sandboxes/`** | Sandbox workdirs. |
| **`checkpoints/`** | Checkpoints. |
| **`hooks/`** | Hooks. |
| **`cron/`** | Scheduled jobs config. |
| **`audio_cache/`** / **`image_cache/`** / **`images/`** | Media caches. |
| **`whatsapp/`** | WhatsApp integration data (if used). |
| **`SOUL.md`** | Optional persona file (if you added one). |
| **`.skills_prompt_snapshot.json`** | Skills prompt snapshot (generated). |

Paths and filenames can change slightly between Hermes versions; **`config.yaml`**, **`.env`**, and **`sessions/`** are the ones you edit most often.

---

## Models (avoid 404)

The API must receive a **valid model id** for the **provider** you selected.

- **Anthropic direct:** Hermes examples use ids like **`claude-sonnet-4-6`** (not a bare **`claude-sonnet-4`** if your provider returns **404**).
- **OpenRouter:** use the OpenRouter model string (e.g. **`anthropic/claude-sonnet-4.6`**) and set **`OPENROUTER_API_KEY`** in `~/.hermes/.env`.

**Check:** `hermes chat --provider anthropic --model claude-sonnet-4-6` (adjust to your provider). If that works, align **Paperclip agent `adapterConfig.model`** the same way.

---

## Paperclip ↔ Hermes adapter

Agents in Paperclip use an adapter type such as **`hermes_local`** (see [NousResearch/hermes-paperclip-adapter](https://github.com/NousResearch/hermes-paperclip-adapter)).

**Example `adapterConfig` shape** (illustrative — follow your Paperclip UI / adapter version):

```json
{
  "model": "anthropic/claude-sonnet-4.6",
  "maxIterations": 50,
  "timeoutSec": 300,
  "persistSession": true,
  "enabledToolsets": ["terminal", "file", "web"]
}
```

The adapter injects **`PAPERCLIP_*`** for each run and should follow the **Paperclip skill** heartbeat (see below), not ad-hoc **`curl | python3`**.

---

## Paperclip env (injected on runs)

Typical vars (see `paperclip/skills/paperclip/SKILL.md` in this repo):

| Variable | Purpose |
|----------|---------|
| `PAPERCLIP_API_URL` | Base URL (e.g. `http://127.0.0.1:3102` — **no** `/api` suffix in many flows; follow skill). |
| `PAPERCLIP_API_KEY` | Bearer JWT for this run. |
| `PAPERCLIP_AGENT_ID` | This agent’s id. |
| `PAPERCLIP_COMPANY_ID` | Company id. |
| `PAPERCLIP_RUN_ID` | Current run — send as **`X-Paperclip-Run-Id`** on mutating API calls. |

**Heartbeat:** prefer **`GET /api/agents/me/inbox-lite`**; checkout before work; never retry **409** on checkout.

---

## Local CLI / skills (outside a heartbeat)

To print env for an agent identity (from Paperclip docs in skill):

```text
paperclipai agent local-cli <agent-id-or-shortname> --company-id <company-id>
```

Use that when debugging **`PAPERCLIP_*`** without a full Paperclip UI run.

---

## Repo `cwd` for Hermes

If transcripts show **`No project or prior session workspace`**, Hermes falls back to **`~/.paperclip/.../workspaces/<agent-id>`**. To use **`/home/sk/mde`** as the shell cwd, configure a **Paperclip Project + workspace** with that path and attach **issues / routines** — see **`tasks/paperclip/REFERENCE.md`** (“Bind agent runs to `/home/sk/mde`”). **Not** a Hermes-only setting.

---

## Common issues (Hermes + Paperclip)

| Symptom | See |
|---------|-----|
| **`DANGEROUS COMMAND: curl \| python3`** | `tasks/paperclip/01-errors.md` — model invents shell; use inbox / HTTP, not pipes. |
| **404 `model: …` from Anthropic** | Valid model id + provider; `hermes model` / OpenRouter string. |
| **Wrong localhost port** | Paperclip banner port vs **`PAPERCLIP_API_URL`** — `tasks/paperclip/05-clifix.md`. |
| **Terminal “blocked” + curl-only instructions** | Deadlock — `tasks/paperclip/01-errors.md` §7. |

---

## Official links (bookmark)

| Resource | URL |
|----------|-----|
| Hermes docs home | https://hermes-agent.nousresearch.com/docs |
| Providers (Anthropic, OpenRouter, …) | https://hermes-agent.nousresearch.com/docs/integrations/providers |
| Paperclip heartbeat (agent contract) | https://docs.paperclip.ing/guides/agent-developer/heartbeat-protocol |
| Paperclip adapters overview | https://docs.paperclip.ing/adapters/overview |
| hermes-paperclip-adapter (GitHub) | https://github.com/NousResearch/hermes-paperclip-adapter |

---

*Hermes version and adapter fields change with releases — confirm **`adapterConfig`** against your installed **`hermes-paperclip-adapter`** and Paperclip version.*
