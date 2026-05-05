Fetching all the Hostinger docs in parallel now.

Good research haul. Here's what the sources reveal, organized into a decision you can actually act on.

---

## Critical clarification first: ChatGPT subscription ≠ API access

A ChatGPT Plus subscription ($20/mo) gives you access to **chatgpt.com** — the chat interface. It does **not** give OpenClaw, Hermes, or Paperclip the ability to call OpenAI's models programmatically. These tools need an **API key**, which is a separate OpenAI account with billing (pay-per-token, no monthly fee). The subscription is irrelevant here — cancel or ignore it for this purpose.

Your real model choices are:

|Provider|API key source|Cost|
|---|---|---|
|**Anthropic (Claude)**|console.anthropic.com|Pay per token (~$3/M input, $15/M output for Sonnet 4.6)|
|**OpenAI**|platform.openai.com|Pay per token (~$2.50/M input for GPT-4o)|
|**OpenRouter**|openrouter.ai|Routes to 200+ models (Claude, GPT-4o, Gemini, local) from one key|
|**Hostinger managed credits**|Included in $5.99/mo plan|Their credits, their model choice — opaque|

**Recommendation: Claude API key.** mdeai already runs on Gemini (via Supabase edge fns). For the trio VPS layer, Claude Sonnet 4.6 is what the ecosystem is best documented for, what our `02-openclaw-strategy.md` and `12-ai-events-features.md` both specify, and what the YouTube "Paperclip + Hermes + OpenClaw + Claude is INSANE!" demo (the most-cited real-world combo) uses.

---

## How the trio actually fits together

```
PAPERCLIP  ← the company (org chart, budgets, approvals, audit trail)
    ↓ issues/tasks
HERMES     ← the brain (reasoning, memory, self-improving skill files)
    ↓ approved actions
OPENCLAW   ← the hands (WhatsApp, Telegram, browser, email, cron)
    ↓ delivery receipts
SUPABASE   ← source of truth (mdeai DB — the source of truth for everything)
```

- **OpenClaw alone** = what we use in Phase 1-2 (tasks 021, 067-070). Good enough for WhatsApp concierge, leaderboard broadcasts, outreach.
- **+ Hermes** = Phase 3. Hermes builds a memory of past campaigns, auto-creates skills from repeated workflows ("every Monday send leaderboard update to WA Community" becomes a persistent skill file).
- **+ Paperclip** = Phase 4. Paperclip governs multi-agent teams, enforces per-event budgets (e.g. "max $50 Claude API spend for Reina de Antioquia 2026"), provides immutable audit trail for sponsor money decisions.

**Don't try to run all three on day one.** Paperclip with no agents is an empty org chart. Hermes without data has nothing to learn from. Ship OpenClaw Phase 1 first.

---

## Three deployment options

### Option A — Hostinger Managed OpenClaw ($5.99/mo)

**What you get:** 60-second deploy, WhatsApp + Telegram included, Hostinger's AI credits pre-loaded (no API key needed), zero Docker knowledge required.

**What you give up:** Their credit system runs an unspecified model (not Claude). No Hermes or Paperclip on this plan. No access to your own API key for the first tier. No root access to customize.

**Best for:** Testing OpenClaw in the next 48 hours before committing. Or if you just want WhatsApp/Telegram automation and don't care which LLM is under the hood.

**The week you'd live:** Day 1 — buy plan, connect WhatsApp, send "Hi" to verify. Day 2 — leaderboard broadcast working for a test contest. Week 1 — switch to bring-your-own Claude key on the VPS tier when you hit credit limits.

---

### Option B — Hostinger VPS, all three tools, Claude API key ($8.99/mo + Claude API ~$20-50/mo)

**What you get:** One KVM 2 VPS (2 vCPU, 8GB RAM, 100GB NVMe) running all three tools as Docker containers. Hostinger's hPanel gives you one-click deploy for each + Browser Terminal for config. Bring your own Claude API key — full model control.

**The math:**

```
Hostinger KVM 2:      $8.99/mo
Claude API (Phase 2): ~$20-50/mo  (estimated in 02-openclaw-strategy.md)
Total:                ~$30-60/mo
```

**Can all three fit on one KVM 2?**

- OpenClaw: ~500MB RAM
- Hermes: ~500MB RAM
- Paperclip: ~1-1.5GB RAM (Node.js + React)
- Total: ~2.5GB — fits in 8GB with 5.5GB headroom for Claude API response buffers + OS

