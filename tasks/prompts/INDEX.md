# Task Prompts — Index & Phase Organization

> **Rule:** Every epic-tracked task maps to exactly one prompt file.
> **Structure:** Prompts are organized by phase in subfolders. Original flat files kept for backward compatibility.
> **Last updated:** 2026-04-05 — Reorganized into phase folders; added 08L (WA apartment search); **Success criteria** block on every `core/` prompt (see paragraph below).

**Verify prompts before merge:** Use **[`PROMPT-VERIFICATION.md`](PROMPT-VERIFICATION.md)** — load **`.claude/skills/tasks/SKILL.md`** (`mdeai-tasks`), then route by theme (Supabase, real-estate, OpenClaw, etc.) per that doc’s tables. **§6** ties **correct** prompts to **successful features** (goal, journey, proof, gates, rollout). **Each epic prompt** under `core/`, `advanced/`, `production/`, `reference/` includes a **Feature success** section (table) linking **§6**, **`.claude/skills/mde-writing-plans`**, and optionally **`.agents/skills/tasks-generator`**. Regenerate via `python3 scripts/inject-feature-success-prompts.py` after adding new prompt files (idempotent).

**`core/` prompts** also start with **`### Real world — purpose & outcomes`** (who, purpose, goals, features in plain language — Medellín/traveler context). Regenerate via `python3 scripts/inject-real-world-core-prompts.py` for new `core/` files (idempotent).

Every **`core/`** prompt also includes **`## Success criteria (tests · verify · production-ready)`** immediately before **Feature success** (shared table: lint/build/test/`verify:edge`, manual smoke, production-ready gates).

