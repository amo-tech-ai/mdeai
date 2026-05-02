# Paperclip + Hermes — common errors (mde)

Quick reference for failures seen in the Paperclip UI (CEO agent, Hermes local runs). Full context: `REFERENCE.md`.

---

## Why you still get this after reading the docs

**Docs do not change Hermes.** Each run, the **model** picks a shell command. For “call localhost API and pretty-print JSON,” it almost always invents:

```bash
curl -s "http://127.0.0.1:<PAPERCLIP_PORT>/api/.../issues?..." | python3 -c "import sys,json; ..."
```

The security layer is **supposed** to block that pattern **every time**. So you will see the same error until you **change what Hermes is allowed to do in text**, not until you re-read markdown.

**Stop it permanently (pick one):**

1. **CEO agent → Instructions / Dashboard** (Paperclip UI): paste the block in [Copy-paste: CEO / Hermes shell policy](#copy-paste-ceo--hermes-shell-policy) below.
2. **Use the scanner’s safe CLIs** (if installed): `tirith run <url>` or `vet <url>` — same URL, no pipe to Python.
3. **Two-step shell (no pipe):** download then parse from a file:
   ```bash
   curl -sS -o /tmp/paperclip-issues.json 'http://127.0.0.1:<PAPERCLIP_PORT>/api/companies/.../issues?assigneeAgentId=...'
   python3 -c "import json; print(json.load(open('/tmp/paperclip-issues.json')))"
   ```
   (Still may need terminal approval; the important part is **no `|` into an interpreter**.)
4. **No shell for API:** use Paperclip skills / HTTP tools that call the API with headers (see `paperclip/skills/paperclip/SKILL.md`) so Hermes never opens bash for this.

---

### Canonical CEO policy (preferred for mde)

Use the **full CEO block** in `REFERENCE.md` → **CEO agent instructions (canonical — mde)**. It forbids curl/shell/API scripting and matches “Paperclip provides tasks, context, state.”

If you need extra Hermes-only rules, add the **v2** snippet below — **do not** contradict the canonical block with “use curl for all API calls.”

    ### Copy-paste: CEO / Hermes shell policy (v2 — supplement only)

    Put this in the **CEO agent instructions** (or Hermes system instructions) in Paperclip only if you need to reinforce API style. **Do not** add a line that says “always use curl for API calls” — that contradicts sandboxing and causes deadlocks.

    ```text
    Paperclip API access (heartbeat / issues):
    - Do NOT require the terminal or curl for all API calls. The Paperclip skill uses env vars: PAPERCLIP_API_URL, PAPERCLIP_API_KEY (Bearer), PAPERCLIP_AGENT_ID, PAPERCLIP_COMPANY_ID, PAPERCLIP_RUN_ID. Follow the heartbeat steps in the Paperclip skill: prefer GET /api/agents/me/inbox-lite; use X-Paperclip-Run-Id on mutating requests.
    - NEVER use: curl | python3, curl | python, or any pipe from a download into an interpreter.
    - If your runtime only offers shell: use tirith run <url> or vet <url> if installed; OR curl -o /tmp/file.json '<url>' then read the file (no pipe). Do not combine curl with python -c on stdin.
    - If terminal is completely unavailable, you cannot use curl — use whatever HTTP/fetch tool the adapter exposes, or exit with blocked status and explain; do not loop on “enable terminal for curl.”
    ```

    Canonical procedure: `paperclip/skills/paperclip/SKILL.md` in this repo (Authentication + Heartbeat Procedure).

---

### `[paperclip] No project or prior session workspace... Using fallback workspace`

**Informational, not an error.** Paperclip did not bind this run to a git project workspace, so it used a per-agent folder under `~/.paperclip/instances/default/workspaces/<agent-id>`. If you want runs tied to `/home/sk/mde`, open/link that project in Paperclip when starting a session (exact UI depends on version). It does **not** cause the `curl|python3` block.

---

## 1. `DANGEROUS COMMAND: Security scan — [HIGH] Pipe to interpreter`

### What you see

- Run rows show **warning** icons with text like: `Pipe to interpreter: curl | python3`
- Transcript: command **denied** after prompt `[o]nce | [s]ession | [d]eny` (or default **Deny**)
- Suggested alternatives may appear (e.g. `tirith run`, `vet`, or “script execution via explicit flags”)

### Why it happens

The runner treats **`curl … | python3`** as **arbitrary code execution**: anything the server returns gets fed straight into Python. That is correct to block in production-style sandboxes.

**This is not a bug in the CEO agent name.** Any agent (including one named “CEO”) that runs a Hermes step executing that pattern will hit the same gate.

### Fix

| Approach | Notes |
|----------|--------|
| **Change the workflow** | Do not pipe curl into interpreters. Fetch JSON with a **proper HTTP client** inside a reviewed script, or use Paperclip/API SDK patterns from your skill docs. |
| **Two-step shell** | `curl -o /tmp/out.json URL` then `python3` a **checked-in** script that reads the file (still subject to policy). |
| **Session approve** | Only if your security policy allows: choose **`s`** (session) at the prompt so *bounded* work can proceed — still avoid piping downloaded bytes into interpreters. |
| **Official API** | Call `http://127.0.0.1:<port>/api/...` (port from **startup banner**) from **application code** or a **whitelisted** CLI, not `curl \| python` in agent chat. |

### Why “run succeeded” but command denied

The **overall run** can complete successfully while an individual **step** is denied — e.g. Hermes reports failure for that step but the orchestration marks the run closed. Treat “succeeded” as **session finished**, not “every step did what you wanted.” Check the transcript for **denied** lines.

---

## 2. Hermes: “Terminal command was blocked” / cannot call Paperclip API

### What you see

> Terminal command was blocked. I'm unable to make API calls via curl to the Paperclip API… I need permission to run terminal commands…

### Why

- **Sandbox** blocks or restricts shell/network the way the adapter is configured.
- Even when Paperclip is on `localhost`, **curl from the agent** may be disallowed unless you explicitly allow terminal/network scope.

### Fix

| Step | Action |
|------|--------|
| **Prefer HTTP tools** | Configure Hermes / adapter to use an **HTTP tool** or SDK for `GET /api/companies/.../issues`, not raw terminal curl. |
| **Grant scoped permission** | If your stack supports it: allow **session** terminal for API host only, or whitelist `127.0.0.1:<PAPERCLIP_PORT>`. |
| **Manual bridge** | For debugging: run curl yourself against the **banner port**, paste JSON into the task, let Hermes reason on **data**, not fetch. |
| **Network from agent host** | Ensure Hermes can reach Paperclip at the **port in the startup banner** (e.g. `3102` when `3100` is in use). |

---

## 3. CEO shows `idle` but you expect work

### Why

Idle means **no active run** or the agent is between heartbeats. It does not mean “broken.” If assignments exist but nothing runs, check:

- Heartbeat schedule and **routines** enabled
- Issues **assigned** to the CEO agent’s ID
- Last run transcript for **denied** commands (agent may “do nothing” because every step was blocked)

---

## 4. No data / “CEO does nothing”

### Why

Paperclip issues are **tasks**, not your production DB. If Supabase has no listings/leads, “operate marketplace” has nothing to act on.

### Fix

- Seed or connect **Supabase** product data per `tasks/real-estate/prd-real-estate.md`
- Define **concrete** issues: “Verify 5 listings in Laureles,” not “grow business”

---

## 5. Unsafe patterns — quick denylist

Never put these in default CEO/Hermes prompts or runbooks:

```bash
curl ... | python
curl ... | python3
curl ... | bash
bash <(curl ...)
wget -O- ... | sh
```

---

## 6. Checklist when debugging a blocked CEO run

1. Open **Runs** → latest CEO/Hermes run → **Transcript**
2. Search for **Denied** / **DANGEROUS COMMAND**
3. Replace **curl \| interpreter** with API client or file-based two-step flow
4. Confirm Paperclip API is up: `GET /health` or issues endpoint from **your** machine
5. Re-run with smaller task: e.g. “list my issues” via approved method only

---

## 7. “Terminal access blocked” + “instructions require curl” (deadlock)

### What you see

Hermes says it **cannot complete the heartbeat** because:

1. **Terminal tool is blocked** (session denied or policy off), and  
2. **CEO instructions say** to use **`curl` via terminal for all Paperclip API calls**.

So the agent correctly refuses: it has **no allowed path** to the API.

### Why this is self-inflicted

The official **Paperclip skill** does **not** tell the model to use `curl` for every call. It specifies **Bearer auth** and REST routes (`GET /api/agents/me/inbox-lite`, etc.) with env vars injected by Paperclip. **Requiring curl** in your custom CEO instructions **overrides** that and ties you to a tool that may be disabled.

### Fix (in order)

| Step | Action |
|------|--------|
| **A** | **Edit CEO agent instructions:** delete any line like “use curl for all Paperclip API calls” / “terminal required for API.” Replace with the **v2** block above + “follow `paperclip/skills/paperclip/SKILL.md` heartbeat.” |
| **B** | **Re-run with terminal allowed** only if Hermes truly has no HTTP tool: enable **session** terminal approval when prompted, and still **avoid** `curl \| python3` (use `curl -o` + file, or `tirith`/`vet`). |
| **C** | **Adapter:** confirm `hermes-paperclip-adapter` injects `PAPERCLIP_*` and that the agent runtime can perform HTTP without bash (depends on Hermes capabilities). |

### One-line summary

**Never write CEO instructions that mandate curl-only API access** — it breaks as soon as terminal is blocked. Align with the **Paperclip skill** (env + REST), not shell recipes.

---

## 8. CEO run pattern (e.g. `f1e7838e`): denied first, then `curl` POSTs on wrong port

### What happened (typical transcript)

1. **First tool call** is still **`curl … | python3`** to list issues → **Denied** (expected).
2. Hermes **recovers** and uses **`curl -s -X POST` / `PATCH`** with JSON bodies — those often **pass** the pipe-to-interpreter rule (no pipe into Python).
3. URLs in the transcript show **`http://127.0.0.1:3101`** while your **live server** may be on **`3102`** (see `REFERENCE.md`). If so, some calls hit the **wrong port** or an old process; **align** `PAPERCLIP_API_URL` / Paperclip server URL everywhere.
4. **`$PROJECT_ID` in `-d` JSON** — if unset, issue creates can **fail** or attach to the wrong project. Set project context in env or issue payload before delegating.
5. **`Reached maximum iterations (12)`** — long “do everything in one heartbeat” runs hit the step cap. Prefer **smaller** issues per run or raise limits only if your stack allows.

### What to fix (checklist)

| Priority | Action |
|----------|--------|
| **P0** | **CEO instructions** (canonical in `REFERENCE.md`): forbid `curl \| python3`; prefer **no shell** for API — use Paperclip-injected context + skill. |
| **P0** | **One API base:** e.g. `http://127.0.0.1:3102` — fix in Paperclip UI + Hermes env + CLI `context set --api-base` so **nothing** still points at `3101` if that is dead. |
| **P1** | **Hermes system prompt / skill:** add “Never use `curl` piped to `python` or `python3` for JSON; use `GET /api/agents/me/inbox-lite` or non-pipe methods.” |
| **P1** | **Project ID:** ensure `PROJECT_ID` (or equivalent) is defined for `POST /api/companies/.../issues` bodies. |
| **P2** | Split **“kickoff”** from **“create 3 agents + 3 issues + close parent”** across runs to avoid **max iteration** cutoffs. |

### Why the first step keeps failing

Until the **model weights + skill text** consistently prefer **inbox** / **HTTP** over “shell one-liner to list JSON,” it will **retry** the `curl|python3` anti-pattern at the start of sessions. **Canonical CEO text** + **no shell** policy reduces but may not eliminate it — you may need a **Hermes adapter** or **post-tool** hook that blocks that pattern before execution.

---

*See also: image capture in repo assets for UI context — `DANGEROUS COMMAND` + Hermes blocked transcript.*
