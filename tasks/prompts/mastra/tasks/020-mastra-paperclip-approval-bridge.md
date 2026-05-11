---
task_id: MASTRA-020
title: Mastra Paperclip Approval Bridge
phase: CORE
priority: P0
status: Not Started
estimated_effort: 3 days
area: mastra-governance
skill: [mastra, mde-task-lifecycle]
subagents: [backend, security-auditor]
edge_function: mastra-paperclip-approval
schema_tables: [ai_control_events, workflow_approvals, human_handoffs]
depends_on: [MASTRA-003, MASTRA-012, MASTRA-013, MASTRA-022]
blocks: [MASTRA-006, MASTRA-007, MASTRA-008, MASTRA-018]
---

<!-- task-summary -->
> **What:** Build the bridge from Mastra risky actions to Paperclip approval/governance.
> **Why:** mdeAI plans require Paperclip approvals, but Mastra needs a concrete typed approval request/result contract before OpenClaw, WhatsApp, payments, or legal-adjacent work.
> **Delivers:** Approval request tool, approval-state model, Paperclip API wrapper, audit rows, and verification proof.
> **Tools/Skills:** `mastra` · `mde-task-lifecycle`
> **CORE · P0 · Not Started · Effort: 3 days**
> **Depends on:** MASTRA-003, MASTRA-012, MASTRA-013, MASTRA-022

# Mastra Paperclip Approval Bridge

## Easy Summary

**Purpose:** make Paperclip the approval gate Mastra can actually call.

**Goals:** convert high-risk Mastra tool calls into Paperclip approval requests and resume only after explicit approval.

**Success criteria:** a test risky action creates an approval request, stores an audit/control row, and returns `approval_pending` without executing the action.

**Production-ready checklist:**

- No Paperclip token in browser code.
- No secret values printed.
- All requests include organization, actor, tool, risk, idempotency key, entity reference, and redacted payload.
- Denied/expired approvals do not execute.
- Duplicate idempotency keys return the existing approval.

## Acceptance Criteria

- [ ] Add a typed `request_paperclip_approval` Mastra tool or server helper.
- [ ] Add a server-only Paperclip API client with masked logging.
- [ ] Store approval linkage in `ai_control_events` and/or `workflow_approvals`.
- [ ] Define states: `approval_pending`, `approved`, `denied`, `expired`, `cancelled`, `executed`.
- [ ] Add tests for create, duplicate idempotency, deny, approve, expired, and missing token.
- [ ] Verify no Paperclip credentials appear in Vite/browser bundle.

## Verification

```bash
cd /home/sk/mde/my-mastra-app
npm run smoke:runtime
npm run typecheck
rg -n "PAPERCLIP|HAPI|API_KEY|TOKEN" src ../src | sed -n '1,120p'
```

