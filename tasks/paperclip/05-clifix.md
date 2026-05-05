# Paperclip — CLI fixes (easy read)

**Use this page when:** you want to fix something from the **terminal** with `paperclipai`, and you’re not sure if that’s even possible.

**Remember:** The CLI changes **server config** and **CLI context** (API URL). It does **not** create Paperclip **projects** or **issue** assignments — that’s mostly the **web UI**.

**More detail:** `REFERENCE.md` · `03-fix.md` · `01-errors.md`  
**Official CLI:** [CLI Overview](https://docs.paperclip.ing/cli/overview) · [Setup Commands](https://docs.paperclip.ing/cli/setup-commands)

---

## In one picture

```text
CAN fix in terminal              CANNOT fix in terminal only
─────────────────────            ───────────────────────────
Port in config (doctor warning)     Link repo /home/sk/mde to a Project
API base for scripts (context)      “No project workspace” message
Where data lives (--data-dir)       CEO bad habits (curl|python)
```

---

## Yes — use the CLI for these

### 1. Doctor says the server port is busy

**What it means:** The port written in **config** (often **3100**) is already used by another program.

**Pick one:**

- **A — Use a different port in config** (simplest if you’re fine with e.g. **3102**):

  ```bash
  pnpm paperclipai configure --section server
  ```

  When asked for **Server port**, type a free port (example: **3102**). Save. Then:

  ```bash
  pnpm paperclipai doctor
  ```

- **B — Keep using 3100:** find what took it and stop it:

  ```bash
  lsof -i :3100
  ```

  Then run **`doctor`** again.

**Also:** Point **`paperclipai context`** and **`PAPERCLIP_API_URL`** at the **same** port the server prints when it starts (read the **banner** after `run`).

---

### 2. Hermes or scripts call the wrong `http://127.0.0.1:…` port

```bash
pnpm paperclipai context set --api-base http://127.0.0.1:<PORT> --company-id <YOUR_COMPANY_UUID>
pnpm paperclipai context show
```

Optional: store the key in an env var name instead of pasting the key in the command — see the [CLI Overview](https://docs.paperclip.ing/cli/overview).

---

### 3. Health check (and optional repair)

```bash
pnpm paperclipai doctor
pnpm paperclipai doctor --repair
```

---

### 4. Start Paperclip (after install in a repo)

From a folder that has **`paperclipai`** (e.g. **`~/mde`**):

```bash
pnpm paperclipai run
```

Other instance:

```bash
pnpm paperclipai run --instance dev
```

---

### 5. Put data somewhere else (dev sandbox)

```bash
pnpm paperclipai run --data-dir ./tmp/paperclip-dev
```

Or use **`PAPERCLIP_HOME`** / **`PAPERCLIP_INSTANCE_ID`** — see [Setup Commands](https://docs.paperclip.ing/cli/setup-commands).

---

## No — the CLI alone won’t fix these

| You want… | What to do instead |
|-----------|---------------------|
| **Stop “fallback workspace”** and use **`/home/sk/mde`** | **Paperclip UI:** create a **Project**, add a **workspace** with local path **`/home/sk/mde`**, set **Project** on **issues** and **routines**. Step-by-step: **`REFERENCE.md`** → “Bind agent runs to `/home/sk/mde`”. |
| **Stop `curl \| python3` errors** | Edit **agent instructions** + follow **`01-errors.md`** (not a `configure` switch). |

---

## Where files live (default)

Everything is under **`~/.paperclip/instances/default/`** unless you override with **`--data-dir`** or **`PAPERCLIP_HOME`**.

| What | Where |
|------|--------|
| Config (port, host, …) | `~/.paperclip/instances/default/config.json` |
| Database | `.../db` |
| Logs | `.../logs` |
| Uploaded files | `.../data/storage` |
| Secrets key | `.../secrets/master.key` |

---

## Related

- **`REFERENCE.md`** — full reference + CEO block  
- **`03-fix.md`** — all problems in one map  
- **`01-errors.md`** — transcripts and security denials
