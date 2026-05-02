Got it — here is your **clean, production-ready reference sheet** for
👉 **Hermes + Paperclip (local setup, no confusion, no curl issues)**

Short, complete, and correct for your exact environment.

---

# 🚀 Hermes + Paperclip Setup (FINAL)

## 🎯 Summary (1 min)

* **Paperclip = control plane** (tasks, agents, UI)
* **Hermes = worker agent** (runs tasks)
* **Rule:** use **context**, NOT manual API calls

---

# ✅ 1. Verify Hermes is installed

Run:

```bash
hermes --version
```

Expected:

```text
Hermes Agent v0.7.0+
```

Check files:

```bash
ls ~/.hermes
```

You should see:

```text
config.yaml
.env
sessions/
logs/
```

---

# ✅ 2. Verify Hermes config

Open:

```bash
nano ~/.hermes/config.yaml
```

Make sure you have:

```yaml
model: openrouter/anthropic/claude-3.5-sonnet
```

---

# ✅ 3. Set API keys

Open:

```bash
nano ~/.hermes/.env
```

Add:

```bash
OPENROUTER_API_KEY=your_real_key
```

(optional)

```bash
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
```

---

# ✅ 4. Start Paperclip

From project:

```bash
cd ~/mde
pnpm paperclipai run
```

Look for:

```text
Server: 3102
API: http://127.0.0.1:3102/api
UI: http://127.0.0.1:3102
```

👉 **3102 is your source of truth**

---

# ✅ 5. Fix CLI context (you already did)

Correct state:

```bash
pnpm paperclipai context show
```

Should show:

```json
{
  "apiBase": "http://127.0.0.1:3102",
  "companyId": "...",
  "apiKeyEnvVarName": "PAPERCLIP_API_KEY"
}
```

---

# ✅ 6. Link project (CRITICAL)

In Paperclip UI:

```
Project → Configuration
```

Set:

```text
Repo: github.com/amo-tech-ai/mdeai
Local folder: /home/sk/mde
```

---

# ⚠️ IMPORTANT RULE

If you see:

```text
Using fallback workspace ❌
```

👉 The run is NOT using your project

Fix:

* create NEW issue
* run from that issue

---

# ✅ 7. Configure CEO agent (FINAL)

Paste this into:

```
Agents → CEO → Instructions
```

```text
You are the CEO of mde.

Execution model:
- Use provided context only
- Do not fetch issues manually
- Do not call APIs
- Do not use curl or terminal for coordination

Your role:
- analyze tasks
- decide strategy
- delegate work
- create subtasks
- update status

Never:
- write code
- execute features
- parse API responses
- use curl | python

Always:
- delegate to CTO / CMO / UX
- produce clear structured output
```

---

# ✅ 8. Run flow (correct usage)

## Create issue:

```text
Title: Test execution
Assign: CEO
```

## Run:

```
Run Heartbeat
```

---

# ✅ Expected output

GOOD:

```text
- analyzing task
- creating plan
- delegating
```

BAD (means broken):

```text
curl | python ❌
fallback workspace ❌
model 404 ❌
```

---

# 🔧 Common Problems → Fix

## ❌ curl | python

Fix:
→ update CEO instructions (no API calls)

---

## ❌ model 404

Fix:

```yaml
model: openrouter/anthropic/claude-3.5-sonnet
```

---

## ❌ wrong port

Fix:

```bash
pnpm paperclipai context set --api-base http://127.0.0.1:3102
```

---

## ❌ fallback workspace

Fix:

* project not bound
* create new issue
* run from project

---

## ❌ empty queue

Fix:
→ create new task

---

# 🧠 Architecture (simple)

```text
Paperclip (UI + tasks)
        ↓
     Hermes (CEO)
        ↓
   CTO / CMO agents
        ↓
   Supabase / app
```

---

# 🔥 Golden Rules

