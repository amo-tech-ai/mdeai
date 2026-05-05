import { useState } from 'react';
import { MapPin, Calendar, Users, DollarSign, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ChatContext } from '@/types/chat';
import { EMPTY_CHAT_CONTEXT, hasChatContext } from '@/types/chat';
import { cn } from '@/lib/utils';

/**
 * Persistent context bar rendered above the chat message list.
 *
 * Four chips — neighborhood · dates · travelers · budget — travel with the
 * conversation and flow into every tool call (the edge function inlines them
 * in the system prompt so Gemini inherits them without the user re-typing).
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 2 Mon.
 */

interface ChatContextChipsProps {
  value: ChatContext;
  onChange: (next: ChatContext) => void;
  /** Show a subtle "Add context" placeholder when all chips are empty. */
  showPlaceholder?: boolean;
}

const NEIGHBORHOODS = [
  'El Poblado',
  'Laureles',
  'Envigado',
  'Provenza',
  'Sabaneta',
  'Belén',
];

function formatDateRange(dates?: ChatContext['dates']): string | null {
  if (!dates) return null;
  const { start, end } = dates;
  if (!start && !end) return null;
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `from ${fmt(start)}`;
  if (end) return `until ${fmt(end!)}`;
  return null;
}

function formatBudget(budget?: ChatContext['budget']): string | null {
  if (!budget) return null;
  const { min, max } = budget;
  if (min == null && max == null) return null;
  if (min != null && max != null) return `$${min}–$${max}`;
  if (min != null) return `≥ $${min}`;
  if (max != null) return `≤ $${max}`;
  return null;
}

function Chip({
  active,
  icon: Icon,
  label,
  onClear,
  onClick,
  triggerRef,
  'aria-label': ariaLabel,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClear?: () => void;
  onClick?: () => void;
  triggerRef?: React.Ref<HTMLButtonElement>;
  'aria-label'?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border text-xs transition-colors',
        active
          ? 'border-primary/40 bg-primary/5 text-foreground'
          : 'border-border bg-background/50 text-muted-foreground hover:bg-muted',
      )}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className="flex items-center gap-1.5 pl-3 pr-2 py-1.5"
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>
      {active && onClear && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          aria-label={`Clear ${ariaLabel ?? 'chip'}`}
          className="pr-2 py-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function NeighborhoodPopover({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Chip
          active={!!value}
          icon={MapPin}
          label={value || 'Neighborhood'}
          aria-label="Edit neighborhood"
          onClear={value ? () => onChange(null) : undefined}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <Label className="text-xs font-medium">Neighborhood</Label>
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Laureles"
          className="mt-1.5 h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onChange(draft.trim() || null);
              setOpen(false);
            }
          }}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {NEIGHBORHOODS.map((n) => (
            <button
              key={n}
              type="button"
              className="px-2 py-1 rounded-full border border-border text-xs hover:bg-muted"
              onClick={() => {
                setDraft(n);
                onChange(n);
                setOpen(false);
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft('');
              onChange(null);
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onChange(draft.trim() || null);
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DatesPopover({
  value,
  onChange,
}: {
  value: ChatContext['dates'] | null | undefined;
  onChange: (v: ChatContext['dates'] | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(value?.start ?? '');
  const [end, setEnd] = useState(value?.end ?? '');
  const label = formatDateRange(value ?? null) ?? 'Dates';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Chip
          active={!!formatDateRange(value ?? null)}
          icon={Calendar}
          label={label}
          aria-label="Edit dates"
          onClear={formatDateRange(value ?? null) ? () => onChange(null) : undefined}
        />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <Label className="text-xs font-medium">Stay dates</Label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
              From
            </Label>
            <Input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
              To
            </Label>
            <Input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStart('');
              setEnd('');
              onChange(null);
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const next: ChatContext['dates'] = {
                start: start || null,
                end: end || null,
              };
              if (!next.start && !next.end) onChange(null);
              else onChange(next);
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TravelersPopover({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = value != null ? `${value} ${value === 1 ? 'traveler' : 'travelers'}` : 'Travelers';
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Chip
          active={value != null}
          icon={Users}
          label={label}
          aria-label="Edit travelers"
          onClear={value != null ? () => onChange(null) : undefined}
        />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3">
        <Label className="text-xs font-medium">Travelers</Label>
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                onChange(n);
                setOpen(false);
              }}
              className={cn(
                'w-9 h-9 rounded-full border text-sm flex items-center justify-center transition-colors',
                value === n
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted',
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BudgetPopover({
  value,
  onChange,
}: {
  value: ChatContext['budget'] | null | undefined;
  onChange: (v: ChatContext['budget'] | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState<string>(value?.min != null ? String(value.min) : '');
  const [max, setMax] = useState<string>(value?.max != null ? String(value.max) : '');
  const label = formatBudget(value ?? null) ?? 'Budget';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Chip
          active={!!formatBudget(value ?? null)}
          icon={DollarSign}
          label={label}
          aria-label="Edit budget"
          onClear={formatBudget(value ?? null) ? () => onChange(null) : undefined}
        />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <Label className="text-xs font-medium">Monthly budget (USD)</Label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Min
            </Label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder="500"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Max
            </Label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder="1200"
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMin('');
              setMax('');
              onChange(null);
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const nMin = min.trim() === '' ? null : Number(min);
              const nMax = max.trim() === '' ? null : Number(max);
              const safeMin = nMin != null && Number.isFinite(nMin) && nMin >= 0 ? nMin : null;
              const safeMax = nMax != null && Number.isFinite(nMax) && nMax >= 0 ? nMax : null;
              if (safeMin == null && safeMax == null) onChange(null);
              else onChange({ min: safeMin, max: safeMax });
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ChatContextChips({
  value,
  onChange,
  showPlaceholder = true,
}: ChatContextChipsProps) {
  const has = hasChatContext(value);
  const ctx = value ?? EMPTY_CHAT_CONTEXT;

  if (!has && !showPlaceholder) return null;

  const update = (patch: Partial<ChatContext>) => onChange({ ...ctx, ...patch });

  return (
    <div
      aria-label="Search context"
      className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-background/60 backdrop-blur"
    >
      <NeighborhoodPopover
        value={ctx.neighborhood ?? null}
        onChange={(v) => update({ neighborhood: v })}
      />
      <DatesPopover
        value={ctx.dates ?? null}
        onChange={(v) => update({ dates: v })}
      />
      <TravelersPopover
        value={ctx.travelers ?? null}
        onChange={(v) => update({ travelers: v })}
      />
      <BudgetPopover
        value={ctx.budget ?? null}
        onChange={(v) => update({ budget: v })}
      />
      {has && (
        <button
          type="button"
          className="ml-1 text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          onClick={() =>
            onChange({
              neighborhood: null,
              dates: null,
              travelers: null,
              budget: null,
            })
          }
        >
          Clear all
        </button>
      )}
    </div>
  );
}
