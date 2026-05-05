import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReasoningPhase {
  phase: string;
  agent_label?: string;
  message: string;
  ts: number;
}

interface ChatReasoningTraceProps {
  phases: ReasoningPhase[];
  /** True while the turn is still streaming — shows spinner + live label. */
  isActive: boolean;
}

/**
 * Mindtrip-style "Thought for Ns" collapsible. Shown above the assistant
 * message when the turn produced phase events from the edge function.
 *
 * While active, expands automatically and shows a spinner with the latest
 * phase message. After the turn ends, collapses to "Thought for Ns >" —
 * click to expand the full reasoning trace.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 1 Wed.
 */
export function ChatReasoningTrace({ phases, isActive }: ChatReasoningTraceProps) {
  const [expanded, setExpanded] = useState(isActive);
  const startRef = useRef<number | null>(null);
  const [durationSec, setDurationSec] = useState<number | null>(null);

  // Track duration — first phase timestamp ... last known.
  useEffect(() => {
    if (phases.length > 0 && startRef.current == null) {
      startRef.current = phases[0].ts;
    }
    if (!isActive && startRef.current && phases.length > 0) {
      const elapsed = Math.max(1, Math.round((phases[phases.length - 1].ts - startRef.current) / 1000));
      setDurationSec(elapsed);
    }
  }, [phases, isActive]);

  // Auto-expand while active, auto-collapse when done.
  useEffect(() => {
    setExpanded(isActive);
  }, [isActive]);

  if (phases.length === 0 && !isActive) return null;

  const latestMessage = phases[phases.length - 1]?.message ?? 'Thinking…';
  const agentLabel = phases[phases.length - 1]?.agent_label;

  return (
    <div className="mb-2 rounded-xl bg-muted/40 border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/60 transition-colors"
      >
        {isActive ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary flex-shrink-0" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        )}
        <span className="text-xs font-medium flex-1 min-w-0">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5">
              {agentLabel && <span className="text-muted-foreground">{agentLabel} ·</span>}
              <span className="truncate">{latestMessage}</span>
            </span>
          ) : (
            <>Thought for {durationSec ?? '…'}s</>
          )}
        </span>
        <ChevronRight
          className={cn(
            'w-3.5 h-3.5 text-muted-foreground transition-transform',
            expanded && 'rotate-90',
          )}
        />
      </button>
      {expanded && phases.length > 0 && (
        <div className="px-3 pb-2 pt-0 space-y-0.5 border-t border-border/50">
          {phases.map((p, i) => (
            <div key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-muted-foreground/40 mt-1">•</span>
              <span className="flex-1">
                {p.agent_label && (
                  <span className="font-medium text-foreground/70 mr-1">{p.agent_label}:</span>
                )}
                {p.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
