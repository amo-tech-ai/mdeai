# Postiz — Docker Compose setup plan (mdeai)

**Purpose:** Run **your own Postiz stack** on a VPS or dev machine so mdeai (later: Edge Functions) can call Postiz’s **public API** with an API key for approved social scheduling. Postiz stays **outside** Supabase; mdeai only talks HTTPS to it.

**Official docs hub:** Discover all Postiz docs pages via the index at  
[https://docs.postiz.com/llms.txt](https://docs.postiz.com/llms.txt).

**Upstream install guide (this plan is distilled from):**  
[Docker Compose — docs.postiz.com](https://docs.postiz.com/installation/docker-compose)  
**Compose repo:** [gitroomhq/postiz-docker-compose](https://github.com/gitroomhq/postiz-docker-compose).

**Optional video walkthrough:** [YouTube tutorial](https://m.youtube.com/watch?v=A6CjAmJOWvA&t=5s)  
**Upgrade warning (Temporal):** If you migrate from older Postiz, read **[v2.11.2 → v2.12.0+ migration](https://docs.postiz.com/installation/migration)** before changing stacks.

---

## Summary (what you actually do)

You install Docker, clone Postiz’s **official** `docker-compose` repo, configure **URLs + JWT + Postgres/Redis URLs + Temporal**, run `docker compose up`, open the Postiz UI, connect Instagram/X/etc. inside Postiz, then copy **one API key** into mdeai’s secrets — same pattern as described in [`01-postiz-openclaw.md`](./01-postiz-openclaw.md) for scheduling.

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Docker Engine + Compose v2** | `docker compose version` works |
| **Host** | Docs report success on Ubuntu 24.04, **≥ 2 GB RAM, 2 vCPU** (`postiz` + Temporal + Elasticsearch is heavier than Postgres alone — 2 GB is a **minimum**; use 4 GB if Temporal UI/workflows feel sluggish) |
| **Ports** | Default examples: UI **4007** (host→container mapped), Temporal UI **8080**, Temporal **7233**, optional Spotlight **8969** |
| **Secrets discipline** | Generate a **unique long `JWT_SECRET`**; rotate DB passwords away from compose samples for anything beyond local dev |

---

## Plan steps (recommended order)

### Step 1 — Decide environment

Pick how you inject config (official options):

- **A — `environment:` in `docker-compose.yml`** (fine for solo dev/VPS once gitignored overlays exist).
- **B — `postiz.env`** mounted under `/config` for the Postiz container only (clean separation).
- **C — `.env` next to Compose** ([docs discourage](https://docs.postiz.com/installation/docker-compose) as primary; mixing with Compose variable expansion can confuse who reads what).

**Rule:** Prefer **B** or a small tracked `docker-compose.override.yml` locally that is **never** committed with real secrets.

### Step 2 — Clone the upstream stack

Use the vendor repo as source of truth (avoids drifting YAML / Temporal image pins):

```bash
git clone https://github.com/gitroomhq/postiz-docker-compose.git
cd postiz-docker-compose
```

Open and follow the **included** `docker-compose.yml` and any bundled `README`; treat the copy in Postiz docs as reference only — **upstream repo wins** when they differ.

### Step 3 — Configure required variables (checklist)

These classes of settings must form a coherent system (names match official compose):

| Group | Examples | What must be true |
|-------|----------|-------------------|
| **Public URLs** | `MAIN_URL`, `FRONTEND_URL`, `NEXT_PUBLIC_BACKEND_URL` | For prod, replace `http://localhost:4007` with your HTTPS origin and matching `/api` path per Postiz conventions. |
| **Auth secret** | `JWT_SECRET` | Long random unique string per deployment. |
| **Postgres (Postiz app)** | `DATABASE_URL` | Must align with **`postiz-postgres`** credentials (`POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`) in the compose file. |
| **Redis** | `REDIS_URL` | Matches `postiz-redis` service hostname on the Compose network (`redis://postiz-redis:6379` pattern). |
| **Internal/backend** | `BACKEND_INTERNAL_URL` | Matches how the Postiz backend container reaches itself (upstream example uses container-internal port **`3000`**; don’t blindly swap without checking logs). |
| **Temporal** | `TEMPORAL_ADDRESS` | Matches Temporal gRPC (**`temporal:7233`** on `temporal-network`). |
| **Flags** | `IS_GENERAL`, `DISABLE_REGISTRATION`, `RUN_CRON` | Typical self-host: **`IS_GENERAL='true'`**, **`RUN_CRON='true'`**; set **`DISABLE_REGISTRATION='true'`** if this instance is yours only. |
| **Storage** | `STORAGE_PROVIDER`, `UPLOAD_*` | **`local`** vs **Cloudflare R2** bucket settings — prod usually wants object storage behind HTTPS. |

Add **OAuth app IDs** empty at first; fill only for networks you enable (see [Providers](https://docs.postiz.com/providers/overview)).

### Step 4 — Storage choice (quick decision)

| Mode | Good for |
|------|----------|
| **`local` + `./uploads` volume** | Laptop / single VPS POC |
| **`cloudflare`** (R2 vars in docs) | Survives disk nukes + easier TLS/CDN fronts |

Align `NEXT_PUBLIC_UPLOAD_DIRECTORY` / `UPLOAD_DIRECTORY` with the provider you pick.

### Step 5 — Start the stack

```bash
docker compose up -d    # detached; omit -d to watch logs
```

**Operational rule from docs:** Changing env vars normally requires **`docker compose down`** then **`docker compose up`** (recreate containers) so new variables apply — not just restart.

### Step 6 — Verify services

After images settle:

| URL | Meaning |
|-----|---------|
| [http://localhost:4007](http://localhost:4007) (or your mapped port) | **Postiz frontend** |
| [http://localhost:8080](http://localhost:8080) | **Temporal Web UI** (workflow visibility; leave internal if firewalled) |

Scan container logs (`docker compose logs -f postiz`) for Postgres/Temporal connect errors before trusting the UI.

### Step 7 — First-time Postiz UX

1. Create admin user (unless registration disabled — then bootstrap per upstream docs/issue tracker).
2. Connect at least **one** social integration you care about ([Providers overview](https://docs.postiz.com/providers/overview)).
3. From Postiz UI: Settings → reveal **API key** (needed for `@POSTIZ_API_KEY` in mdeai Edge Functions).

### Step 8 — Point mdeai at *your* Postiz API

Depending on deployment:

| Postiz deployed at | Configure mdeai / Edge Secrets |
|--------------------|---------------------------------|
| **Same VPS** behind Nginx + TLS `https://postiz.yourdomain.com` | `POSTIZ_API_KEY` + base URL pointing at that origin’s **`/public/v1`** (see [postiz-docs public API](https://github.com/gitroomhq/postiz-docs/blob/main/README.md)). |
| **Local tunnel** (Cloudflare Tunnel / ngrok) | Temporary URL for demos only; rotate keys often. |

**Never** expose Temporal **8080/7233** to the public internet without VPN — only Postiz’s HTTPS frontend + your chosen API routes.

---

## Troubleshooting shortcuts

- **Temporal upgrade path:** Follow [migration guide](https://docs.postiz.com/installation/migration) step-by-step — don’t skip Elasticsearch/Postgre image pins.
- **4007 blank / backend errors:** Re-check **`NEXT_PUBLIC_BACKEND_URL`** ↔ actual API route; mismatched **`MAIN_URL` / `FRONTEND_URL`** break OAuth callbacks.
- **Uploads broken:** Volume permissions + **`STORAGE_PROVIDER`** consistency (`local` mounts vs R2 URLs).
- **OOM kills on 2 GB:** Temporal + Elasticsearch; add swap or bump RAM before chasing app bugs.

---

## Next docs to read inside Postiz

- [Architecture / how it works](https://docs.postiz.com/howitworks)  
- [Configuration reference](https://docs.postiz.com/configuration/reference)  
- [Support](https://docs.postiz.com/support)

---

## Link back to product plan

Compose install is **infrastructure Phase 3** precursor in [`01-postiz-openclaw.md`](./01-postiz-openclaw.md): once Postiz answers on HTTPS and you hold a stable **`POSTIZ_API_KEY`**, the `postiz-schedule-posts` edge function path becomes testable against **your** instance instead of hosted Postiz SaaS — same API shapes, different base URL secret.
