## Phase 5 — Verification

### 5.1 If an IM platform was set up

Guide user to send a test message in the platform they chose:
- **DingTalk**: Search for the bot by app name, send 'hello'
- **Feishu**: Find the app in Workspace or search, send 'hello'
- **QQ**: Find the bot, send a message
- **Discord**: Go to the server, @mention or DM the bot

Success = bot responds coherently.

### 5.2 If all IM platforms were skipped — use Browser MCP

Use the browser MCP to open the OpenClaw web console with the token pre-filled.
This avoids the auth lockout caused by manual token entry failures.

**Step 1 — Read the gateway token from config:**

macOS / Linux:
```bash
python3 -c "
import json
with open('$HOME/.openclaw/openclaw.json') as f:
    d = json.load(f)
print(d.get('gateway', {}).get('auth', {}).get('token', 'not found'))
"
```

Windows (PowerShell):
```powershell
$config = Get-Content "$env:USERPROFILE\.openclaw\openclaw.json" | ConvertFrom-Json
$config.gateway.auth.token
```

**Step 2 — Open console via browser with token:**
```
browser.navigate("http://127.0.0.1:18789?token=GATEWAY_TOKEN_HERE")
```
Tell the user: "I'm opening the OpenClaw console for you now..."

**Step 3 — Send a test message in the console**

Success = agent responds coherently.

If the console shows "unauthorized: too many failed authentication attempts":
```
openclaw gateway restart
```
Then retry Step 2.

### 5.3 Success Message

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  OpenClaw is ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AI Model:    [Provider + version]
  Skills:      [X] skills installed
  Chat via:    [DingTalk / Feishu / QQ / Discord / Web Console]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

