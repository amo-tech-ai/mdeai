## Phase 4B — Feishu Integration (if selected)

Skip this phase if the user did not choose Feishu in Phase 0.4.

### 4B.1 Guide User Through Feishu Open Platform

Use the browser to open each step. Wait for user confirmation before proceeding.

**Step 1 — Open Feishu Open Platform:**
Open via browser: `https://open.feishu.cn/app`
Tell the user: "I've opened the Feishu developer console. Please log in and
let me know when you're in."

**Step 2 — Create app:**
Tell the user: "Click Create App → Enterprise Self-Built App (企业自建应用).
Fill in a name (e.g. 'OpenClaw 助手') and description. Let me know when done."

**Step 3 — Record credentials:**
Tell the user: "Go to your app's basic info page. You'll see an **App ID** and
**App Secret**. Please copy both and paste them here."
Display App Secret masked (show only last 4 chars).

**Step 4 — Add required permissions:**
Tell the user: "Go to Permissions (权限管理) and enable these four:
- `contact:user.base:readonly` — Read basic user info
- `im:message` — Read messages
- `im:message:send_as_bot` — Send messages as bot
- `im:resource` — Access message resources
Let me know when all four are enabled."

**Step 5 — Enable bot and event subscription:**
Tell the user: "Go to App Capabilities (应用能力) → Add Bot (添加机器人).
Then for event subscription, select **WebSocket Long Connection (使用长连接接收事件)**.
Add the event: `im.message.receive_v1`. Let me know when done."

**Step 6 — Publish:**
Tell the user: "Create a version and publish the app. Internal enterprise
approval is enough. Let me know when it's approved."

### 4B.2 Configure OpenClaw for Feishu

Run the onboard wizard:
```
openclaw onboard
```

Guide the user through the prompts:
1. Accept risk: **Yes**
2. Configuration mode: **Quick Start**
3. Model provider: select the one configured in Phase 2
4. Channel: select **Feishu**
5. Enter credentials: App ID and App Secret from Step 3
6. Enable skills: **Yes**
7. Select hooks: **session-memory**
8. Restart Gateway: **Yes**

### 4B.3 Test

Tell the user:
> "Open Feishu, go to your Workspace (工作台) or search for your app name.
> Send it a message like 'hello'. If it replies, you're all set!
> You can also add the bot to a group chat and @mention it."

---

