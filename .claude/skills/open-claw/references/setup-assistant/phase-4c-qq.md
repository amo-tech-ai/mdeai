## Phase 4C — QQ Integration (if selected)

Skip this phase if the user did not choose QQ in Phase 0.4.

### 4C.1 Guide User Through QQ Open Platform

**Step 1 — Open QQ Open Platform:**
Open via browser: `https://q.qq.com/#/`
Tell the user: "I've opened the QQ Open Platform. **Important:** You need to
register an account here — you can't just log in with your regular QQ account.
Let me know when you're registered and logged in."

**Step 2 — Create bot:**
Tell the user: "Click Bot (机器人) → Create Bot (创建机器人). Fill in a name
and description. Let me know when done."

**Step 3 — Record credentials:**
Tell the user: "You'll see a **Bot ID** and **Bot Secret**. **Copy both
immediately** — the secret won't be shown again after you close the page.
Paste them here."
Display Bot Secret masked (show only last 4 chars).

**Step 4 — Add IP whitelist:**
Tell the user: "Go to your bot details → IP Whitelist. We need to add your
computer's public IP address."

Get the user's public IP:

macOS / Linux:
```bash
curl -s ifconfig.me
```

Windows (PowerShell):
```powershell
(Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing).Content
```

Tell the user: "Your public IP is [X.X.X.X]. Add this to the whitelist and
let me know when done."

### 4C.2 Configure OpenClaw for QQ

```
openclaw onboard
```

Select **QQ** as the channel, enter Bot ID and Bot Secret.

### 4C.3 Test

Tell the user:
> "Open QQ, find your bot, and send it a message. If it replies, you're all set!"

---

