# Paperclip + Hermes — fix guide (simple)

This page answers: **what was going wrong**, and **what to do so it stays fixed**. For deep detail and error text, see `01-errors.md`. For ports, CLI, and CEO instructions, see `REFERENCE.md`.

---

## The idea in one paragraph

**Paperclip** is the control plane (tasks, heartbeats, who owns what). **Hermes** is the worker that runs in a **sandbox**. The sandbox **blocks unsafe shell patterns** and may **block or limit the terminal**. If Hermes tries to talk to Paperclip using **`curl` piped into `python3`**, you get **DANGEROUS COMMAND** — that is **expected**. The fix is **not** “try harder with curl”; it is **use the API the way Paperclip documents** (HTTP + Bearer token, inbox endpoints, env vars), and **keep config in sync** (correct port, valid model id).

---

## Problem → fix (quick map)

**How to use this:** Find the **symptom** that matches your screen, read **what’s going on** in plain English, then do **the fix**.

---

### Security: `DANGEROUS COMMAND` + `curl | python3`

| If you see… | What’s going on (simple) | Do this |
|-------------|--------------------------|---------|
| Warning about **pipe to interpreter** / **`curl \| python3`** | The runner treats that like “run whatever the network returned inside Python.” That’s unsafe, so it **blocks** it. This is **normal**, not a Paperclip bug. | **Don’t** chain `curl` into `python3`. **Do** one of: save with `curl -o /tmp/x.json` then read the file; use **`tirith`** / **`vet`** if you have them; or use **HTTP tools / Paperclip skill** (no shell pipe). Details: `01-errors.md` §1. |

---

### “Can’t reach API” or “localhost blocked”

| If you see… | What’s going on (simple) | Do this |
|-------------|--------------------------|---------|
| Hermes says it **can’t reach** Paperclip / **localhost** | Often the **bad command was blocked first**. The model then **guesses** “network blocked.” The server may be **fine**. | In your **browser**, open **`http://127.0.0.1:<PORT>/api/health`** (use the **port from the Paperclip banner**). If that loads, Paperclip is up — fix **agent instructions**, not “the internet.” |

---

### Wrong port (e.g. `3101` in scripts but banner says `3102`)

| If you see… | What’s going on (simple) | Do this |
|-------------|--------------------------|---------|
| 404 / connection refused / old port in logs | If **3100** is busy, Paperclip moves to **3101**, **3102**, etc. Anything still pointing at the **old** port is wrong. | Copy the **Server** / **API** line from the **startup banner**. Set **`PAPERCLIP_API_URL`** and **`paperclipai context --api-base`** to **that** URL. See `REFERENCE.md` (CLI). |

---

### Model error: `404` / `model: claude-sonnet-4` (or similar)

| If you see… | What’s going on (simple) | Do this |
|-------------|--------------------------|---------|
| **HTTP 404** from Anthropic / “model not found” | The **name** you sent isn’t a valid model id for that provider **right now**. | Pick a model that works: e.g. run **`hermes model`** or set **`claude-sonnet-4-6`** (Hermes + Anthropic example). Use **OpenRouter** in config if that’s what you use. |

---

### Workspace: “No project” / fallback folder under `~/.paperclip/.../workspaces/`

| If you see… | What’s going on (simple) | Do this |
|-------------|--------------------------|---------|
| **`No project or prior session workspace`** + fallback path | The run has **no `projectId`** (or no usable saved session `cwd`). Paperclip falls back to **`~/.paperclip/instances/default/workspaces/<agent-id>`**. | Follow the **numbered fix** below. |

**Fix (do all that apply)**

1. **Create or open a Project** in Paperclip (e.g. **mde**).
2. **Add a project workspace** with **local path / `cwd` = `/home/sk/mde`** (absolute path; folder must exist on the **same machine** as the Paperclip server).
3. **Attach issues** to that project (**Project** ≠ “No project”) and pick the **`/home/sk/mde`** workspace if asked.
4. **Attach routines** (heartbeats) to that same project — **not** “No project” — so idle CEO runs still get a repo `cwd`.
5. **`test -d /home/sk/mde`** on the server host to confirm the path.

Full detail: **`REFERENCE.md` → “Bind agent runs to `/home/sk/mde`”**.

---

### Broken shell one-liners (`not in ]`, `if not i.get`, …)

| If you see… | What’s going on (simple) | Do this |
|-------------|--------------------------|---------|
| Python errors or empty output from **tiny** `python3 -c "..."` in the transcript | Long commands get **cut off** or mangled. The **syntax** breaks. | Prefer **inbox / inbox-lite** and short flows from the **Paperclip skill** — not giant one-liners in bash. |

---

### Slow or bad command: `find /` from the agent

| If you see… | What’s going on (simple) | Do this |
|-------------|--------------------------|---------|
| **`find /`** running tens of seconds | Searching the **whole disk** is slow and unnecessary. | Tell the CEO: **only** look under **`/home/sk/mde`** (or your repo path). **Never** `find /` in a heartbeat. |

---

### Instructions deadlock: “must use `curl` for all API calls”

| If you see… | What’s going on (simple) | Do this |
|-------------|--------------------------|---------|
| Agent says it **can’t** finish heartbeat because **terminal** is blocked **and** instructions **require** curl | You told it **only** curl, but curl needs **shell**. That’s a **deadlock**. | **Remove** “always use curl for API.” Follow **`paperclip/skills/paperclip/SKILL.md`** (env vars + REST). See `01-errors.md` §7. |

---

## Fix checklist (do in order)

1. **Start Paperclip** and read the **banner** — note **Server** port and **API** base (example: `http://127.0.0.1:3102`).
2. **Set context everywhere to that base** — `paperclipai context set --api-base http://127.0.0.1:<PORT>` and **`PAPERCLIP_API_URL`** for Hermes (same host/port as banner).
3. **CEO / Hermes instructions (Paperclip UI)** — paste the **canonical** block from `REFERENCE.md` (no shell required for API; **never** `curl \| python3`). Add **`SOUL.md`** persona *below* that block if you use it — persona does not replace API rules.
4. **Model** — `hermes model` or adapter config: pick a model that **returns 200**, not 404 (e.g. **`claude-sonnet-4-6`** per Hermes provider docs).
5. **Project** — bind **`/home/sk/mde`** in Paperclip so you stop relying on **`~/.paperclip/.../workspaces/...`** fallback alone.
6. **Heartbeats** — keep tasks **small** so you don’t hit **max iterations** in one run.

---

## What “working” looks like

- **`run succeeded`** and **exit code 0**.
- Transcript shows **GET** inbox / issues via **allowed** methods — not a denied **`curl \| python3`** on every wake.
- **Issues** move **`todo` → `in_progress` → `done`** with comments when the skill says to.
- You are not **chasing the wrong port** because everything points at the **banner**.

---

## Related files

| File | Purpose |
|------|---------|
| `01-errors.md` | Each error message, why it repeats, deadlocks, transcript patterns |
| `REFERENCE.md` | Ports, CLI, CEO canonical block, architecture |
| `05-clifix.md` | CLI-only fixes (`configure`, `doctor`, `context`, `--data-dir`) |
| `paperclip/skills/paperclip/SKILL.md` | Heartbeat, auth, env vars (source of truth for procedure) |

---

*Last updated for mde Paperclip + Hermes local runs.*
