import {
  Inbox,
  Clock,
  CheckCheck,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDuration,
  type LandlordMetrics,
} from "@/hooks/host/useLandlordMetrics";

/**
 * LandlordPerformanceCard — D12 dashboard KPI strip.
 *
 * Four cards in a row (collapses to 2x2 on mobile):
 *
 *   1. Total leads     — last N days, with "X new" sub-label
 *   2. Active          — needs landlord action right now
 *   3. Reply rate      — % with first_reply_at
 *   4. Median reply    — formatted duration
 *
 * All numbers come from useLandlordMetrics() which aggregates
 * client-side from useLeads() — no extra round-trip. Empty + loading
 * states are caller-owned (Dashboard.tsx renders this only when
 * counts.all > 0); we don't render a "0 leads" state here.
 */

interface LandlordPerformanceCardProps {
  metrics: LandlordMetrics;
}

const REPLY_RATE_TARGETS = {
  /** Plan §8 acceptable: ≥25 % reply rate. */
  acceptable: 25,
  /** Stretch: ≥40 %. */
  stretch: 40,
};

const TTFR_TARGETS_MS = {
  /** Acceptable: < 12 h median. */
  acceptable: 12 * 60 * 60 * 1000,
  /** Stretch: < 6 h median. */
  stretch: 6 * 60 * 60 * 1000,
};

function rateTone(pct: number | null): "good" | "ok" | "bad" | "muted" {
  if (pct == null) return "muted";
  if (pct >= REPLY_RATE_TARGETS.stretch) return "good";
  if (pct >= REPLY_RATE_TARGETS.acceptable) return "ok";
  return "bad";
}

function ttfrTone(ms: number | null): "good" | "ok" | "bad" | "muted" {
  if (ms == null) return "muted";
  if (ms <= TTFR_TARGETS_MS.stretch) return "good";
  if (ms <= TTFR_TARGETS_MS.acceptable) return "ok";
  return "bad";
}

const TONE_CLASS: Record<"good" | "ok" | "bad" | "muted", string> = {
  good: "text-emerald-700",
  ok: "text-amber-700",
  bad: "text-destructive",
  muted: "text-muted-foreground",
};

export function LandlordPerformanceCard({
  metrics,
}: LandlordPerformanceCardProps) {
  const cards: KpiSpec[] = [
    {
      key: "total",
      label: `Leads · últimos ${metrics.windowDays}d`,
      value: metrics.total.toString(),
      sub:
        metrics.newCount > 0
          ? `${metrics.newCount} sin ver`
          : "todos vistos",
      Icon: Inbox,
      tone: "muted",
    },
    {
      key: "active",
      label: "Activos",
      value: metrics.active.toString(),
      sub: "esperan respuesta",
      Icon: Clock,
      tone: metrics.active === 0 ? "good" : "muted",
    },
    {
      key: "reply-rate",
      label: "% respondidos",
      value: metrics.replyRatePct == null ? "—" : `${metrics.replyRatePct}%`,
      sub:
        metrics.replyRatePct == null
          ? "sin datos aún"
          : metrics.replyRatePct >= REPLY_RATE_TARGETS.stretch
            ? "excelente"
            : metrics.replyRatePct >= REPLY_RATE_TARGETS.acceptable
              ? `meta: ${REPLY_RATE_TARGETS.stretch}%`
              : `subir a ${REPLY_RATE_TARGETS.acceptable}%`,
      Icon: CheckCheck,
      tone: rateTone(metrics.replyRatePct),
    },
    {
      key: "ttfr",
      label: "Tiempo mediano",
      value: formatDuration(metrics.medianTtfrMs),
      sub:
        metrics.medianTtfrMs == null
          ? "sin respuestas"
          : metrics.medianTtfrMs <= TTFR_TARGETS_MS.stretch
            ? "súper rápido"
            : metrics.medianTtfrMs <= TTFR_TARGETS_MS.acceptable
              ? "ok"
              : "más lento que 12h",
      Icon: TrendingUp,
      tone: ttfrTone(metrics.medianTtfrMs),
    },
  ];

  return (
    <section
      aria-labelledby="performance-heading"
      data-testid="landlord-performance"
    >
      <h2
        id="performance-heading"
        className="text-lg font-semibold text-foreground mb-3"
      >
        Tu desempeño
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Kpi key={c.key} spec={c} />
        ))}
      </div>
    </section>
  );
}

interface KpiSpec {
  key: string;
  label: string;
  value: string;
  sub: string;
  Icon: typeof Inbox;
  tone: "good" | "ok" | "bad" | "muted";
}

function Kpi({ spec }: { spec: KpiSpec }) {
  return (
    <article
      className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1"
      data-testid={`kpi-${spec.key}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{spec.label}</p>
        <spec.Icon
          className="w-4 h-4 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      <p
        className={cn(
          "font-display text-3xl font-bold leading-tight",
          TONE_CLASS[spec.tone],
        )}
        data-testid={`kpi-${spec.key}-value`}
      >
        {spec.value}
      </p>
      <p
        className="text-xs text-muted-foreground"
        data-testid={`kpi-${spec.key}-sub`}
      >
        {spec.sub}
      </p>
    </article>
  );
}
