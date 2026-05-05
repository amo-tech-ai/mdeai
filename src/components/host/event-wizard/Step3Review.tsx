import { Button } from "@/components/ui/button";
import { Pencil, Loader2 } from "lucide-react";
import {
  type EventBasicsInput,
  type TicketTierInput,
  type WizardStep,
} from "@/types/event-wizard";

interface Step3ReviewProps {
  basics: Partial<EventBasicsInput>;
  tickets: TicketTierInput[];
  saving: boolean;
  onEditStep: (step: WizardStep) => void;
  onContinue: () => void;
  onBack: () => void;
}

const fmtCop = (cents: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(cents / 100);

const fmtDate = (iso: string | undefined) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

/**
 * Step 3 — Review. Read-only summary with per-section edit pencils that
 * jump back to the relevant step.
 */
export function Step3Review({
  basics,
  tickets,
  saving,
  onEditStep,
  onContinue,
  onBack,
}: Step3ReviewProps) {
  return (
    <div className="space-y-5">
      <Section title="Basics" onEdit={() => onEditStep(1)}>
        <Row label="Name" value={basics.name || "—"} />
        <Row label="Type" value={basics.event_type || "other"} />
        <Row label="Start" value={fmtDate(basics.event_start_time)} />
        <Row label="End" value={fmtDate(basics.event_end_time)} />
        <Row label="Timezone" value={basics.timezone ?? "America/Bogota"} />
        <Row label="Venue + address" value={basics.address || "—"} />
        <Row label="City" value={basics.city || "—"} />
        {basics.website ? <Row label="Website" value={basics.website} /> : null}
        {basics.age_restriction ? (
          <Row label="Age restriction" value={basics.age_restriction} />
        ) : null}
        {basics.description ? (
          <div className="mt-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              Description
            </p>
            <p className="text-sm whitespace-pre-line">{basics.description}</p>
          </div>
        ) : null}
      </Section>

      <Section title="Tickets" onEdit={() => onEditStep(2)}>
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tiers yet — go back to Step 2.</p>
        ) : (
          <div className="space-y-2">
            {tickets.map((t, i) => (
              <div
                key={t.id ?? i}
                className="flex items-baseline justify-between gap-3 rounded-md border bg-card px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{t.name || "(unnamed)"}</p>
                  {t.description ? (
                    <p className="text-xs text-muted-foreground">
                      {t.description}
                    </p>
                  ) : null}
                </div>
                <div className="text-right text-sm">
                  <p>
                    {fmtCop(t.price_cents)} × {t.qty_total.toLocaleString("es-CO")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max {t.max_per_order}/order
                  </p>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              Total capacity:{" "}
              {tickets
                .reduce((s, t) => s + t.qty_total, 0)
                .toLocaleString("es-CO")}{" "}
              tickets · max revenue{" "}
              {fmtCop(
                tickets.reduce((s, t) => s + t.price_cents * t.qty_total, 0),
              )}
            </p>
          </div>
        )}
      </Section>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" disabled={saving} onClick={onContinue}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Continue to publish
        </Button>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}

function Section({ title, onEdit, children }: SectionProps) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={onEdit}
        >
          <Pencil className="w-3 h-3" /> Edit
        </Button>
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

interface RowProps {
  label: string;
  value: string;
}

function Row({ label, value }: RowProps) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="w-32 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="flex-1 truncate">{value}</span>
    </div>
  );
}
