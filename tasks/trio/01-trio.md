I searched current official docs, GitHub releases, and product pages. Latest verified updates I found:

- Hermes Agent latest release: `v0.12.0`, April 30, 2026.
- Paperclip latest release: `v2026.428.0`, April 28, 2026.
- OpenClaw: official docs/product pages are current, but I did not find a comparable official release/changelog page in the provided sources.

## Table 1: OpenClaw

| Feature | What it does | Core or Advanced | MDE/ILM use case | Real-world example | Setup difficulty | Risk / limitation | Review score /100 |
|---|---|---|---|---|---|---|---|
| WhatsApp/WebChat gateway Source: https://docs.openclaw.ai/concepts/features and https://docs.openclaw.ai/channels/whatsapp | Routes messages from WhatsApp, Telegram, Slack, Discord, WebChat, Signal, and more through one Gateway | Core | WhatsApp concierge and landlord/renter follow-up | Renter messages “2BR Laureles under $1,200” on WhatsApp and gets AI rental cards | Medium | WhatsApp is WhatsApp Web/Baileys-based; no built-in Twilio WhatsApp channel | 95 |
| Multi-agent routing Source: https://docs.openclaw.ai/concepts/multi-agent | Routes different senders/groups/workspaces to different agents with isolated sessions | Core | Separate renter, landlord, events, restaurants, and ops agents | Landlord DMs go to Host Ops Agent; renter DMs go to Rental Concierge | Medium | Replies still come from same WhatsApp number; true direct-chat isolation may require one agent per person | 92 |
| DM allowlists and pairing Source: https://docs.openclaw.ai/concepts/features and https://docs.openclaw.ai/channels/whatsapp | Restricts who can message the assistant and supports safer self-chat flows | Core | Prevent random WhatsApp users from triggering business automations | Only verified landlords can trigger listing-update workflows | Medium | Needs careful phone-number hygiene and onboarding controls | 90 |
| MCP bridge Source: https://docs.openclaw.ai/cli/mcp | Exposes OpenClaw conversations and message tools to MCP clients | Core | Let Codex/Hermes/Paperclip inspect or send channel messages | Paperclip opens an issue from a WhatsApp renter thread | Medium | Live queue exists only while MCP session is connected | 86 |
| Cron and heartbeat scheduling Source: https://docs.openclaw.ai/concepts/features | Runs recurring jobs and heartbeat workflows | Core | Follow-up reminders, stale lead checks, daily market digests | Every morning, send landlords unanswered-lead reminders | Medium | Needs monitoring so jobs do not silently fail | 84 |
| Browser automation, exec, sandboxing Source: https://docs.openclaw.ai/concepts/features | Lets agents use browser automation, shell execution, and sandboxed actions | Advanced | Scrape listing sources, verify URLs, check competitor inventory | Agent checks a FazWaz listing, extracts photos/prices, creates a review task | High | Broad execution power creates security risk; must sandbox and approve writes | 82 |
| Media in/out and voice Source: https://docs.openclaw.ai/concepts/features | Handles images, audio, video, documents, voice transcription, and TTS | Advanced | Landlord sends listing photos or voice notes; agent extracts details | Host sends apartment photos by WhatsApp and agent drafts listing copy | Medium | Quality depends on model/provider and file handling limits | 79 |
| Mobile nodes with Canvas/camera/location Source: https://docs.openclaw.ai/concepts/features | iOS/Android nodes support pairing, voice/chat, camera, location, Canvas, and device commands | Advanced | Field verification and neighborhood scouting | Agent uses location/photo context during an apartment visit | High | Mobile node maturity needs verification in your environment | 74 |
| Plugins and extra channels Source: https://docs.openclaw.ai/concepts/features | Adds Matrix, Mattermost, Microsoft Teams, Zalo, Nextcloud Talk, Twitch, and more | Advanced | Future multi-channel concierge beyond WhatsApp | Route corporate relocation leads from Teams to mdeai ops | Medium | Plugin maturity varies by channel | 73 |
| Workflow pipelines “Lobster” Source: https://docs.openclaw.ai/concepts/features | Docs mention skills, plugins, and workflow pipelines | Advanced | Could power multi-step rental verification workflows | “Scrape → normalize → dedupe → verify → notify ops” pipeline | Needs verification | Feature details unclear in docs; treat as experimental until validated | 66 |

## Table 2: Hermes Agent