**Yes, one KVM 2 runs all three.** Run them via Docker Compose with an nginx proxy routing ports. Hostinger's hPanel makes this manageable without a DevOps background.

**The week you'd live:**

- Day 1: Deploy OpenClaw via hPanel → 10 min → connect Claude API key → WhatsApp concierge live (task 068)
- Day 2: Deploy Hermes via hPanel → connect same Claude key → `hermes claw migrate` imports OpenClaw conversation history
- Day 3: Deploy Paperclip → configure one "mdeai events" company → assign OpenClaw as worker agent
- Day 5: mdeai Supabase sends approved campaign jobs to OpenClaw VPS via HMAC webhook (task 064)
- Week 2: Hermes is already building skill files from repeated leaderboard broadcasts

**What you give up:** You manage the VPS. If a Docker container crashes at 2am, no one restores it for you. Hostinger doesn't offer managed Hermes or Paperclip — only managed OpenClaw.

---

### Option C — Hetzner CX21 (~$6/mo) + all three, self-managed

This is what `02-openclaw-strategy.md` and `02-openclaw-growth.md` originally specified. Cheaper server ($6 vs $8.99), Frankfurt datacenter (lower latency to mdeai's European user base if any), but **no one-click deploy** — you configure Docker manually.

**Best if:** You or a dev are comfortable with Docker Compose and want to save $3/mo and avoid Hostinger lock-in. Not recommended as your first VPS.

---

## Recommendation

**Start with Option B (Hostinger VPS, $8.99/mo, Claude API key).** Here's the reasoning chain:

1. **Hostinger's one-click Docker catalog** removes the biggest friction: setting up Docker + nginx + SSL on a blank VPS. That's 3-6 hours of DevOps work vs 10 minutes.
2. **Claude API** over ChatGPT API: our entire mdeai stack is documented around Claude behavior (the Gemini SDK tasks assume Claude-style reasoning). OpenClaw's most-cited production demos use Claude. Claude's tool-use is stronger for multi-step agentic tasks than GPT-4o at equivalent cost.
3. **One VPS, three tools** is cheaper than three separate VPS instances ($8.99 once vs $26.97/mo for three). The KVM 2 spec handles it.
4. **Don't use ChatGPT subscription at all** for this. API keys only. OpenRouter is a useful fallback (one key → 200 models) but Claude direct gives you cleaner token accounting for the `ai_runs` logging we already have.

**Phase timeline matching tasks already written:**

|Phase|What to run|Monthly cost|Task files|
|---|---|---|---|
|Phase 1 now|Hostinger Managed OpenClaw (test)|$5.99|021, 068|
|Phase 2|Hostinger VPS + OpenClaw + Claude API|~$30|064, 067, 068, 069, 070|
|Phase 3|+ Hermes on same VPS|~$35|(trio doc)|
|Phase 4|+ Paperclip on same VPS|~$40|(trio doc)|

The managed plan is fine to prove WhatsApp works today. Upgrade to VPS + Claude key the moment you need Hermes memory or Paperclip governance — both are one hPanel click away.

---

Sources:

- [Hostinger OpenClaw](https://www.hostinger.com/openclaw)
- [OpenClaw Hostinger install docs](https://docs.openclaw.ai/install/hostinger)
- [Hostinger Hermes Agent VPS](https://www.hostinger.com/vps/docker/hermes-agent)
- [Hostinger Paperclip VPS](https://www.hostinger.com/vps/docker/paperclip)
- [What is Hermes Agent — Hostinger](https://www.hostinger.com/tutorials/what-is-hermes-agent)
- [What is Paperclip AI — Hostinger](https://www.hostinger.com/tutorials/what-is-paperclip-ai)
- [Hermes Agent setup guide — Hostinger](https://www.hostinger.com/support/how-to-get-started-with-hermes-agent-at-hostinger/)
- [Paperclip setup guide — Hostinger](https://www.hostinger.com/support/how-to-get-started-with-the-paperclip-at-hostinger/)
- [OpenClaw vs Paperclip vs Hermes 2026 — xCloud](https://xcloud.host/openclaw-vs-paperclip-vs-hermes/)
- [OpenClaw vs Hermes vs Paperclip honest review — Rahul Goyal](https://rahulgoyal.co/justdraft/openclaw-vs-hermes-vs-paperclip-ai-agent-comparison/)
- [Paperclip + Hermes + OpenClaw + Claude — YouTube](https://www.youtube.com/watch?v=-vL8ivN-TV0)