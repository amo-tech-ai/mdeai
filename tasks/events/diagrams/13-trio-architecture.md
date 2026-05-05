---
id: TRIO-ARCHITECTURE
phase: ADVANCED
prd_section: 06-trio-integration.md, 4.1 Architecture overview Phase 4
type: flowchart
related: [14-a6-attendance-confirmation, 15-ai-roi-optimization-loop]
---

# 13 — Trio architecture (flowchart, C4-container style)

**What this shows.** Phase 4 introduces three additional runtimes — OpenClaw (channels + exec), Hermes (reasoning + memory), Paperclip (governance + budgets) — wired around Supabase as the single source of truth. Every cross-tool action logs to `trio.tool_runs` for cost + audit visibility.

**Phase.** ADVANCED — deferred from Phase 1 per audit response. Only ships when scale or team demands governance + reasoning + sub-agent fan-out.

```mermaid
flowchart TB
    classDef user fill:#dbeafe,stroke:#1e40af,color:#000
    classDef control fill:#fef3c7,stroke:#854d0e,color:#000,stroke-width:3px
    classDef brain fill:#e9d5ff,stroke:#6b21a8,color:#000
    classDef hands fill:#fed7aa,stroke:#9a3412,color:#000
    classDef store fill:#dcfce7,stroke:#166534,color:#000,stroke-width:3px
    classDef ext fill:#fee2e2,stroke:#991b1b,color:#000

    USERS[Travelers - Organizers - Sponsors - Voters]:::user

    subgraph PC[Paperclip Control Plane]
        direction TB
        PC1[Companies + Goals + Projects]:::control
        PC2[Issues + Approval gates]:::control
        PC3[Budgets + Hard stops]:::control
        PC4[Heartbeat scheduler]:::control
        PC5[Audit trail]:::control
    end

    subgraph HM[Hermes Brain]
        direction TB
        HM1[Reasoning + ranking]:::brain
        HM2[Curated memory + FTS5 recall]:::brain
        HM3[Sub-agent fan-out]:::brain
        HM4[40+ MCP tools]:::brain
        HM5[Camofox browser]:::brain
    end

    subgraph OC[OpenClaw Hands]
        direction TB
        OC1[18+ messaging channels<br/>WA - Telegram - Signal etc]:::hands
        OC2[5700+ ClawHub skills]:::hands
        OC3[Browser + exec sandboxed]:::hands
        OC4[Cron + scheduled jobs]:::hands
    end

    subgraph SB[Supabase - source of truth]
        direction TB
        SB1[(vote.* growth.*<br/>sponsor.* event.*)]:::store
        SB2[(trio.* runs + handoffs<br/>+ approvals + budgets)]:::store
        SB3[Realtime channels]:::store
        SB4[Storage + Auth + pg_cron]:::store
    end

    subgraph AI[AI providers]
        GMN[Gemini 3.x<br/>flash + pro]:::ext
    end

    subgraph CHN[External delivery]
        TWL[Twilio WA + SMS]:::ext
        SEN[SendGrid email]:::ext
        STR[Stripe Checkout + Connect]:::ext
        APF[Apify scraping actors]:::ext
        PBR[Post Bridge social posting]:::ext
    end

    USERS -->|web + mobile| FE[Vite/React mdeai.co]
    FE --> SB1

    PC -->|wakes via PAPERCLIP_TASK_ID| HM
    PC -->|webhook trigger| OC
    PC -->|approval gate| OC
    PC -->|budget cap| OC
    HM -->|MCP openclaw_message_send| OC
    OC -->|inbound forwarding| HM

    HM -->|MCP supabase| SB1
    OC -->|service-role JWT| SB1
    PC -->|service-role JWT| SB2

    HM --> GMN
    PC -.cost log.-> SB2
    HM -.cost log.-> SB2
    OC -.cost log.-> SB2

    OC --> TWL
    OC --> SEN
    OC --> APF
    OC --> PBR
    SB1 --> STR

    classDef hub fill:#1f2937,color:#fff,stroke:#000
```

## Communication patterns (per `06-trio-integration.md`)

| From → To | Pattern |
|---|---|
| Paperclip → OpenClaw | Webhook to OpenClaw HTTP API on issue status change |
| Paperclip → Hermes | Heartbeat env (`PAPERCLIP_TASK_ID`) wakes Hermes as ACP agent |
| Hermes → OpenClaw | MCP tool: `openclaw.message_send` |
| OpenClaw → Hermes | OpenClaw exposes channels as MCP tools — inbound message routed for reasoning |
| Any → Supabase | Service-role JWT scoped to specific schemas (read or write) |
| Any → Paperclip | REST `/api/issues/*` with `X-Paperclip-Run-Id` header |

## Rule of thumb

> **Channel or external API → OpenClaw. Reasoning or memory → Hermes. Approval or budget → Paperclip. What's true → Supabase.**

If a capability fits two runtimes (e.g. both OpenClaw and Hermes have cron), pick by primary purpose and stay disciplined. The audit warned: 3 runtimes = 3 failure surfaces if responsibilities blur.