| Feature | What it does | Core or Advanced | MDE/ILM use case | Real-world example | Setup difficulty | Risk / limitation | Review score /100 |
|---|---|---|---|---|---|---|---|
| Persistent memory + session search Source: https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/ | Stores curated `MEMORY.md`, `USER.md`, and searchable SQLite session history | Core | Remember user preferences, neighborhoods, budget, pet policy, landlord notes | “Sarah prefers Laureles, fast Wi-Fi, no noisy buildings” persists across chats | Medium | Built-in memory is intentionally small; deeper personalization needs external memory | 96 |
| Tools and toolsets Source: https://hermes-agent.nousresearch.com/docs/user-guide/features/tools/ | Built-in tools for web, browser, terminal, files, memory, delegation, messaging, cron, and more | Core | Reason over listings, call Supabase tools, inspect pages, draft workflows | Agent researches a listing, compares it to DB data, and drafts a recommendation | Medium | Tools must be tightly scoped in production | 93 |
| MCP integration Source: https://hermes-agent.nousresearch.com/docs/user-guide/features/overview/ | Connects Hermes to external MCP servers and internal APIs | Core | Connect Hermes to Supabase, Paperclip, OpenClaw, GitHub, Firecrawl | Hermes calls an MDE MCP tool to rank apartments from Postgres | Medium | Tool schemas and auth need careful design | 91 |
| API server Source: https://hermes-agent.nousresearch.com/docs/user-guide/features/overview/ | Exposes Hermes as an OpenAI-compatible HTTP endpoint | Core | Use Hermes behind the mdeai chat UI or Supabase Edge wrapper | `/api/ai/rank` calls Hermes through an OpenAI-style endpoint | Medium | Production auth, rate limits, and timeouts must be added | 89 |
| Browser automation Source: https://hermes-agent.nousresearch.com/docs/user-guide/features/overview/ and https://hermes-agent.nousresearch.com/docs/user-guide/features/tools/ | Navigates sites, fills forms, extracts information, with text/vision browser support | Advanced | Listing verification and competitor research | Agent opens Airbnb/FazWaz page and checks if price/photos match DB | High | Browser scraping can break, violate terms, or trigger anti-bot defenses | 86 |
| Cron scheduled tasks Source: https://hermes-agent.nousresearch.com/docs/user-guide/features/overview/ | Runs scheduled tasks and delivers results to platforms | Core | Daily market snapshots, lead summaries, stale listing checks | Every day at 8 AM, Hermes summarizes new listings in Laureles | Medium | Needs observability and retry policy | 85 |
| External memory providers Source: https://hermes-agent.nousresearch.com/docs/user-guide/features/memory-providers/ | Supports Honcho, OpenViking, Mem0, Hindsight, Holographic, RetainDB, ByteRover, Supermemory | Advanced | Long-term personalization and user taste modeling | Build a taste profile: “quiet street, workspace, under $1,100, likes cafes” | High | Only one external provider active at a time; data/privacy review needed | 84 |
| Provider routing, fallbacks, credential pools Source: https://hermes-agent.nousresearch.com/docs/user-guide/features/overview/ | Routes across providers, fails over, and rotates credentials | Core | Reliable AI for chat, ranking, vision, and scraping | Use fast cheap model for extraction, stronger model for lease risk review | Medium | Cost controls still need Paperclip/Supabase tracking | 83 |
| Autonomous Curator Source: https://github.com/NousResearch/hermes-agent/releases/tag/v2026.4.30 | Background agent grades, prunes, consolidates, and reports on skills | Advanced | Maintain MDE-specific skills: rental ranking, lead qualification, listing audit | Weekly curator report flags duplicate or stale MDE skills | Medium | New/self-maintaining behavior; use with review gates first | 78 |
| Google Meet / Spotify / ComfyUI plugins Source: https://github.com/NousResearch/hermes-agent/releases/tag/v2026.4.30 | Latest release adds Google Meet follow-up, Spotify tools, bundled ComfyUI and TouchDesigner-MCP | Advanced | Meeting follow-ups, media generation, concierge content | Record landlord onboarding call and create follow-up issue | High | Useful but not core to rental MVP | 70 |

## Table 3: Paperclip

