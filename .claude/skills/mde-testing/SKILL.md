---
name: mde-testing
description: "Owner skill for testing on mdeai.co — unit (Vitest), e2e (Playwright), Chrome DevTools MCP browser testing, Claude Preview MCP, and exploratory dogfood. Use when writing tests, debugging UI in a real browser, verifying components, running smoke tests, capturing performance traces, or planning a test strategy. Triggers: vitest, component test, playwright, e2e, browser test, chrome devtools, devtools mcp, performance trace, network panel, claude preview, dogfood, exploratory testing, smoke test, test strategy, testing pyramid. Do NOT use for: TDD discipline (use test-driven-development — that's the methodology, this is the toolchain), MCP server connection failures (use troubleshooting), or load testing."
---

# mde-testing — testing superskill

Pick the topic that matches the work, then load it.

| Intent | Read |
|--------|------|
| Component tests, unit tests, jsdom, Vitest config, mocks | [vitest.md](vitest.md) |
| Playwright e2e, real browser, login flow, multi-step | [playwright.md](playwright.md) |
| Chrome DevTools MCP — performance traces, network panel, real-browser inspection | specialist: [chrome-devtools](../chrome-devtools/SKILL.md) (or [chrome-devtools-cli](../chrome-devtools-cli/SKILL.md) for headless) |
| LCP / Core Web Vitals tuning under DevTools | specialist: [debug-optimize-lcp](../debug-optimize-lcp/SKILL.md) |
| MCP-driven preview-server browser testing (Claude Preview) | [preview-mcp.md](preview-mcp.md) |
| Manual exploratory testing, dogfood session, bug discovery | [exploratory.md](exploratory.md) |
| Choosing what to test (pyramid, ROI, coverage strategy) | [references/testing-strategy.md](references/testing-strategy.md) |
| Common bug patterns / triage taxonomy | [references/issue-taxonomy.md](references/issue-taxonomy.md) |
| MCP server itself failing to connect | specialist: [troubleshooting](../troubleshooting/SKILL.md) |

## Browser surfaces — pick one

Three distinct browser-control systems are available in this repo. They are NOT interchangeable; pick by the question being asked.

| Surface | Tool namespace | When to pick |
|---------|----------------|--------------|
| **chrome-devtools-mcp** (Google's Chrome team, 29 tools) | requires install: `claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest` (or `/plugin install chrome-devtools-mcp`) | Numbers/perf required: performance traces, Lighthouse audits, network panel inspection, console error capture during a navigation, memory snapshots, repeatable headless flows that don't need login. |
| **Claude in Chrome** (`--chrome` flag + browser extension) | `mcp__Claude_in_Chrome__*` | Real signed-in browser state required: Supabase auth, Google OAuth, Stripe Link wallet, Shopify checkout, Gmail/Notion drafting, anything behind a login or CAPTCHA. |
| **Claude Preview MCP** | `mcp__Claude_Preview__*` | Stateless preview-server smoke tests during a Vite feature loop — the four-state pattern, the 3-panel layout, mobile collapse, AI proposal cards. |

**Picking rule:** state required → Claude in Chrome · numbers/perf required → chrome-devtools-mcp · stateless verify → Claude Preview.

Specialists for each surface:
- `chrome-devtools` — interactive in-session work
- `chrome-devtools-cli` — bash/CI/hook automation using the same MCP server
- `troubleshooting` — only when an MCP server itself fails to start

## mdeai recipes

| Job | Surface | Owner skill |
|-----|---------|-------------|
| LCP regression on `/coffee` | chrome-devtools-mcp (`performance_start_trace` → `performance_analyze_insight LCPBreakdown`) | `debug-optimize-lcp` |
| Lighthouse audit on a Vercel preview URL | chrome-devtools-mcp (`lighthouse_audit --mode navigation --device mobile`) | `mde-vercel` |
| Bundle / Core Web Vitals trace | chrome-devtools-mcp | `mde-vercel`, `debug-optimize-lcp` |
| Supabase email/OAuth sign-in regression | Claude in Chrome | `mde-testing` → `playwright.md` |
| Stripe Link checkout end-to-end | Claude in Chrome | `mde-stripe`, `create-payment-credential` |
| Shopify cart → checkout smoke | Claude in Chrome | `mde-stripe` (plus `mdeai-commerce.md`) |
| AI-proposal card four-state visual verify | Claude Preview MCP | `mde-testing` → `preview-mcp.md` |
| RLS / 403 debugging during a UI flow | chrome-devtools-mcp (`list_console_messages --types error` + `list_network_requests --resourceTypes Fetch`) | `mde-supabase`, `systematic-debugging` |
| Console-error sweep before commit | chrome-devtools-cli inside `/ship` step 3 | `mde-testing` (this skill) |

## Repo-specific pointers (mdeai.co)

- Vitest entry: `npm run test` (run once) / `npm run test:watch`
- Playwright is configured but no e2e tests exist yet (see CLAUDE.md "Known Issues")
- Required-states pattern in [.claude/rules/style-guide.md](../../rules/style-guide.md): every data-fetching component handles loading/error/empty/success — tests must cover all four
- Preview server runs on port 8080 (`npm run dev`)

## Resources in this folder

- `examples/` — console logging, element discovery, static HTML automation snippets
- `scripts/with_server.py` — wrap test runs around a dev server
- `templates/` — dogfood session templates
