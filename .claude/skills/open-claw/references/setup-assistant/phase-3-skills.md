## Phase 3 — Install Skills

Skills are installed using the **clawhub CLI**.
The correct command is `npx clawhub@latest install <slug>`.
Do NOT use `openclaw skills install` — that command does not exist.

Install only from the official `openclaw/skills` repository for security.

**If `npx clawhub@latest install` fails with GitHub API rate limit (403):**
Fall back to manual install — download SKILL.md directly:

macOS / Linux:
```bash
mkdir -p ~/.openclaw/skills/<skill-name>
curl -fsSL https://raw.githubusercontent.com/openclaw/skills/main/<skill-name>/SKILL.md \
  -o ~/.openclaw/skills/<skill-name>/SKILL.md
```

Windows (PowerShell):
```powershell
$skill = "<skill-name>"
$dir = "$env:USERPROFILE\.openclaw\skills\$skill"
New-Item -ItemType Directory -Path $dir -Force | Out-Null
Invoke-WebRequest `
  -Uri "https://raw.githubusercontent.com/openclaw/skills/main/$skill/SKILL.md" `
  -OutFile "$dir\SKILL.md"
```

After all skills are installed, restart the gateway:
```
openclaw gateway restart
```

---

### Daily Productivity Assistant

```
npx clawhub@latest install summarize
npx clawhub@latest install weather
npx clawhub@latest install agent-browser
npx clawhub@latest install obsidian
```

- **summarize** — Summarize any document, webpage, or article
- **weather** — Real-time weather, no API key needed
- **agent-browser** — Browse and extract content from any webpage
- **obsidian** — Manage your local Obsidian notes

### Information Tracker

```
npx clawhub@latest install agent-browser
npx clawhub@latest install summarize
npx clawhub@latest install weather
npx clawhub@latest install proactive-agent
```

- **agent-browser** — Monitor websites for changes
- **summarize** — Condense long articles into key points
- **weather** — Daily weather briefings
- **proactive-agent** — Schedule automated tasks and alerts

### Efficiency Tools

```
npx clawhub@latest install agent-browser
npx clawhub@latest install self-improving-agent
npx clawhub@latest install proactive-agent
npx clawhub@latest install summarize
```

- **agent-browser** — Automate repetitive browser tasks
- **self-improving-agent** — OpenClaw learns and adapts to your habits
- **proactive-agent** — Triggers like "every Monday at 9am, send me a summary of..."
- **summarize** — Quick digests of any content

### Stock Market Analysis

```
npx clawhub@latest install a-share-real-time-data
npx clawhub@latest install stock-evaluator
npx clawhub@latest install agent-browser
npx clawhub@latest install summarize
```

- **a-share-real-time-data** — Real-time A-share data via TDX protocol
- **stock-evaluator** — Technical + fundamental analysis with Buy/Hold/Sell signals
- **agent-browser** — Pull market news from financial sites
- **summarize** — Condense earnings reports and analyst notes

> Note: Stock analysis is for reference only. Not investment advice.

---

