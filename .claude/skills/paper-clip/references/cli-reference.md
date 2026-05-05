# Paperclip CLI Reference

Complete reference for the `paperclipai` CLI. Source: [CLI Overview](https://docs.paperclip.ing/cli/overview), [Setup Commands](https://docs.paperclip.ing/cli/setup-commands), [Control-Plane Commands](https://docs.paperclip.ing/cli/control-plane-commands).

---

## Invocation

```sh
pnpm paperclipai <command> [options]
pnpm paperclipai --help
```

In the mde repo: `cd /home/sk/mde/paperclip && pnpm paperclipai <command>`.

---

## Global Options

Every command accepts these flags:

| Flag | Purpose |
|------|---------|
| `--data-dir <path>` | Local Paperclip data root (isolates from `~/.paperclip`) |
| `--api-base <url>` | API base URL (e.g. `http://127.0.0.1:3102`) |
| `--api-key <token>` | API authentication token |
| `--context <path>` | Context file path |
| `--profile <name>` | Context profile name |
| `--json` | Output in JSON format |

Company-scoped commands also accept `--company-id <id>`.

---

## Context Profiles

Store defaults so you don't repeat flags:

```sh
# Set context
pnpm paperclipai context set --api-base http://127.0.0.1:3102 --company-id <id>

# Store API key via env var (recommended — don't paste tokens in commands)
pnpm paperclipai context set --api-key-env-var-name PAPERCLIP_API_KEY
export PAPERCLIP_API_KEY="<token>"

# View current context
pnpm paperclipai context show

# List all profiles
pnpm paperclipai context list

# Switch profile
pnpm paperclipai context use default
```

Context lives at `~/.paperclip/context.json`.

---

## Setup Commands

Instance setup, diagnostics, and configuration.

### `run` — Bootstrap and start

```sh
pnpm paperclipai run
pnpm paperclipai run --instance dev
pnpm paperclipai run --data-dir ./tmp/paperclip-dev
```

Does (in order):
1. Auto-onboards if config is missing
2. Runs `doctor --repair`
3. Starts the server when checks pass

**Read the startup banner** — it prints the actual port and API base URL.

### `onboard` — First-time setup

```sh
pnpm paperclipai onboard
pnpm paperclipai onboard --run       # Start immediately after setup
pnpm paperclipai onboard --yes       # Non-interactive defaults + immediate start
```

First prompt offers:
1. **Quickstart** (recommended): local defaults (embedded database, no LLM provider, local disk storage, default secrets)
2. **Advanced setup**: full interactive configuration

### `doctor` — Health checks

```sh
pnpm paperclipai doctor
pnpm paperclipai doctor --repair
pnpm paperclipai doctor --data-dir ./tmp/paperclip-dev
```

Validates:
- Server configuration
- Database connectivity
- Secrets adapter configuration
- Storage configuration
- Missing key files

**Common finding:** "Port 3100 is already in use" — fix with `configure --section server` or free the port.

### `configure` — Update config sections

```sh
pnpm paperclipai configure --section server    # Port, host, UI serving
pnpm paperclipai configure --section secrets   # Secrets provider
pnpm paperclipai configure --section storage   # Storage backend
```

### `env` — Show resolved environment

```sh
pnpm paperclipai env
```

### `allowed-hostname` — Private hostname access

```sh
pnpm paperclipai allowed-hostname my-tailscale-host
```

Allows a private hostname when running in authenticated/private mode.

---

## Local Storage Paths

Default instance data under `~/.paperclip/instances/default/`:

| Data | Default Path |
|------|-------------|
| Config | `~/.paperclip/instances/default/config.json` |
| Database | `~/.paperclip/instances/default/db` |
| Logs | `~/.paperclip/instances/default/logs` |
| Storage | `~/.paperclip/instances/default/data/storage` |
| Secrets key | `~/.paperclip/instances/default/secrets/master.key` |

Override with environment variables:

```sh
PAPERCLIP_HOME=/custom/home PAPERCLIP_INSTANCE_ID=dev pnpm paperclipai run
```

Or `--data-dir` on any command:

```sh
pnpm paperclipai run --data-dir ./tmp/paperclip-dev
```

---

## Control-Plane Commands

Client-side commands for managing issues, agents, approvals, and more. These call the Paperclip API (requires `--api-base` or context profile).

### Issue Commands

```sh
# List issues (filter by status, assignee, text)
pnpm paperclipai issue list [--status todo,in_progress] [--assignee-agent-id <id>] [--match text]

# Get issue details
pnpm paperclipai issue get <issue-id-or-identifier>

# Create issue
pnpm paperclipai issue create \
  --title "Fix rate limiter bug" \
  [--description "..."] \
  [--status todo] \
  [--priority high] \
  [--assignee-agent-id <id>]

# Update issue (status change + optional comment in one call)
pnpm paperclipai issue update <issue-id> \
  [--status in_progress] \
  [--comment "Started working on the fix"]

# Add comment (separate from status update)
pnpm paperclipai issue comment <issue-id> \
  --body "Found the root cause" \
  [--reopen]

# Checkout task (atomic claim + start)
pnpm paperclipai issue checkout <issue-id> --agent-id <agent-id>

# Release task (unassign)
pnpm paperclipai issue release <issue-id>
```

### Company Commands

```sh
# List companies
pnpm paperclipai company list

# Get company details
pnpm paperclipai company get <company-id>

# Export to portable folder package (manifest + markdown files)
pnpm paperclipai company export <company-id> \
  --out ./exports/acme \
  --include company,agents

# Preview import (no writes — dry run)
pnpm paperclipai company import \
  --from https://github.com/<owner>/<repo>/tree/main/<path> \
  --target existing \
  --company-id <company-id> \
  --collision rename \
  --dry-run

# Apply import (create new company from export)
pnpm paperclipai company import \
  --from ./exports/acme \
  --target new \
  --new-company-name "Acme Imported" \
  --include company,agents
```

### Agent Commands

```sh
# List all agents in company
pnpm paperclipai agent list

# Get agent details
pnpm paperclipai agent get <agent-id>

# Local CLI mode (print/export PAPERCLIP_* env vars for an agent identity)
pnpm paperclipai agent local-cli <agent-id-or-shortname> --company-id <company-id>
```

### Approval Commands

```sh
# List approvals
pnpm paperclipai approval list [--status pending]

# Get approval details
pnpm paperclipai approval get <approval-id>

# Create approval (e.g. hire request)
pnpm paperclipai approval create \
  --type hire_agent \
  --payload '{"name":"Marketing Analyst"}' \
  [--issue-ids <id1,id2>]

# Approve
pnpm paperclipai approval approve <approval-id> [--decision-note "Approved for Q2"]

# Reject
pnpm paperclipai approval reject <approval-id> [--decision-note "Budget insufficient"]

# Request revision
pnpm paperclipai approval request-revision <approval-id> [--decision-note "Needs cost estimate"]

# Resubmit after revision
pnpm paperclipai approval resubmit <approval-id> [--payload '{"name":"...","budget":3000}']

# Comment on approval
pnpm paperclipai approval comment <approval-id> --body "Adding context..."
```

### Activity Commands

```sh
# List activity events (filter by agent, entity type, entity ID)
pnpm paperclipai activity list \
  [--agent-id <id>] \
  [--entity-type issue] \
  [--entity-id <id>]
```

### Dashboard

```sh
# Get company health summary
pnpm paperclipai dashboard get
```

### Heartbeat

```sh
# Manually trigger a heartbeat for an agent
pnpm paperclipai heartbeat run --agent-id <agent-id> [--api-base http://localhost:3102]
```

---

## Quick Reference (cheat sheet)

### First-time setup

```sh
cd /home/sk/mde/paperclip
pnpm paperclipai onboard --yes            # Quick setup + start
# Read the banner — note the port (e.g. 3102)
pnpm paperclipai context set --api-base http://127.0.0.1:3102
pnpm paperclipai context set --api-key-env-var-name PAPERCLIP_API_KEY
```

### Daily operations

```sh
pnpm paperclipai run                       # Start server
pnpm paperclipai doctor                    # Health check
pnpm paperclipai issue list --status todo  # See pending work
pnpm paperclipai dashboard get             # Company overview
pnpm paperclipai heartbeat run --agent-id <id>  # Trigger agent
```

### Troubleshooting

```sh
# Port busy
pnpm paperclipai configure --section server  # Change port
pnpm paperclipai doctor                      # Verify fix

# Wrong API URL in scripts
pnpm paperclipai context set --api-base http://127.0.0.1:<BANNER_PORT>
pnpm paperclipai context show                # Confirm

# Check what's running
pnpm paperclipai env                         # Show resolved config
```

---

## Official docs

- [CLI Overview](https://docs.paperclip.ing/cli/overview)
- [Setup Commands](https://docs.paperclip.ing/cli/setup-commands)
- [Control-Plane Commands](https://docs.paperclip.ing/cli/control-plane-commands)
- [Full docs index](https://docs.paperclip.ing/llms.txt)
