#!/usr/bin/env python3
"""Deliver a Stripe event to ticket-payment-webhook with valid signature (EVT-069)."""
import hashlib
import hmac
import json
import os
import sys
import time
import urllib.request

def sign_payload(payload: str, secret: str, timestamp: int | None = None) -> str:
    ts = timestamp or int(time.time())
    signed = f"{ts}.{payload}"
    mac = hmac.new(secret.encode("utf-8"), signed.encode("utf-8"), hashlib.sha256)
    return f"t={ts},v1={mac.hexdigest()}"


def main() -> int:
    event_id = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("STRIPE_EVENT_ID", "")
    if not event_id:
        print("Usage: evt069-deliver-webhook.py <evt_id>", file=sys.stderr)
        return 1

    secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "").strip().strip('"')
    url = os.environ.get(
        "WEBHOOK_URL",
        "https://zkwcbyxiwklihegjhuql.supabase.co/functions/v1/ticket-payment-webhook",
    )
    api_key = os.environ.get("STRIPE_SECRET_KEY", "").strip()
    if not secret or not api_key:
        print("STRIPE_WEBHOOK_SECRET and STRIPE_SECRET_KEY required", file=sys.stderr)
        return 1

    import subprocess

    raw = subprocess.check_output(
        ["stripe", "events", "retrieve", event_id],
        env={**os.environ, "STRIPE_API_KEY": api_key},
        text=True,
    )
    payload = raw.strip()
    sig_header = sign_payload(payload, secret)

    req = urllib.request.Request(
        url,
        data=payload.encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Stripe-Signature": sig_header,
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read().decode("utf-8")
        print(f"HTTP {resp.status}")
        print(body[:500])
    return 0


if __name__ == "__main__":
    sys.exit(main())
