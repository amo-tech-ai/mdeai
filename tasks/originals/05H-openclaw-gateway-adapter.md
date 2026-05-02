---
id: 05H
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Adapter layer"
title: Wire openclaw_gateway adapter to OpenClaw
skills:
  - paperclip
  - openclaw
  - mdeai-tasks
epic: E5
phase: MVP
priority: P2
status: Open
owner: Backend
dependencies: []
estimated_effort: L
percent_complete: 0
outcome: O8
---

# E5-007: Wire openclaw_gateway Adapter

```yaml
---
id: E5-007
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Adapter layer"
title: Wire openclaw_gateway adapter to OpenClaw
skill: agent-config
phase: MVP
priority: P2
status: Open
owner: Backend
dependencies: []
estimated_effort: L
percent_complete: 0
epic: E5
outcome: O8
---
```

### Prompt

Implement the `openclaw_gateway` adapter that allows Paperclip agents to send messages through OpenClaw channels (web SSE, WhatsApp).

**Prerequisite (audit):** **[`05M-openclaw-gateway-health-stub.md`](05M-openclaw-gateway-health-stub.md)** — health checks, idempotency keys, `openclaw security audit` ACs, and protocol-correct RPC (not placeholder JSON).

**Epic index:** [`05E-agent-infrastructure.md`](05E-agent-infrastructure.md)

**Read first:**
- `tasks/mermaid/07-agent-architecture.mmd` — openclaw_gateway: HTTP calls to OpenClaw, channel routing
- `tasks/mermaid/04-chat-flow.mmd` — OpenClaw channel flow: web SSE + WhatsApp
- `.claude/skills/open-claw/` — OpenClaw configuration reference

**The build:**
- Create `openclaw_gateway` adapter in Paperclip company configuration
- Adapter makes HTTP calls to the OpenClaw gateway
- Supports channel routing: web (SSE to FloatingChatWidget) or WhatsApp (via Infobip)
- Message format: `{ channel: 'web' | 'whatsapp', recipient_id, message, metadata? }`
- Handle channel not configured (graceful fallback — log warning, don't crash)
- Handle OpenClaw not running (return error, agent can retry)

**Example:**
OpsManager needs to remind host Maria about tomorrow's showing. It delegates to openclaw_gateway with `{ channel: 'whatsapp', recipient_id: maria_phone, message: "Reminder: showing for Apt #42 tomorrow at 2PM" }`. OpenClaw routes through Infobip to Maria's WhatsApp.

### Acceptance Criteria
- [ ] openclaw_gateway adapter registered in Paperclip company config
- [ ] Makes HTTP calls to OpenClaw gateway endpoint
- [ ] Supports web and WhatsApp channel routing
- [ ] Handles OpenClaw not running gracefully
- [ ] Handles channel not configured (WhatsApp before Phase 2)
- [ ] Message delivery status tracked and logged
- [ ] Works from Paperclip agent delegation
