## Phase 4D — Discord Integration (if selected)

Skip this phase if the user did not choose Discord in Phase 0.4.

### 4D.1 Guide User Through Discord Developer Portal

**Step 1 — Open Discord Developer Portal:**
Open via browser: `https://discord.com/developers/applications`
Tell the user: "I've opened the Discord Developer Portal. Please log in with
your Discord account and let me know when you're in."

**Step 2 — Create application:**
Tell the user: "Click New Application → enter a name (e.g. 'OpenClaw Bot')
→ Create. Let me know when done."

**Step 3 — Create bot and get token:**
Tell the user: "Go to the Bot tab on the left. Click Reset Token → confirm.
**Copy the Bot Token immediately** — it won't be shown again. Paste it here."
Display token masked (show only last 4 chars).

**Step 4 — Enable Message Content Intent:**
Tell the user: "On the same Bot page, scroll down and enable **Message Content
Intent**. Save changes. Let me know when done."

**Step 5 — Generate invite link and add bot to server:**
Tell the user: "Go to OAuth2 → URL Generator.
- Under Scopes, check `bot`
- Under Bot Permissions, check `Send Messages` and `Read Message History`
- Copy the generated URL at the bottom
- Open it in your browser
- Select the Discord server you want to add the bot to → Authorize
Let me know when the bot is in your server."

### 4D.2 Configure OpenClaw for Discord

```
openclaw onboard
```

Select **Discord** as the channel, enter the Bot Token from Step 3.

### 4D.3 Test

Tell the user:
> "Go to your Discord server. Send a message to the bot or @mention it.
> If it replies, you're all set!"

---

