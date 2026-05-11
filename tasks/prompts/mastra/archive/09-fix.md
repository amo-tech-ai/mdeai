---
title: IPv6 / DATABASE_URL root-cause analysis
type: context-notes
date: 2026-05-10
status: Reference only — not a task file
relates_to: [M22-01]
---

# IPv6 / DATABASE_URL root-cause analysis

> **Purpose:** Session notes from the forensic investigation that identified `AAAA-only hostname + no IPv6 route` as the cause of Mastra storage failures. This is context, not a task — the actionable items are in [M22-01.md](M22-01.md).
>
> **Summary of finding:** Worktree succeeded, parent repo failed, for the same code. Root cause: environment inconsistency (DATABASE_URL resolution), not Mastra/pg/Supabase code. The fix is standardized env loading via `infisical run --`.
>
> **Best practices extracted (still valid):**
> - Always use `infisical run -- npm run dev` — not raw `.env`, not copied worktree env
> - Add `.nvmrc` with `22` (Node LTS)
> - Prefer Session Pooler (`:6543`) over direct host (`:5432`) in local dev to avoid IPv6 issues
> - Add a startup fail-fast if direct Supabase host is detected and no IPv6 route exists
>
> **Recommended env strategy:**
>
> | Environment | Database |
> |---|---|
> | Local dev | Local Supabase (`127.0.0.1:54322`) |
> | Preview/staging | Session pooler |
> | Production VPS | Session pooler |
> | Analytics/readonly | Direct host only if VPS has IPv6 |

---

That is the correct diagnosis and the correct fix path.

The strongest evidence is this chain:

```text
AAAA-only hostname
+
no IPv6 default route
+
raw nc failure before pg/Mastra logic
=
kernel-level ENETUNREACH
```

That removes:

- Mastra as root cause
    
- pg driver as root cause
    
- Supabase auth/SSL as root cause
    
- schema/table creation as root cause
    

Your hardening plan is also correct because it fixes the actual operational problem:

> environment inconsistency across worktrees.

Best-practice implementation for step 4:

// src/mastra/storage/config.ts  
import { URL } from "node:url";

export function validateDatabaseUrl(raw?: string) {  
if (!raw) {  
throw new Error("DATABASE_URL missing");  
}

const parsed = new URL(raw);

const host = parsed.hostname;  
const port = parsed.port || "5432";

const isDirectSupabase =  
host.startsWith("db.") && host.endsWith(".supabase.co");

const isPooler =  
host.includes(".pooler.supabase.com");

const isIPv6Host = host.includes(":");

console.log("[db-config]", {  
cwd: process.cwd(),  
host,  
port,  
protocol: parsed.protocol,  
isDirectSupabase,  
isPooler,  
isIPv6Host,  
node: process.version,  
});

if (isDirectSupabase) {  
console.warn(  
"[db-config] Direct Supabase host detected. " +  
"This may fail on IPv4-only networks. " +  
"Prefer Session Pooler or local Supabase for development."  
);  
}

return raw;  
}

Then:

```ts
const connectionString = validateDatabaseUrl(
  process.env.DATABASE_URL
);
```

Additional production-grade improvements:

1. Standardize env loading  
    Use one command everywhere:
    

```bash
infisical run -- npm run dev
```

Not:

- raw `.env`
    
- copied worktree `.env`
    
- mixed local/prod URLs
    

2. Add `.nvmrc`  
    Use:
    

```text
22
```

Reason:

- Node 25 is non-LTS
    
- Mastra ecosystem primarily tests against LTS
    
- avoids future native dependency drift
    

3. Add startup fail-fast  
    If direct Supabase host + no IPv6 route:
    

```ts
throw new Error(
  "Direct Supabase IPv6 host detected but system has no IPv6 route"
);
```

This converts:

```text
MastraError: createTable failed
```

into:

```text
Infrastructure misconfiguration:
IPv6-only DATABASE_URL on IPv4-only host
```

Much easier to debug later.

4. Recommended environment strategy for mdeai
    

|Environment|Database|
|---|---|
|Local dev|Local Supabase (`127.0.0.1:54322`)|
|Preview/staging|Session pooler|
|Production VPS|Session pooler|
|Analytics/readonly jobs|Direct host only if VPS has IPv6|

5. Important operational insight
    

The worktree succeeding while the parent repo failed proves:

- app code was healthy
    
- workflows were healthy
    
- storage schema creation was healthy
    
- the only variable was environment resolution
    

That is exactly the kind of failure your future Paperclip/OpenClaw/Hermes orchestration layer should detect automatically in health checks.