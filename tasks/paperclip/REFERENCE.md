# Paperclip — mde reference sheet

Production-focused reference for running Paperclip as the **governance / CEO layer** alongside Hermes, OpenClaw, and Supabase. For **error messages and fixes**, see `01-errors.md` — including **why the same `curl|python3` denial repeats** until you update CEO/Hermes **instructions** in Paperclip (docs alone do not change the model).

---

## What Paperclip is

**Autonomous control plane** for an agent company: task assignment, heartbeats, budgets, org chart, and audit — not the domain app itself (that stays in Vite + Supabase).

It:

- Runs operational loops (who does what, when)
- Assigns and tracks tasks (issues)
- Monitors agent health and spend
- Orchestrates workers (adapters) under policy

**Naming:** An agent named **CEO** in the Paperclip UI is just a **role label** for an agent profile (often Hermes-backed). It is **not** a separate product. Errors like `DANGEROUS COMMAND` come from the **execution sandbox** blocking unsafe shell patterns, not from misconfiguring the CEO name.

---

## System architecture (mde)

```text
OpenClaw (channels / mouth)
        →
Hermes (reasoning / brain)
        →
Supabase (data)
        ↔
Paperclip (governance / CEO — tasks, budgets, approvals)
```

Data flows through Supabase; Paperclip coordinates **work** and **policy** around agents that touch APIs and tasks.

**Hermes (execution agent):** `tasks/hermes/REFERENCE.md`

---

## Local setup

### Start Paperclip (app in this repo)

```bash
cd /home/sk/mde/paperclip
pnpm dev
```

### Open UI and API base URL

**Ports are not fixed.** If `3100` is already in use, Paperclip binds to the next free port (e.g. **`3102`** for both UI and API).

After `paperclip` (or `pnpm dev` in `paperclip/`) starts, read the banner:

```text
Server           3102
API              http://127.0.0.1:3102/api (health: .../api/health)
UI               http://127.0.0.1:3102
```

Use that host/port for bookmarks and for any **`PAPERCLIP_API_URL`** you set locally. `paperclip doctor` may warn `Port 3100 is already in use` — that is expected when another process holds 3100; the server still starts on the port it prints.

**Conflict check:** `lsof -i :3100` (or whatever port you expect).

### CLI: point tools at the right API (fix wrong host/port)

