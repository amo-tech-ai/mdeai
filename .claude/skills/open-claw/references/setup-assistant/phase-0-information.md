## Phase 0 — Information Collection (REQUIRED before any action)

Collect ALL of the following before doing anything. Do not start installation until
the user confirms the summary in Phase 0.6.

### 0.1 Deployment Target

Ask the user:
> "Where would you like to install OpenClaw?"
> - On this computer (local)
> - On a remote server (cloud / VPS)

If remote server selected, also collect:
- Server IP address
- SSH username
- SSH port (default: 22)
- SSH key or password auth

### 0.2 Operating System

Auto-detect if local:
```
uname -s 2>/dev/null || echo "windows"
```
- `Darwin` → macOS
- `Linux` → Linux (check distro: `cat /etc/os-release | grep ID=`)
- command fails or returns anything else → Windows

If remote or auto-detect fails, ask the user to select their OS.

**Store the detected OS. Use it exclusively for all subsequent steps.**

### 0.3 AI Model Provider

Ask:
> "Do you have an AI model API Key ready?"
> - Yes — I have one
> - No — I need help getting one

**If Yes**, ask which provider:
> - Anthropic (Claude)
> - OpenAI (GPT)
> - DeepSeek ← recommended for China users, most stable access
> - Alibaba Bailian — Standard version (DashScope)
> - Alibaba Bailian — Coding Plan ← free quota, best for getting started
> - Other

Then ask them to paste their API Key. Display it masked (show only last 4 chars).

**If the user selects Alibaba Bailian**, ask which version:
> - Standard version (DashScope)
> - Coding Plan (free quota, apply at https://www.aliyun.com/benefit/scene/codingplan)

The two versions have different baseUrl, provider name, and config format.
See Phase 2.2 for the correct template for each.

**If No API Key**, respond:
> "No problem! Two easy options:
> - DeepSeek — sign up at platform.deepseek.com, about 2 minutes, has a free trial
> - Alibaba Bailian Coding Plan — free quota, apply at:
>   https://www.aliyun.com/benefit/scene/codingplan
> Which would you like? I'll wait while you sign up."

**If the user chooses Alibaba Bailian Coding Plan and needs help purchasing:**

Walk them through step by step:
1. Open https://bailian.console.aliyun.com/ — log in with your Alibaba Cloud account
2. Find "Coding Plan" or "订阅套餐" in the console
3. Two plans available:
   - **Lite (基础版)** — ¥7.9 first month (¥40/month after), 18,000 requests/month
   - **Pro (高级版)** — ¥39.9 first month (¥200/month after), 90,000 requests/month
   - For getting started, Lite is enough.
4. Complete payment
5. Go to "密钥管理" (API Keys) → "创建 API Key"
6. **Copy the key immediately** — it won't be shown again after you close the page
7. The key format looks like `sk-sp-xxxxx`

Tell the user: "Paste your API Key here when you have it. I'll wait."

### 0.4 IM Platform Integration (Optional)

Ask:
> "Would you like to connect OpenClaw to a chat app so you can talk to it
> from your phone or desktop? Pick one (you can add more later):"
> - DingTalk (钉钉) ← recommended, best supported
> - Feishu (飞书)
> - QQ
> - Discord
> - No, skip for now — I'll use the web console

If DingTalk selected, tell the user:
> "Great choice — DingTalk has the smoothest setup. I'll guide you through
> the DingTalk Developer Console step by step using the browser — you won't
> need to find anything yourself."
> (Credentials collected during Phase 4)

If Feishu selected, tell the user:
> "I'll walk you through the Feishu Open Platform step by step."
> (Credentials collected during Phase 4B)

If QQ selected, tell the user:
> "I'll guide you through the QQ Open Platform setup."
> (Credentials collected during Phase 4C)

If Discord selected, tell the user:
> "I'll walk you through the Discord Developer Portal."
> (Credentials collected during Phase 4D)

### 0.5 Use Case / Skills Selection

Ask:
> "What do you mainly want to use OpenClaw for? Pick one or more:"
> - Daily Productivity Assistant — docs, scheduling, notes
> - Information Tracker — news, research, web monitoring
> - Efficiency Tools — task automation, reminders, workflows
> - Stock Market Analysis — A-shares, US stocks, market news

### 0.5b How It All Fits Together

Before confirming, show the user this quick overview so they understand what
they're about to set up:

```
┌─────────────────────────────────────────────────────┐
│  You (or your team)                                 │
│  Chat via: DingTalk / Feishu / QQ / Discord / Web   │
└──────────────────────┬──────────────────────────────┘
                       │  messages
                       ▼
┌─────────────────────────────────────────────────────┐
│  OpenClaw Gateway (runs on your computer)           │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Skills     │  │  Plugins   │  │  IM Channels │  │
│  │  (what it   │  │  (DingTalk │  │  (connects   │  │
│  │   can do)   │  │   Feishu…) │  │   to you)    │  │
│  └────────────┘  └────────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │  sends your request
                       ▼
┌─────────────────────────────────────────────────────┐
│  AI Model API (DeepSeek / Claude / Bailian / GPT)   │
│  (the brain that thinks and responds)               │
└─────────────────────────────────────────────────────┘
```

Tell the user: "This is the big picture — you chat through an app, OpenClaw
handles the logic on your computer, and an AI model does the thinking. Now
let's confirm your setup plan."

### 0.6 Confirmation Summary

Display before doing ANYTHING:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  OpenClaw Setup — Confirm Your Plan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Target:       [Local / Remote: IP]
  OS:           [Detected OS]
  AI Model:     [Provider + version, key: ****XXXX]
  DingTalk:     [Enabled / Skipped]
  Use Cases:    [Selected scenarios]
  Skills:       [List of skills to install]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Ready? This will take about 3-5 minutes.
  [ Yes, let's go ]   [ Edit my choices ]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Do not proceed until the user confirms.**

---

