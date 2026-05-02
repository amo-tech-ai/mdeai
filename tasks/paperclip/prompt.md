You are a senior AI systems architect and Paperclip expert.

Your task is to perform a COMPLETE audit of our Paperclip setup, task strategy, and agent system.

Context:
We are building an AI-powered Medellín real estate + rental marketplace (mde).

Stack:
- Paperclip (control plane: tasks, agents, orchestration)
- Hermes (reasoning / execution layer)
- OpenClaw (tools + workflows)
- Supabase (database + storage)

We are running Paperclip locally and using agents (CEO, etc.) to manage execution.

---

# 🎯 OBJECTIVE

Evaluate whether we are using Paperclip correctly and fully.

You must:
1. Analyze our task strategy
2. Evaluate agent structure and delegation
3. Identify missing Paperclip features (core + advanced)
4. Detect errors, red flags, and failure points
5. Suggest improvements and best practices
6. Propose real-world use cases (especially real estate)

---

# 🔍 AUDIT AREAS

## 1. Core Paperclip Usage

Evaluate if we are correctly using:

- Companies / Projects
- Goals and issues (task system)
- Agents (roles, responsibilities)
- Org structure (CEO → CTO → etc.)
- Dashboard / board operator workflows
- Comments and communication
- Approvals system
- Cost tracking / budgets

For each:
- Are we using it? (yes/no)
- Are we using it correctly?
- What is missing?

---

## 2. Task Strategy (CRITICAL)

Analyze our current task system:

- Are tasks properly scoped?
- Are tasks too vague or too large?
- Are subtasks used correctly?
- Are tasks linked to goals/projects?
- Is delegation consistent?

Identify:
- bottlenecks
- inefficiencies
- missing structure
- unclear ownership

---

## 3. Agent Architecture

Evaluate:

- Are agent roles clearly defined?
- Is CEO delegating correctly?
- Do we have missing roles (CTO, CMO, Ops)?
- Are agents doing work they shouldn’t?
- Is there separation of concerns?

Check:
- delegation patterns
- task ownership
- escalation paths

---

## 4. Advanced Paperclip Features

Check if we are using or missing:

- Approvals workflow
- Cost reporting + budgets
- Activity tracking
- Secrets management
- Storage layer
- Environment variables
- Database configuration
- Deployment modes (local vs production)
- Skills (custom agent capabilities)
- Task workflow lifecycle (checkout → work → complete)

---

## 5. Errors / Red Flags / Failure Points

Identify ALL issues such as:

- Agents trying to call API manually (curl misuse)
- Poor task decomposition
- Missing workflows
- Weak agent coordination
- Over-reliance on manual control
- Missing state tracking
- No feedback loops
- No performance metrics

Be direct and critical.

---

## 6. Improvements (Actionable)

Provide:

- specific fixes
- better task structure
- improved agent roles
- workflow improvements
- architecture upgrades

Focus on:
- reliability
- scalability
- automation

---

## 7. Real Estate Use Cases (mde)

Propose how Paperclip can be used for:

### Core:
- property ingestion workflows
- listing management
- lead capture + CRM
- booking workflows
- showing scheduling
- landlord onboarding

### Advanced:
- automated pricing optimization
- AI-powered listing scoring
- lead qualification agents
- contract analysis workflows
- marketplace supply/demand balancing
- automated follow-ups (WhatsApp / chat)

---

## 8. Recommended Architecture

Design the ideal Paperclip setup:

- agent hierarchy (CEO → CTO → CMO → Ops)
- task flow structure
- goal hierarchy
- execution loops

---

# 📊 OUTPUT FORMAT (STRICT)

## Overall Score
(0–100)

## Core Usage Audit
(table)

## Task Strategy Issues
(bullets)

## Agent Architecture Issues
(bullets)

## Advanced Features Gap
(table)

## Key Problems
(bullets)

## Improvements
(actionable bullets)

## Recommended Architecture
(structured plan)

## Real Estate Use Cases
(grouped)

---

# ⚠️ RULES

- Be brutally honest
- Do not assume correctness
- Focus on real-world execution
- Prioritize impact over theory

---

# 🎯 GOAL

Turn our Paperclip system into:
- a fully autonomous execution engine
- production-ready architecture
- scalable real estate AI system