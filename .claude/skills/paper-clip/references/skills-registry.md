# Paperclip-related skills (registry)

This monorepo keeps **one** first-class skill folder: **`.claude/skills/paper-clip/`** (API + heartbeat coordination). Other skills from the Paperclip ecosystem are usually installed with **`npx skills add`** from the [Paperclip registry on skills.sh](https://skills.sh/paperclipai/paperclip) or from GitHub.

## Bundled in this repo (`.claude/skills/paper-clip/`)

| Focus | Location |
|-------|----------|
| `paperclip` API / heartbeat | `SKILL.md` + `references/*.md` |
| CLI reference (`paperclipai`) | `references/cli-reference.md` (setup, context, control-plane commands) |
| Plugin SDK / publish | `references/plugin-development.md` (copy of plugin-dev skill body) |

## Install from skills.sh / GitHub (typical)

| Skill | Purpose | Install |
|-------|---------|---------|
| **paperclip** (meta bundle) | Registry entry point | `npx skills add paperclipai/paperclip` — see [paperclipai/paperclip](https://skills.sh/paperclipai/paperclip) |
| **paperclip-ai-orchestration** | High-level orchestration narrative | `npx skills add https://github.com/aradotso/trending-skills --skill paperclip-ai-orchestration` — [skills.sh](https://skills.sh/aradotso/trending-skills/paperclip-ai-orchestration) |
| **paperclip-create-agent** | Hire / create agents via API | [paperclip-create-agent](https://skills.sh/paperclipai/paperclip/paperclip-create-agent) |
| **design-guide** | Paperclip UI control plane (React, Tailwind, tokens) | [design-guide](https://skills.sh/paperclipai/paperclip/design-guide) — pair with `frontend-design` |
| **create-agent-adapter** | Build `packages/adapters/<name>` | [create-agent-adapter](https://skills.sh/paperclipai/paperclip/create-agent-adapter) |
| **company-creator** | Agent Companies spec packages | `npx skills add https://github.com/paperclipai/companies --skill company-creator` — [company-creator](https://skills.sh/paperclipai/companies/company-creator) |

## “Installed correctly” checklist

1. **Skill folder** contains `SKILL.md` with YAML `name` + `description` only (no `version` required for Claude skills).
2. **References** resolve relative to the skill folder (`references/...`), not `skills/paperclip/...` (that path is for the Paperclip **monorepo**).
3. **Runtime**: `PAPERCLIP_*` env vars injected by Paperclip adapters; local CLI: `paperclipai agent local-cli` as described in the main skill.
4. **Upstream updates**: re-run `npx skills add ...` when the upstream repo changes; compare with [skills.sh](https://skills.sh/paperclipai/paperclip) install counts and docs.

## Related docs (web)

- **Paperclip docs:** [paperclip.ing/docs](https://paperclip.ing/docs) (from community orchestration skill)
- **GitHub:** [github.com/paperclipai/paperclip](https://github.com/paperclipai/paperclip)
