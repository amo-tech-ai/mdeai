## Phase 6 — Usage Tutorials (Optional)

After verification, ask:
> "Would you like a quick tutorial for any of the skills you just installed?"

Provide 3 example prompts per skill.

### summarize
- "Summarize this article: [paste URL]"
- "Give me the key points of this document" (attach a file)
- "What are the main takeaways?" (paste any text)

### weather
- "What's the weather in Beijing today?"
- "Will it rain in Shanghai this week?"
- "Give me a 3-day forecast for Hangzhou"

### agent-browser
- "Go to sspai.com and tell me the top 3 articles today"
- "Check if there are any new announcements on [website]"
- "Extract the product list from this page: [URL]"

### proactive-agent
- "Every morning at 8am, give me today's weather and top news"
- "Remind me every Monday to review my weekly tasks"
- "Check this website every day and alert me if the price drops below 500 yuan"

### a-share-real-time-data
- "What's the current price of 000001 (Ping An Bank)?"
- "Show me today's real-time data for 600036"
- "Get the last 5 trading days of bar data for 300750"

### stock-evaluator
- "Evaluate 600519 (Moutai) — is it a buy right now?"
- "Give me a technical and fundamental analysis of BYD stock"
- "Should I hold or sell 000858 based on current indicators?"

### self-improving-agent
- "Learn from our last 10 conversations and tell me how I can use you better"
- "What patterns have you noticed in the tasks I ask you?"
- "Optimize yourself based on what's been most useful to me"

### obsidian
- "Create a new note called 'Project Ideas' in my vault"
- "Search my notes for anything related to Q2 planning"
- "Add today's meeting summary to my Daily Notes"

---

## Error Handling Reference

| Error | Plain explanation | Fix |
|-------|------------------|-----|
| SyntaxError: Unexpected token | Node.js version too old | Upgrade to Node 22 via nvm/fnm |
| EACCES: permission denied | npm install folder issue (macOS/Linux) | Run npm-global fix in Phase 1 |
| gateway.mode required / allow-unconfigured | Config missing gateway section | Add `gateway.mode: "local"` to config |
| Timed out waiting for gateway | Gateway didn't start | Check config file, run `openclaw doctor` |
| device token mismatch | Config corrupted after update | Run `openclaw gateway reset` |
| pairing required | Need to re-pair after update | Run `openclaw pairing approve` |
| 401 Unauthorized from DingTalk bot | gatewayToken missing or wrong | Check channels.dingtalk-connector.gatewayToken matches gateway.auth.token |
| 405 Method Not Allowed | chatCompletions endpoint not enabled | Add `gateway.http.endpoints.chatCompletions.enabled: true` |
| dingtalk-connector not in plugins list | plugins.allow not set | Add "dingtalk-connector" to plugins.allow array |
| npm install stuck / slow | npm registry slow from China | Already set npmmirror — retry |
| running scripts is disabled (Windows) | ExecutionPolicy blocking scripts | Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned |
| not recognized as cmdlet | fnm or openclaw not in PATH | Reload PATH from Phase 1-win steps |
| GitHub 403 rate limit on clawhub install | GitHub API anonymous rate limit exceeded | Use manual SKILL.md download fallback in Phase 3 |
| auto-restart attempt loop (DingTalk) | Plugin lifecycle incompatibility | Update plugin, see Phase 4.4 |
| too many failed authentication attempts | Web console auth lockout | Run `openclaw gateway restart`, then open with token via browser |
| Feishu bot not responding | App not published or permissions missing | Check all 4 permissions are enabled, app is published and approved |
| Feishu `im.message.receive_v1` not firing | Event subscription not configured | Ensure WebSocket long connection mode selected, event added |
| QQ `insufficient scope` or bot silent | IP whitelist missing your IP | Add server/computer public IP to QQ bot whitelist |
| QQ bot credentials invalid | Secret copied wrong or expired | Re-create bot secret on QQ Open Platform |
| Discord bot not responding | Message Content Intent not enabled | Enable Message Content Intent in Bot settings |
| Discord `Missing Access` | Bot not invited or missing permissions | Re-generate invite URL with Send Messages + Read Message History |
| health check returns connection refused | Gateway not running or wrong port | Run `openclaw gateway status`, restart if needed |

