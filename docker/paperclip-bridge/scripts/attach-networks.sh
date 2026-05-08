#!/usr/bin/env bash
# Idempotently attach the paperclip-bridge container to all four trio networks.
# Run on the Hostinger VPS after `docker compose up -d`.

set -euo pipefail

CONTAINER="${CONTAINER:-paperclip-bridge}"
NETWORKS=(
  "openclaw-vmjg_default"
  "paperclip-dy8r_default"
  "hermes-agent-ifsj_default"
  "postiz-6buz_default"
)

if ! docker inspect -f '{{.State.Running}}' "$CONTAINER" >/dev/null 2>&1; then
  echo "error: container '$CONTAINER' not found or not running" >&2
  exit 1
fi

for net in "${NETWORKS[@]}"; do
  if ! docker network inspect "$net" >/dev/null 2>&1; then
    echo "skip: network '$net' does not exist on this host" >&2
    continue
  fi
  attached=$(docker network inspect "$net" -f '{{range .Containers}}{{.Name}} {{end}}' | tr ' ' '\n' | grep -Fx "$CONTAINER" || true)
  if [[ -n "$attached" ]]; then
    echo "ok: $CONTAINER already on $net"
  else
    docker network connect "$net" "$CONTAINER"
    echo "connected: $CONTAINER -> $net"
  fi
done

echo
echo "current networks for $CONTAINER:"
docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}  - {{$k}} ({{$v.IPAddress}}){{"\n"}}{{end}}' "$CONTAINER"
