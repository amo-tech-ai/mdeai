## Phase 4 — DingTalk Integration (if selected)

Skip this phase entirely if the user chose No in Phase 0.4.

### 4.1 Install Official DingTalk Plugin

Use the **official** DingTalk plugin maintained by the DingTalk team.
Do NOT use the community version `soimy/openclaw-channel-dingtalk` —
it has ID mismatches and may cause connection failures.

**macOS / Linux:**
```bash
NPM_CONFIG_REGISTRY=https://registry.npmmirror.com \
  openclaw plugins install @dingtalk-real-ai/dingtalk-connector
```

**Windows (PowerShell):**
```powershell
$env:NPM_CONFIG_REGISTRY = "https://registry.npmmirror.com"
openclaw plugins install @dingtalk-real-ai/dingtalk-connector
```

If plugin installation fails due to network issues, fix manually:

macOS / Linux:
```bash
cd ~/.openclaw/extensions/dingtalk-connector
rm -rf node_modules package-lock.json
NPM_CONFIG_REGISTRY=https://registry.npmmirror.com npm install
```

Windows (PowerShell):
```powershell
Set-Location "$env:USERPROFILE\.openclaw\extensions\dingtalk-connector"
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
$env:NPM_CONFIG_REGISTRY = "https://registry.npmmirror.com"
npm install
```

### 4.2 Guide User Through DingTalk Developer Console via Browser

Use the browser MCP to open each step directly. Wait for the user to confirm
each step before proceeding.

**Step 1 — Open DingTalk Developer Console:**
Open via browser: `https://open-dev.dingtalk.com/`
Tell the user: "I've opened the DingTalk Developer Console. Please log in
and let me know when you're in."

**Step 2 — Create app:**
Open via browser: `https://open-dev.dingtalk.com/fe/app`
Tell the user: "Click Create App → Enterprise Internal App. Fill in any name
(e.g. My OpenClaw Bot) and save. Let me know when done."

**Step 3 — Add required permissions:**
Tell the user: "In your app, go to Permissions and add these three:
- Card.Streaming.Write
- Card.Instance.Write
- qyapi_robot_sendmsg
Let me know when done."

**Step 4 — Enable Robot:**
Tell the user: "Go to Add Capability → Robot, then App Features → Robot → Enable.
Let me know when done."

**Step 5 (CRITICAL) — Set Stream Mode:**
Tell the user: "Under robot settings, find Message Receive Mode and select
Stream Mode. Do NOT select Webhook. Stream Mode works without needing a
public IP address. Let me know when done."

**Step 6 — Publish:**
Tell the user: "Click Publish. Publishing to the test version is enough.
Let me know when done."

**Step 7 — Get credentials:**
Open via browser: `https://open-dev.dingtalk.com/fe/app#/corp/app`
Tell the user: "Go to your app → Basic Info → Credentials. You'll see
a Client ID (AppKey) and Client Secret (AppSecret). Please paste both here."

### 4.3 Write DingTalk Config

After the user provides AppKey and AppSecret, update `~/.openclaw/openclaw.json`.
Read the existing file, merge in the DingTalk fields, and write back.

Key points:
- Channel key is `dingtalk-connector` (NOT `dingtalk`)
- `plugins.allow` must contain `"dingtalk-connector"` (not `"dingtalk"`)
- `gatewayToken` must match `gateway.auth.token` from Phase 2.2 — read it from
  the existing config and copy it here automatically

The final config must include these sections (merged with existing content):

```json
{
  "plugins": {
    "enabled": true,
    "allow": ["dingtalk-connector"]
  },
  "channels": {
    "dingtalk-connector": {
      "clientId": "USER_APP_KEY",
      "clientSecret": "USER_APP_SECRET",
      "gatewayToken": "SAME_VALUE_AS_gateway.auth.token",
      "sessionTimeout": 1800000
    }
  },
  "gateway": {
    "mode": "local",
    "auth": {
      "mode": "token",
      "token": "SAME_TOKEN_AS_ABOVE"
    },
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  }
}
```

### 4.4 Post-Install Health Check

Restart the gateway and verify the plugin loaded:

```
openclaw gateway restart
openclaw plugins list
```

Confirm `dingtalk-connector` appears in the list.

**Watch for auto-restart loop:**
After restart, monitor the gateway log for 15 seconds:

macOS / Linux:
```bash
openclaw logs --follow &
LOG_PID=$!
sleep 15
kill $LOG_PID 2>/dev/null
```

Windows (PowerShell):
```powershell
$job = Start-Job { openclaw logs --follow }
Start-Sleep 15
Stop-Job $job
Receive-Job $job
```

If you see repeated "auto-restart attempt" messages (connection dies within 1-2
seconds repeatedly), the DingTalk plugin may have a lifecycle compatibility issue
with this version of OpenClaw. Tell the user:

> "The DingTalk plugin appears to be disconnecting immediately and restarting.
> This is a known issue with some versions of the plugin. Please try:
> 1. Run: openclaw plugins install @dingtalk-real-ai/dingtalk-connector
>    (to get the latest version)
> 2. Restart the gateway: openclaw gateway restart
> If it persists, check https://open.dingtalk.com/document/dingstart/install-openclaw-locally
> for the latest plugin version."

### 4.5 Test

Tell the user:
> "Open DingTalk, search for your bot by the app name you created, and send
> it a message like 'hello'. If it replies, you're all set!"

---

