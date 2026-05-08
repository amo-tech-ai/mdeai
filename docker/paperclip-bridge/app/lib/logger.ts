import pino from "pino";

export const log = pino({
  name: "paperclip-bridge",
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers['x-bridge-sig']",
      "req.headers['x-paperclip-api-key']",
      "BRIDGE_SECRET",
      "PAPERCLIP_API_KEY",
      "POSTIZ_API_KEY",
      "OPENCLAW_GATEWAY_TOKEN",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    censor: "[REDACTED]",
  },
});