**Subtasks (multiple prompts per epic file):** Each fenced **` ```yaml `** subtask block (and leading **`---`** frontmatter on single-task files) includes **`description:`** — one line derived from `title` (“what ships”), plus full detail in **§ Prompt** below. Regenerate via `python3 scripts/inject-yaml-description-core-prompts.py` (idempotent).

---

## Phase Folders

| Folder | Phase | Weeks | Files | Focus |
|--------|-------|-------|-------|-------|
| `core/` | P1 CORE | 1-8 | 20 | Security, data, pipeline, booking + landlord comms, planning dashboard, WA lead capture + search + reminders |
| `advanced/` | P2 ADVANCED | 9-16 | 41 | Agents (E5), ranking (E6), contracts (E7), WA AI routing (E8v2), trio integration (E12) |
| `production/` | P3 PRODUCTION | 17-22 | 1 | Lobster workflow spike |
| `reference/` | — | — | 4 | Search stack docs, verification checklist, diagram sync |

---

## CORE (20 files) — Ship first

> Exit criteria: End-to-end booking, landlord comms, planning dashboard, WA lead capture + apartment search + reminders.

### Foundation & Security (Weeks 1-2)
| File | Scope |
|------|-------|
| [`core/01E-data-foundation.md`](core/01E-data-foundation.md) | Schema, seed 50+ apartments, indexes, RLS |
| [`core/03E-security-hardening.md`](core/03E-security-hardening.md) | JWT, CORS, Zod, rate limits, service role fix |
| [`core/13A-e3-edge-security-extensions.md`](core/13A-e3-edge-security-extensions.md) | Admin RBAC, timeouts, JWT story doc |
| [`core/13E-gemini-g1g5-edge-acceptance-audit.md`](core/13E-gemini-g1g5-edge-acceptance-audit.md) | G1-G5 rules in all Gemini edge ACs |

### Pipeline & Landlord Comms (Weeks 3-4)
| File | Scope |
|------|-------|
| [`core/02E-lead-to-lease-pipeline.md`](core/02E-lead-to-lease-pipeline.md) | Lead → showing → application → **approval** → booking + **off-platform rent** (landlord/owner) + messaging |
| [`core/02H-e2-pipeline-phasing-web-vs-whatsapp.md`](core/02H-e2-pipeline-phasing-web-vs-whatsapp.md) | Clarifies web-first phasing (merge into 02E) |
| [`core/13B-e2-payment-rollback-idempotency.md`](core/13B-e2-payment-rollback-idempotency.md) | Stripe rollback + idempotency on money paths |
| [`core/10A-crm-api-envelope.md`](core/10A-crm-api-envelope.md) | Typed CRM envelope (done) |
| [`core/10B-crm-ui-pipeline.md`](core/10B-crm-ui-pipeline.md) | CRM UI CTAs + pipeline page (done) |
| [`core/10C-crm-deploy-smoke.md`](core/10C-crm-deploy-smoke.md) | Deploy + smoke test |
| [`core/10E-crm-real-estate.md`](core/10E-crm-real-estate.md) | CRM epic index |

### Frontend & Planning Dashboard (Weeks 5-6)
| File | Scope |
|------|-------|
| [`core/04E-frontend-rental-flow.md`](core/04E-frontend-rental-flow.md) | MapView, ListingDetail, NeighborhoodCard, **PlanningDashboard**, **LandlordDashboard** |
| [`core/04A-ai-search-wire.md`](core/04A-ai-search-wire.md) | Wire useAISearch to ai-search edge (replace ai-chat searchMode) |
| [`core/09E-production-readiness.md`](core/09E-production-readiness.md) | Env vars, monitoring, E2E smoke, ai_runs logging *(phase corrected to CORE)* |

### Chatbot Cleanup (Week 1 — do first, quick wins)
| File | Scope |
|------|-------|
| [`core/14A-chatbot-cleanup.md`](core/14A-chatbot-cleanup.md) | Remove wasted ai-router call, delete 4 orphaned files, fix hardcoded URLs/tokens |

### WhatsApp v1 + Reminders (Weeks 7-8)
| File | Scope |
|------|-------|
| [`core/08A-infobip-whatsapp-webhook.md`](core/08A-infobip-whatsapp-webhook.md) | Infobip webhook config + signature verification |
| [`core/08C-wa-lead-capture.md`](core/08C-wa-lead-capture.md) | WA → lead-capture flow (text only) |
| [`core/08L-wa-apartment-search.md`](core/08L-wa-apartment-search.md) | **NEW** — WA apartment search via ai-search bridge (no OpenClaw) |
| [`core/02F-e2-showing-reminders-cron.md`](core/02F-e2-showing-reminders-cron.md) | T-24h/T-1h reminders (in-app + WA) |
| [`core/13C-docs-hygiene-prd-index-rice-dod.md`](core/13C-docs-hygiene-prd-index-rice-dod.md) | Fix broken links, RICE sort, DoD template |

---

## ADVANCED (41 files) — Ship after CORE stable

> Exit criteria: Hermes ranking >= 70%. Lease review >= 90%. Agent orchestration. WA AI routing.

### Agent Infrastructure (E5) — 14 files
| File | Scope |
|------|-------|
| [`advanced/05E-agent-infrastructure.md`](advanced/05E-agent-infrastructure.md) | Epic index |
| [`advanced/05A-paperclip-ceo-instructions.md`](advanced/05A-paperclip-ceo-instructions.md) | CEO prompt, delegation, budget |
| [`advanced/05B-paperclip-workspace-bind.md`](advanced/05B-paperclip-workspace-bind.md) | Workspace binding |
| [`advanced/05C-hermes-config-instructions-timeout.md`](advanced/05C-hermes-config-instructions-timeout.md) | Hermes config |
| [`advanced/05D-hermes-local-adapter.md`](advanced/05D-hermes-local-adapter.md) | Paperclip → Hermes adapter |
| [`advanced/05F-paperclip-heartbeat-schedule.md`](advanced/05F-paperclip-heartbeat-schedule.md) | Daily agent wake cycle |
| [`advanced/05G-approval-gates.md`](advanced/05G-approval-gates.md) | Full G1-G7 gates |
| [`advanced/05H-openclaw-gateway-adapter.md`](advanced/05H-openclaw-gateway-adapter.md) | OpenClaw gateway adapter |
| [`advanced/05I-paperclip-api-lifecycle.md`](advanced/05I-paperclip-api-lifecycle.md) | API lifecycle |
| [`advanced/05J-paperclip-goals-sync.md`](advanced/05J-paperclip-goals-sync.md) | Goals sync |
| [`advanced/05K-paperclip-agent-audit-log-ordering.md`](advanced/05K-paperclip-agent-audit-log-ordering.md) | Audit log ordering |
| [`advanced/05L-paperclip-approval-gates-phase1.md`](advanced/05L-paperclip-approval-gates-phase1.md) | Lightweight gates |
| [`advanced/05M-openclaw-gateway-health-stub.md`](advanced/05M-openclaw-gateway-health-stub.md) | Health check stub |
| [`advanced/05N-paperclip-ceo-human-escalation.md`](advanced/05N-paperclip-ceo-human-escalation.md) | CEO ↔ human escalation |

### Hermes Intelligence (E6) — 7 files
| File | Scope |
|------|-------|
| [`advanced/06E-hermes-intelligence.md`](advanced/06E-hermes-intelligence.md) | Epic index |
| [`advanced/06A-hermes-ranking-edge.md`](advanced/06A-hermes-ranking-edge.md) | 7-factor scoring |
| [`advanced/06B-hermes-score-breakdown-ui.md`](advanced/06B-hermes-score-breakdown-ui.md) | Score visualization |
| [`advanced/06C-taste-profile-edge.md`](advanced/06C-taste-profile-edge.md) | User preference learning |
| [`advanced/06D-market-snapshot-edge.md`](advanced/06D-market-snapshot-edge.md) | Neighborhood stats |
| [`advanced/06F-hermes-ranking-eval-dataset.md`](advanced/06F-hermes-ranking-eval-dataset.md) | 50+ test cases |
| [`advanced/06G-post-showing-similar-listings.md`](advanced/06G-post-showing-similar-listings.md) | Post-showing suggestions |

### Contract Automation (E7) — 5 files
| File | Scope |
|------|-------|
| [`advanced/07E-contract-automation.md`](advanced/07E-contract-automation.md) | Epic index |
| [`advanced/07A-p2-tables-lease-market-taste.md`](advanced/07A-p2-tables-lease-market-taste.md) | P2 tables |
| [`advanced/07B-contract-analysis-edge.md`](advanced/07B-contract-analysis-edge.md) | Gemini lease review |
| [`advanced/07C-lease-review-card.md`](advanced/07C-lease-review-card.md) | Review UI |
| [`advanced/07D-lease-fixtures-validation.md`](advanced/07D-lease-fixtures-validation.md) | Test leases |

### WhatsApp v2 + OpenClaw AI (E8v2) — 7 files
| File | Scope |
|------|-------|
| [`advanced/08E-multi-channel.md`](advanced/08E-multi-channel.md) | Epic index |
| [`advanced/08B-openclaw-whatsapp-adapter.md`](advanced/08B-openclaw-whatsapp-adapter.md) | Full AI routing |
| [`advanced/08D-human-handover-escalation.md`](advanced/08D-human-handover-escalation.md) | Ops escalation |
| [`advanced/08F-whatsapp-ingress-architecture.md`](advanced/08F-whatsapp-ingress-architecture.md) | ADR: Infobip vs Baileys |
| [`advanced/08G-openclaw-correlation-observability.md`](advanced/08G-openclaw-correlation-observability.md) | Correlation IDs |
| [`advanced/08H-openclaw-wa-adapter-phase1.md`](advanced/08H-openclaw-wa-adapter-phase1.md) | Echo-only slice |
| [`advanced/08I-openclaw-mde-skills.md`](advanced/08I-openclaw-mde-skills.md) | Domain skills |
| [`advanced/08K-openclaw-provider-strategy.md`](advanced/08K-openclaw-provider-strategy.md) | Routing strategy ADR |

### Testing & Ops — 5 files
| File | Scope |
|------|-------|
| [`advanced/02G-e2-merm-journey-e2e-smoke.md`](advanced/02G-e2-merm-journey-e2e-smoke.md) | Playwright E2E |
| [`advanced/04B-ai-trip-planner-wire.md`](advanced/04B-ai-trip-planner-wire.md) | Trip planner wiring |
| [`advanced/04F-e4-move-in-checklist.md`](advanced/04F-e4-move-in-checklist.md) | Post-booking checklist |
| [`advanced/13D-landlord-journey-doc.md`](advanced/13D-landlord-journey-doc.md) | Host journey docs |

### Trio Integration — 3 files
| File | Scope |
|------|-------|
| [`advanced/12A-trio-integration-contract.md`](advanced/12A-trio-integration-contract.md) | Integration contract |
| [`advanced/12B-trio-staging-operations-runbook.md`](advanced/12B-trio-staging-operations-runbook.md) | Ops runbook |
| [`advanced/12C-trio-ai-routing-feature-flags.md`](advanced/12C-trio-ai-routing-feature-flags.md) | Feature flags |

---

## PRODUCTION (1 file) — Ship after ADVANCED stable

| File | Scope |
|------|-------|
| [`production/08J-lobster-workflows-spike.md`](production/08J-lobster-workflows-spike.md) | Lobster workflow engine evaluation |

---

## Reference (4 files) — Always available

| File | When to use |
|------|-------------|
| [`reference/11A-real-estate-search-stack.md`](reference/11A-real-estate-search-stack.md) | Architecture: search data flow, anti-patterns |
| [`reference/11B-real-estate-search-llm-prompts.md`](reference/11B-real-estate-search-llm-prompts.md) | Copy-paste LLM prompts for edge functions |
| [`reference/VERIFY-supabase-postgres-edge.md`](reference/VERIFY-supabase-postgres-edge.md) | Pre-deploy checklist for migrations, RLS, edge PRs |
| [`reference/DIAGRAMS-sync-merm07-hermes.md`](reference/DIAGRAMS-sync-merm07-hermes.md) | MERM-07 sync (edge vs CLI canonical) |

---

## File Counts

| Phase | Files | % |
|-------|-------|---|
| CORE | 20 | 30% |
| ADVANCED | 41 | 63% |
| PRODUCTION | 1 | 2% |
| Reference | 4 | 6% |
| **Total** | **66** | 100% |

> **Note:** Original flat files remain in `originals/` for backward compatibility. Phase folders are the source of truth. When editing, update the phase folder copy only. Consider deleting `originals/` to prevent drift.

### Completion Status (verified 2026-04-05)

| Task | Status | Notes |
|------|--------|-------|
| 10A CRM API Envelope | DONE | Verified: envelope, client, tests |
| 10B CRM UI Pipeline | DONE | Verified: components, hooks, RLS |
| 14A Chatbot Cleanup | DONE | All 11 ACs verified: no router call, no dead code, no hardcoded secrets |
| 10C CRM Deploy Smoke | PARTIAL | Deployed but no smoke evidence |
| 01E Data Foundation | DONE | All ACs pass: 6 migrations, 28 apt seed, 27 indexes, RLS, types regen confirmed |
| 03E Security Hardening | PARTIAL | JWT/CORS/Zod/rate-limit infra exist; Stripe webhook missing |
| 04A AI Search Wire | DONE | Fixed: ai-chat → ai-search, correct request/response shape, build+lint clean |
| 02E Pipeline | PARTIAL | Lead/showing/app work; booking + payment missing |
| 04E Frontend Rental | BLOCKED | 4/5 sub-task components don't exist |
| 09E Production Readiness | PARTIAL | ai_runs table exists; logging in 1/7 functions |
| 13A Edge Security Ext | NOT STARTED | RBAC not enforced; service role violation |
| 13E Gemini G1-G5 | NOT STARTED | 0/7 functions comply |
| 08A Infobip Webhook | NOT STARTED | No function exists |
| 08C WA Lead Capture | NOT STARTED | No function exists |
| 08L WA Apartment Search | NOT STARTED | No function exists |
| 02F Showing Reminders | NOT STARTED | No cron exists |
| 13B Payment Rollback | NOT STARTED | No webhook handler |
| 02H Pipeline Phasing | MERGED | Content merged into 02E |
| 13C Docs Hygiene | NOT STARTED | Broken links exist |
| 10E CRM Index | N/A | Index file only |
