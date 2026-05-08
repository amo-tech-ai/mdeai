# paperclip-bridge

HMAC-signed proxy that joins four sibling Docker networks (openclaw, paperclip,
hermes, postiz) and exposes a uniform `/run/*` and `/log/*` surface to the
mdeai control plane. Every request is signed with a shared `BRIDGE_SECRET`,
replay-windowed to 5 minutes, and audited to Supabase `agent_runs`.

## Endpoints

| Method | Path                | Forwards to                                                     |
|--------|---------------------|-----------------------------------------------------------------|
| GET    | `/health`           | local — returns `{ok, version, uptime_s, ts}`                   |
| POST   | `/run/openclaw`     | `${OPENCLAW_INTERNAL_URL}/hooks/agent` (Bearer gateway token)   |
| POST   | `/run/hermes`       | `${HERMES_INTERNAL_URL}/mcp/invoke`                              |
| POST   | `/run/postiz`       | `${POSTIZ_INTERNAL_URL}/public/v1/posts` (raw `apikey` header)  |
| POST   | `/log/supabase`     | `${SUPABASE_URL}/rest/v1/agent_runs` (service-role key)          |
| POST   | `/paperclip/comment`| `${PAPERCLIP_INTERNAL_URL}/api/issues/:id/comments`              |

All POST routes require:

```
content-type: application/json
x-bridge-ts:  <unix-seconds>
x-bridge-sig: hex(hmac_sha256(BRIDGE_SECRET, "<ts>." + raw_body))
```

## Local development

```bash
cd docker/paperclip-bridge
cp .env.example .env.local
# edit .env.local — BRIDGE_SECRET must be ≥ 32 chars
npm ci
npm run build
npm test          # 35 tests across sign / hmac guard / app routes
npm run dev       # tsx watch on :3200
```

## Deploy (Hostinger VPS)

```bash
# 1. Build + start the container
docker compose up -d --build

# 2. Attach to the four sibling networks (idempotent)
./scripts/attach-networks.sh

# 3. Smoke-test
curl -fsS http://localhost:3200/health
```

Traefik labels in `docker-compose.yml` expose the service at
`https://bridge.srv1641664.hstgr.cloud` once DNS + cert are in place.

## Environment

See [.env.example](.env.example). Critical:

- `BRIDGE_SECRET` — shared HMAC secret, ≥ 32 chars, also held by Claude / control plane
- `OPENCLAW_INTERNAL_URL` / `HERMES_INTERNAL_URL` / `POSTIZ_INTERNAL_URL` / `PAPERCLIP_INTERNAL_URL` — `http://<container>:<port>` reachable on the joined networks
- `OPENCLAW_GATEWAY_TOKEN` / `POSTIZ_API_KEY` / `PAPERCLIP_API_KEY` — downstream credentials, never logged
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — for audit + `/log/supabase`
- `UPSTREAM_TIMEOUT_MS` — default 10 000

## Observability

- Structured logs via pino with secrets redacted
  (`BRIDGE_SECRET`, `*_API_KEY`, `*_GATEWAY_TOKEN`, `authorization`, `x-bridge-sig`)
- Each request appends a row to `agent_runs` with
  `agent_name='bridge'`, `target`, `status` (`ok|failed|timeout`),
  `duration_ms`, optional `error_code`, and metadata `{method, http_status}`
- Audit writes are best-effort — failures never block the response

## Security model

- HMAC-SHA256 over `${ts}.${raw_body}`, constant-time compare via `crypto.timingSafeEqual`
- 5-minute bidirectional replay window (`HMAC_WINDOW_SEC=300`)
- Raw body captured in `express.json({ verify })` so signed bytes match exactly
- Boot-time fail-fast: `BRIDGE_SECRET` missing or < 32 chars → process exits
- Hop-by-hop and `x-bridge-*` headers stripped before forwarding upstream