For any error not listed:
1. Run `openclaw doctor --fix`
2. Run `openclaw logs --tail 50`
3. Explain the last error line in plain language
4. Suggest next step

---

## Post-Installation — Daily Maintenance Quick Reference

After OpenClaw is installed and running, users may come back to ask for help with
day-to-day maintenance. Use this section as a quick reference to handle common
post-installation requests.

### Health Check — "Is my OpenClaw still running?"

Run these in order and report results in plain language:

```
openclaw gateway status
openclaw doctor
curl http://127.0.0.1:18789/health   # macOS/Linux
# or: (Invoke-WebRequest http://127.0.0.1:18789/health).Content   # Windows
```

If gateway is stopped:
```
openclaw gateway start
```

If gateway is running but not responding:
```
openclaw gateway restart
```

If `openclaw doctor` reports issues:
```
openclaw doctor --fix
```

Always explain what happened in one plain sentence, e.g.:
> "Your OpenClaw gateway had stopped — probably because your computer restarted.
> I've started it back up, and it's running normally now."

### Install New Skills — "I want my OpenClaw to learn something new"

Use the same method from Phase 3:

```
npx clawhub@latest install <skill-name>
openclaw gateway restart
```

If GitHub rate-limited, fall back to manual download (see Phase 3 fallback).

To see what's currently installed:
```
openclaw skills list
```

Popular skills to suggest if the user isn't sure what to add:

| Want to... | Skill | What it does |
|------------|-------|-------------|
| Browse the web | agent-browser | Read and extract content from any webpage |
| Get weather | weather | Real-time weather, no API key needed |
| Summarize anything | summarize | Condense documents, articles, webpages |
| Automate routines | proactive-agent | Schedule tasks like "every Monday, send me..." |
| Track A-shares | a-share-real-time-data | Real-time stock data via TDX protocol |

### Change AI Model — "I want to switch to a different model"

1. Read current config:
```
cat ~/.openclaw/openclaw.json           # macOS/Linux
Get-Content "$env:USERPROFILE\.openclaw\openclaw.json"   # Windows
```

2. Update the `models.providers` section with the new provider template
   (refer to Phase 2.2 templates A–E)

3. Update `agents.defaults.model.primary` to match the new provider/model

4. Restart:
```
openclaw gateway restart
```

### Add a Chat Channel — "I also want to use it on Feishu/Discord/QQ"

Follow the corresponding Phase 4 section (4B for Feishu, 4C for QQ, 4D for Discord).
The process is the same as initial setup — install the plugin, collect credentials,
write config, restart gateway.

### View Logs — "Something went wrong, help me check"

```
openclaw logs --tail 50
```

Read the last few lines, translate any errors into plain language, and suggest a fix.
If the error matches the Error Handling Reference table above, follow that fix directly.

### Update OpenClaw — "Is there a newer version?"

```
openclaw --version
npm install -g openclaw@latest
openclaw doctor --fix
openclaw gateway restart
```

After updating, always run `openclaw doctor --fix` to apply any migrations.

---

## Tone Guidelines

- Use encouraging language: "Great, that worked!", "Almost there!", "You're all set!"
- Explain what each step does in one plain sentence before running it
- Never show raw stack traces — translate all errors into plain language
- When waiting for the user (DingTalk console steps), say explicitly: "I'll wait here"
- When using browser MCP, narrate: "I'm opening the page for you now..."
- Don't use jargon like daemon, symlink, or PATH without a plain explanation
- Don't run multiple phases at once — confirm one phase before starting the next
- Never mix OS-specific commands — once the OS is set, stay in that OS's lane
