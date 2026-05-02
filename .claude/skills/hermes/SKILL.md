---
name: hermes
description: Nous Research Hermes Agent — self-hosted CLI + gateway, learning loop, skills (agentskills.io), memory, toolsets, cron, delegation, MCP, OpenClaw migration (`hermes claw migrate`). Use when configuring or debugging Hermes, `~/.hermes/config.yaml`, OpenRouter/models, Firecrawl/web_search, browser/terminal backends, SOUL.md vs AGENTS.md, compression, sessions, or integrating Hermes as the “brain” with OpenClaw/Paperclip/Supabase. Use when the user mentions Hermes, `hermes` CLI, Nous Research, or Hermes vs OpenClaw — even if they do not say “hermes skill.”
---

# Hermes Agent (mdeai)

Hermes is a **separate** runtime from OpenClaw: Python-based, [documented by Nous](https://hermes-agent.nousresearch.com/docs/), with a built-in **skills + memory** loop and optional **messaging gateway** (Telegram, Discord, etc.). This skill helps you configure it, reason about failures, and align it with the repo’s **target trio** (OpenClaw → Hermes → Supabase → Paperclip).

## When to load what

| Need | Read |
|------|------|
| **This machine’s saved setup tables** (`hermes --version`, `~/.hermes` listings, models, tools, scores) | [references/setup-final-state.md](references/setup-final-state.md) |
| **Canonical doc URLs** (CLI, env, architecture) | [references/official-links.md](references/official-links.md) |

## Essentials

- **Install / update:** follow [GitHub README](https://github.com/NousResearch/hermes-agent) — `curl …/install.sh | bash`; then `hermes`, `hermes doctor`, `hermes update`.
- **Config:** `~/.hermes/config.yaml`; secrets in `~/.hermes/.env`. **SOUL.md** = global identity (`~/.hermes/SOUL.md`); **AGENTS.md** = per-project rules — see [Use SOUL.md with Hermes](https://hermes-agent.nousresearch.com/docs/guides/use-soul-with-hermes).
- **OpenClaw users:** `hermes claw migrate` (wizard may detect `~/.openclaw`). Details in official migrate guide.
- **Skills:** Hermes ships bundled/optional skills under upstream `skills/`; compatible with [agentskills.io](https://agentskills.io). In Cursor/Claude Code, **this** folder (`.claude/skills/hermes/`) is a **project skill** for assistants editing mdeai — not a replacement for in-Hermes skills.
- **Ops:** [Tips](https://hermes-agent.nousresearch.com/docs/guides/tips) — `/compress`, prompt cache stability, `/usage`, delegation, Docker for untrusted code.

## mdeai integration stance

- **Standalone Hermes** = CLI + tools + memory (current snapshot in `setup-final-state.md`).
- **Target** = wire **Supabase** for structured listings and durable app state; **OpenClaw** for channels; **Paperclip** for governance and tasks — see `plan/docs` and `CLAUDE.md` trio sections.

## Anti-patterns

- Treating MindStudio or other blogs as source of truth — **always prefer** [official docs](https://hermes-agent.nousresearch.com/docs/).
- Putting repo paths and stack details in **SOUL.md** — belongs in **AGENTS.md** per Nous.
- Assuming Firecrawl/web_search works without quota and config — failures often need tool/provider tuning.