| Feature | What it does | Core or Advanced | MDE/ILM use case | Real-world example | Setup difficulty | Risk / limitation | Review score /100 |
|---|---|---|---|---|---|---|---|
| Approval gates Source: https://docs.paperclip.ing/guides/board-operator/approvals and https://github.com/paperclipai/paperclip/releases/tag/v2026.416.0 | Keeps humans in control of risky actions and supports staged approvals | Core | Preview → confirm → apply for listings, payments, messages, and landlord actions | AI drafts WhatsApp reply; human approves before sending | Medium | Must define which actions require approval | 97 |
| Costs and budgets Source: https://docs.paperclip.ing/guides/board-operator/costs-and-budgets | Tracks token spend and enforces budget limits | Core | Prevent runaway AI spend across chat, scraping, and agents | Rental Concierge gets $20/day; scraper gets $10/day | Medium | Needs mapping to MDE cost centers | 94 |
| Execution policies Source: https://github.com/paperclipai/paperclip/releases/tag/v2026.416.0 | Issues can carry review/approval workflows with multi-stage signoff | Core | Legal, payment, listing approval, and data integrity gates | Lease-risk agent proposes “reject listing”; ops manager signs off | Medium | Policy design can become heavy if overused | 93 |
| Structured issue-thread interactions Source: https://github.com/paperclipai/paperclip/blob/master/releases/v2026.427.0.md | Agents can post suggested tasks, forms, and confirmation cards into issue threads | Core | Convert AI proposals into auditable ops tasks | “Need landlord phone?” card asks ops for missing data | Medium | Latest feature; needs workflow testing | 90 |
| Blocker dependencies + sub-issues Source: https://github.com/paperclipai/paperclip/releases/tag/v2026.416.0 and https://github.com/paperclipai/paperclip/blob/master/releases/v2026.427.0.md | Tracks blocked issues and dependency-aware checklists | Core | Lead-to-lease workflow tracking | “Payment setup” blocks “confirm booking”; agent wakes when resolved | Medium | Requires disciplined issue modeling | 88 |
| Multi-user access and invite flows Source: https://github.com/paperclipai/paperclip/blob/master/releases/v2026.427.0.md | Shared authenticated control plane with company memberships and invites | Core | Let founder, ops, contractors, and agents share the board | Invite listing verifier to only MDE Listings company | Medium | Access control must be audited | 87 |
| Run liveness and recovery Source: https://github.com/paperclipai/paperclip/blob/master/releases/v2026.427.0.md | Records run liveness, continuation hints, watchdogs, and recovery decisions | Advanced | Recover failed scraping, lead follow-up, or ranking jobs | Listing scraper stalls; Paperclip opens recovery issue | High | Recovery automation needs guardrails | 84 |
| Pause/resume agents and issue subtrees Source: https://github.com/paperclipai/paperclip/releases/tag/v2026.428.0 and https://github.com/paperclipai/paperclip/blob/master/releases/v2026.427.0.md | Operators can pause agents and hold/cancel/restore issue trees | Core | Stop bad automation quickly | Pause WhatsApp agent during bad prompt or provider outage | Low-Medium | Must train ops to use pause paths | 84 |
| Productivity review Source: https://github.com/paperclipai/paperclip/releases/tag/v2026.428.0 | Opens review issues for stalled work, long runs, and high-churn loops | Advanced | Detect stuck automations before they hurt customers | Agent loops on “verify listing photos”; Paperclip flags review | Medium | Needs tuning to avoid noisy reviews | 82 |
| Environments and pluggable sandbox providers Source: https://github.com/paperclipai/paperclip/blob/master/releases/v2026.427.0.md | Beta execution environments with local, SSH, and sandbox providers such as E2B | Advanced | Safely run scrapers, scripts, and agent tasks | Execute scraping job in sandbox instead of production host | High | Marked beta; needs verification before core production use | 76 |

## Top 5 features to build first for MDE MVP

| Rank | Feature | Tool | Why first |
|---|---|---|---|
| 1 | Approval gates for AI actions | Paperclip | MDE already wants preview-before-apply; this protects listings, WhatsApp, payments, and admin actions. |
| 2 | Persistent memory + session search | Hermes | Needed for renter preferences, landlord context, neighborhood choices, and concierge continuity. |
| 3 | WhatsApp/WebChat gateway | OpenClaw | Medellín workflows are WhatsApp-first; this gives the product a real local channel. |
| 4 | Rental ranking brain via Hermes tools/MCP | Hermes | Best fit for price/value, safety, Wi-Fi, furnishing, walkability, and explanation logic. |
| 5 | Cost/budget tracking | Paperclip | Chat, scraping, image/vision, and agent workflows can become expensive quickly. |

## Top 5 advanced features for later

| Rank | Feature | Tool | Why later |
|---|---|---|---|
| 1 | Browser automation for listing verification | Hermes/OpenClaw | Powerful for scraping and verification, but needs legal/security review. |
| 2 | External memory provider | Hermes | Useful for deep personalization after core memory proves value. |
| 3 | Paperclip sandbox environments | Paperclip | Good for scraper safety, but currently beta. |
| 4 | OpenClaw mobile nodes | OpenClaw | Interesting for field verification, but not required for MVP. |
| 5 | Hermes Curator/self-improvement | Hermes | Useful once MDE has many custom skills; gate it with Paperclip approvals. |

## Best architecture

| Layer | Recommended tool | Why |
|---|---|---|
| Brain | Hermes Agent | Best fit for reasoning, memory, ranking, tool use, and model routing. |
| Hands | OpenClaw + Supabase Edge Functions | OpenClaw handles channels/actions; Edge Functions remain deterministic business APIs. |
| Memory | Supabase + Hermes memory | Supabase is source of truth; Hermes stores working/user preferences and session recall. |
| Orchestration | Paperclip | Best fit for assigning agents, tracking work, dependencies, budgets, and recovery. |
| Approval layer | Paperclip | Strongest match for human gates, staged approvals, auditability, and preview-before-apply. |
| Messaging/channel layer | OpenClaw | Best fit for WhatsApp, WebChat, Telegram, Slack, and multi-agent routing. |

## Final recommendation

Use a **combination**, not one tool.

- **Hermes = brain** for rental ranking, recommendation explanations, memory, search reasoning, and agentic research.
- **OpenClaw = hands and channels** for WhatsApp/WebChat messaging, follow-up, voice/media intake, and channel routing.
- **Paperclip = CEO/control plane** for approvals, budgets, issue workflows, stalled-work detection, audit trails, and agent orchestration.
- **Supabase remains the system of record** for listings, users, leads, bookings, messages, saved places, trips, and audit events.

Do not let any of the three directly mutate money/legal/listing truth without a deterministic Supabase Edge Function and Paperclip approval gate.