Official CLI overview: [CLI Overview](https://docs.paperclip.ing/cli/overview). Full doc index: [llms.txt](https://docs.paperclip.ing/llms.txt).

If Hermes, `paperclipai`, or scripts still call **`localhost:3100`** but your server banner says **`127.0.0.1:3102`**, fix **context** so every command uses the live API:

```bash
# From paperclip package (or global paperclipai install)
pnpm paperclipai context set --api-base http://127.0.0.1:3102 --company-id <YOUR_COMPANY_ID>
```

**Company ID:** Paperclip UI (company settings) or `~/.paperclip/instances/default/config.json` (varies by version — use the UUID shown for your company).

**API key without pasting into files** (recommended):

```bash
pnpm paperclipai context set --api-key-env-var-name PAPERCLIP_API_KEY
export PAPERCLIP_API_KEY="<token from Paperclip UI or local_trusted flow>"
pnpm paperclipai context show
```

Context defaults live in **`~/.paperclip/context.json`** (see [CLI Overview](https://docs.paperclip.ing/cli/overview)).

**One-off override** (any subcommand): global flags from the docs:

```text
--api-base <url>   # e.g. http://127.0.0.1:3102
--api-key <token>
--data-dir <path>  # isolate instance: e.g. ./tmp/paperclip-dev
```

**Hermes / CEO runs:** set **`PAPERCLIP_API_URL`** to the same base the banner prints (e.g. `http://127.0.0.1:3102` — typically **no** `/api` suffix; follow `paperclip/skills/paperclip/SKILL.md`).

---

## Bind agent runs to `/home/sk/mde` (fix “No project or prior session workspace”)

**What’s wrong:** Paperclip picks the shell **`cwd`** from a **Project** + **project workspace** whose **`cwd`** points at your repo. If the run has **no `projectId`** (and no resumable session path), you get:

`No project or prior session workspace was available. Using fallback workspace "~/.paperclip/.../workspaces/<agent-id>"`

That is **informational** until you attach a real project path.

**Rules (from server logic):**

1. **`/home/sk/mde` must exist on the machine that runs the Paperclip server** (same host as `paperclipai run` / `pnpm paperclipai run`).
2. Use an **absolute** path: **`/home/sk/mde`** (not `~/mde`).
3. The **Project** must have at least one **workspace** with that **`cwd`**, and **runs must carry that project** via the **issue** and/or **routine**.

**Do this in the Paperclip UI**

| Step | Action |
|------|--------|
| **1** | Open **Projects** → **New project** (or edit one), e.g. name **mde**. |
| **2** | Add a **workspace** on that project: type **Local git checkout** or **Local non-git path** (see project workspace UI). Set **local path / cwd** to **`/home/sk/mde`**. Save. |
| **3** | Open each **issue** that agents work on → set **Project** to **mde** (not **No project**). If the UI offers a **workspace** choice, pick the one whose path is **`/home/sk/mde`**. |
| **4** | Open **Routines** (scheduled heartbeats) that wake the CEO → set **Project** to **mde**, not **No project**. Idle heartbeats only get a repo `cwd` when the routine (or the run context) supplies a **`projectId`**. |
| **5** | Trigger a new run. The fallback warning should stop once **`resolvedProjectId`** + a valid workspace **`cwd`** exist and the directory is readable. |

**If you still see a warning about “path … not available”:** the server process cannot `stat` that folder (wrong path, different user, or repo on another machine).

**Quick check on the server host:** `test -d /home/sk/mde && echo ok`

See also: `03-fix.md` (workspace section) and Paperclip UI **Projects** → **Workspaces** for **cwd** / **repo** fields.

---

## CLI fixes (what you can / cannot fix from the terminal)

**Short standalone copy:** `tasks/paperclip/05-clifix.md`

| Goal | CLI | Notes |
|------|-----|--------|
| **Doctor: “Port 3100 is already in use”** | **Yes** | Doctor checks whether **`config.server.port`** is **free**. If something else owns **3100**, either stop that process (`lsof -i :3100`) **or** set Paperclip to a free port: **`pnpm paperclipai configure --section server`** and choose e.g. **3102**. Save so **`~/.paperclip/instances/default/config.json`** matches the port you actually run. |
| **Wrong API URL in scripts / Hermes** | **Yes** | **`pnpm paperclipai context set --api-base http://127.0.0.1:<PORT> --company-id <UUID>`** and optionally **`--api-key-env-var-name PAPERCLIP_API_KEY`**. See [CLI Overview](https://docs.paperclip.ing/cli/overview). |
| **Alternate data directory** | **Yes** | **`pnpm paperclipai run --data-dir ./tmp/paperclip-dev`** or **`PAPERCLIP_HOME`** / **`PAPERCLIP_INSTANCE_ID`** (see official Setup Commands doc). |
| **Bind repo to `/home/sk/mde` (fallback workspace)** | **No** (not via `configure`) | **Project + workspace `cwd`** lives in the **app database**. Use the **Paperclip UI** (or HTTP API), not `paperclipai configure`. |

**One-liner for the port warning:** after you know a free port (e.g. **3102**):

```bash
pnpm paperclipai configure --section server
# set "Server port" to 3102 (or run on 3100 only after freeing it)
pnpm paperclipai doctor
```

---

## File locations

Typical local instance data (paths may vary by install):

```text
~/.paperclip/
├── instances/default/
│   ├── db/            # embedded postgres (if used)
│   ├── config.json
│   └── backups/
```

---

## Core concepts

| Concept | Meaning |
|--------|---------|
| **Company** | Top-level tenant for mde; holds org, agents, issues |
| **Agent** | Worker registered in Paperclip (CEO, ops, etc.) with an **adapter** (e.g. Hermes) |
| **Task / issue** | Unit of work assigned to an agent |
| **Heartbeat** | Scheduled tick: pick up work, report status, enforce routines |
| **Org chart** | Hierarchy and roles for delegation |

---

## Agent setup (example: CEO)

| Setting | Example |
|---------|---------|
| Name | CEO |
| Adapter | Hermes (or your registered adapter) |
| Model | Per policy / default |

---

## CEO agent instructions (canonical — mde)

Paste into the **CEO** agent in Paperclip (agent **Instructions** / **Dashboard**).

```text
You are the CEO of mde.

You DO NOT access APIs directly.
You DO NOT use terminal commands.
You DO NOT fetch issues manually.

Paperclip provides:
- tasks
- context
- state

Your job:
- analyze assigned task
- decide actions
- delegate work
- create subtasks
- update task status

Never use:
- curl
- shell commands
- local API calls
```

### Technical reality (implementers)

- The **platform** (Hermes + Paperclip adapter) still performs REST operations using injected **`PAPERCLIP_*`** env and the **Paperclip skill** (`paperclip/skills/paperclip/SKILL.md`). That is not “the CEO typing curl in a terminal.”
- This prompt stops the model from **inventing** shell one-liners and **`curl | python3`**, which triggered the security denials in `01-errors.md`.
- **Product intent:** prioritize marketplace outcomes (leads, listings, conversion) via **tasks and delegation**, not ad-hoc localhost API scripting.

---

## Task structure (best practice)

**Good — specific, observable:**

```text
Operate mde marketplace

Goal: Increase booking conversion from qualified leads.

Do:
- Review open issues assigned to Growth; pick highest priority.
- Propose one pricing or listing change with rationale.
- Create follow-up issue for verification.

Output:
- Summary, decisions, new issues with clear acceptance criteria.
```

**Bad — not actionable:**

```text
Hire engineer
```

---

## Security rules (non-negotiable)

Block and deny by default:

```bash
curl ... | python
curl ... | python3
bash <(curl ...)
```

**Why:** piping download straight into an interpreter executes untrusted code.

**Enforce:**

- No pipe from network fetch into `python` / `node` / `ruby` shells
- No remote script execution without review
- Prefer **HTTP client in code**, **SDK**, or **save → verify → run** workflows

### Safe pattern

1. Fetch with `curl` or client → **save to file**
2. Inspect hash / content policy
3. Process with explicit script in repo (reviewed), or use a **blessed** tool (e.g. documented CLI)

Some environments suggest alternatives in the denial banner (e.g. `tirith`, `vet`) — use what your security team standardizes on.

---

## Workflow (conceptual)

```text
1. Heartbeat or on-demand run starts
2. Agent loads instructions + assigned issues
3. Plan and execute steps (tools/APIs, not unsafe shell)
4. Post comments / status on issues; create follow-ups
5. Paperclip records runs, budget, audit trail
```

---

## What the CEO agent should drive

| Area | Examples |
|------|----------|
| Leads | Capture, qualify, SLA for follow-up |
| Listings | Quality bar, verification, stale listing handling |
| Matching | Rank and explain; hand off to product metrics |
| Conversion | Booking funnel friction; experiments as tasks |

---

## Metrics to track

Bookings, conversion rate, response time, listing quality score, lead volume, AI token spend per agent (when wired).

---

## First workflows to formalize as tasks

1. **Lead → booking:** inquiry → match → follow-up → booking
2. **Listing quality:** low-quality listing → improvement checklist → re-verify
3. **Pricing:** competitor snapshot → suggested price band → human approve

---

## Important commands (paperclip repo)

```bash
cd /home/sk/mde/paperclip
pnpm dev
# If your package exposes onboarding:
pnpm paperclipai onboard
```

Confirm scripts in `package.json` — names change between versions.

---

## Best practices

- Keep tasks small and verifiable
- Avoid vague goals in issue descriptions
- Never bake unsafe shell into default agent prompts
- Connect **data** (Supabase) and **channels** (OpenClaw) explicitly — Paperclip does not replace either
- MVP first: one heartbeat routine + one well-defined issue template

---

## Current state (template — update as you wire)

| Component | Notes |
|-----------|--------|
| Hermes | Local adapter / brain |
| Paperclip | UI + API when `pnpm dev` running |
| CEO agent | Created in UI; blocked runs = see `01-errors.md` |
| Supabase | Connect via app secrets + edge functions — not automatic from Paperclip |
| OpenClaw | Separate gateway setup |

---

## Next steps (order)

1. Fix **CEO instructions**: do **not** require `curl`/terminal for all Paperclip API calls (deadlock when terminal is blocked). Follow `paperclip/skills/paperclip/SKILL.md` + `tasks/paperclip/01-errors.md` section 7.
2. Fix execution path: **no `curl | python`**; use API tools or approved clients (`01-errors.md`).
3. Connect Supabase-backed product flows to metrics/issues you care about.
4. Seed real listings / leads so tasks have substance.
5. Add ranking / Hermes workflows as **documented** tools, not ad-hoc shell.
6. Add OpenClaw when ready for channel orchestration.

---

## Related docs

- `.claude/skills/paper-clip/` — skill entry + deep references
- `tasks/real-estate/prd-real-estate.md` — product scope for marketplace
- `AGENTS.md` (repo root) — trio + Supabase overview

---

*Last updated: 2026-04-04 (canonical CEO instructions added)*
