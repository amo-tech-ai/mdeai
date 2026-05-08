import express, { type Request } from "express";
import { hermesRouter } from "./routes/hermes.js";
import { openclawRouter } from "./routes/openclaw.js";
import { paperclipRouter } from "./routes/paperclip.js";
import { postizRouter } from "./routes/postiz.js";
import { postizApproveRouter } from "./routes/postiz-approve.js";
import { supabaseRouter } from "./routes/supabase.js";
import { createHmacGuard } from "./lib/hmac.js";
import { log } from "./lib/logger.js";

const VERSION = "1.0.0";

export interface AppDeps {
  /** Override secret in tests; defaults to BRIDGE_SECRET env */
  secret?: string;
  now?: () => number;
}

export function createApp(deps: AppDeps = {}): express.Express {
  const app = express();

  // Capture raw body so HMAC sees the exact bytes the caller signed.
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        (req as Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );

  app.disable("x-powered-by");

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      version: VERSION,
      uptime_s: Math.round(process.uptime()),
      ts: Math.floor(Date.now() / 1000),
    });
  });

  const guard = createHmacGuard(deps);
  app.use("/run/openclaw", guard, openclawRouter);
  app.use("/run/hermes", guard, hermesRouter);
  app.use("/run/postiz", guard, postizRouter);
  app.use("/run/postiz-approve", guard, postizApproveRouter);
  app.use("/log/supabase", guard, supabaseRouter);
  app.use("/paperclip", guard, paperclipRouter);

  app.use((_req, res) => res.status(404).json({ success: false, error: { code: "NOT_FOUND" } }));

  return app;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const port = Number(process.env.PORT ?? 3200);
  const app = createApp();
  app.listen(port, () => log.info({ port, version: VERSION }, "paperclip-bridge online"));
}