```text
1. Never use curl inside Hermes
2. Never fetch issues manually
3. Always use context
4. Always delegate (CEO)
5. Always use new issues for testing
```

---

# 🚀 You are now in build phase

Everything is working.

Next step is NOT setup.

👉 Next step = build system:

* rentals engine
* lead pipeline
* CRM
* automation

---

# 👉 If you want next

Say:

```text
build mde system
```

I’ll give you:

* CTO agent
* CMO agent
* full workflow
* production architecture

╭─────────────────────── Hermes Agent v0.7.0 (2026.4.3) ───────────────────────╮
│                                     Available Tools                          │
│   ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⡀⠀⣀⣀⠀⢀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    browser: browser_back, browser_click,    │
│   ⠀⠀⠀⠀⠀⠀⢀⣠⣴⣾⣿⣿⣇⠸⣿⣿⠇⣸⣿⣿⣷⣦⣄⡀⠀⠀⠀⠀⠀⠀    ...                                      │
│   ⠀⢀⣠⣴⣶⠿⠋⣩⡿⣿⡿⠻⣿⡇⢠⡄⢸⣿⠟⢿⣿⢿⣍⠙⠿⣶⣦⣄⡀⠀    clarify: clarify                         │
│   ⠀⠀⠉⠉⠁⠶⠟⠋⠀⠉⠀⢀⣈⣁⡈⢁⣈⣁⡀⠀⠉⠀⠙⠻⠶⠈⠉⠉⠀⠀    code_execution: execute_code             │
│   ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⡿⠛⢁⡈⠛⢿⣿⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    cronjob: cronjob                         │
│   ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠿⣿⣦⣤⣈⠁⢠⣴⣿⠿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    delegation: delegate_task                │
│   ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠻⢿⣿⣦⡉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    file: patch, read_file, search_files,    │
│   ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢷⣦⣈⠛⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    write_file                               │
│   ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣴⠦⠈⠙⠿⣦⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    homeassistant: ha_call_service,          │
│   ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣿⣤⡈⠁⢤⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    ha_get_state, ...                        │
│   ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠷⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    image_gen: image_generate                │
│   ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⠑⢶⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    (and 9 more toolsets...)                 │
│   ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠁⢰⡆⠈⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀                                             │
│   ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⠈⣡⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    Available Skills                         │
│   ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    autonomous-ai-agents: claude-code,       │
│                                     codex, hermes-agent, opencode            │
│  claude-sonnet-4.6 · Nous Research  creative: ascii-art, ascii-video,        │
│            /home/sk/mde             excalidraw, songwriting...               │
│   Session: 20260405_021546_d13c5a   data-science: jupyter-live-kernel        │
│                                     devops: webhook-subscriptions            │
│                                     email: himalaya                          │
│                                     gaming: minecraft-modpack-server,        │
│                                     pokemon-player                           │
│                                     general: dogfood                         │
│                                     github: codebase-inspection,             │
│                                     github-auth, github-code-r...            │
│                                     leisure: find-nearby                     │
│                                     mcp: mcporter, native-mcp                │
│                                     media: gif-search, heartmula, songsee,   │
│                                     youtube-content                          │
│                                     mlops: audiocraft-audio-generation,      │
│                                     axolotl, clip, dsp...                    │
│                                     note-taking: obsidian                    │
│                                     openclaw-imports: find-skills,           │
│                                     gemini-api-dev, gemini-interaction...    │
│                                     productivity: google-workspace, linear,  │
│                                     nano-pdf, notion, ocr...                 │
│                                     red-teaming: godmode                     │
│                                     research: arxiv, blogwatcher,            │
│                                     polymarket, research-paper-...           │
│                                     smart-home: openhue                      │
│                                     social-media: xitter                     │
│                                     software-development: plan,              │
│                                     requesting-code-review,                  │
│                                     subagent-driven-d...                     │
│                                                                              │
│                                     30 tools · 74 skills · /help for         │
│                                     commands                     