import { useState } from "react";
import { Heart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContestEntity, EntityTally } from "@/hooks/useContest";
import eventPlaceholder from "@/assets/event-1.jpg";

interface EntityCardProps {
  entity: ContestEntity;
  tally: EntityTally | undefined;
  onVote: (entity: ContestEntity) => void;
  hasVotedToday: boolean;
  isVoting: boolean;
  contestClosed: boolean;
}

const RANK_COLORS: Record<number, string> = {
  1: "bg-yellow-400 text-yellow-900",
  2: "bg-gray-300 text-gray-800",
  3: "bg-amber-600 text-amber-100",
};

export function EntityCard({
  entity,
  tally,
  onVote,
  hasVotedToday,
  isVoting,
  contestClosed,
}: EntityCardProps) {
  const [imgError, setImgError] = useState(false);
  const votes = tally?.audience_votes ?? 0;
  const rank = tally?.rank;
  const trending = (tally?.trend_24h ?? 0) > 5;

  return (
    <article className="group relative flex flex-col rounded-xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* Hero image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={!imgError && entity.hero_url ? entity.hero_url : eventPlaceholder}
          alt={entity.display_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        {rank != null && rank <= 3 && (
          <div className={cn(
            "absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
            RANK_COLORS[rank] ?? "bg-muted text-foreground",
          )}>
            #{rank}
          </div>
        )}
        {trending && (
          <Badge className="absolute top-2 right-2 bg-orange-500/90 text-white text-[10px] px-1.5 py-0.5 gap-0.5">
            <TrendingUp className="w-2.5 h-2.5" />
            Hot
          </Badge>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <div>
          <h3 className="font-semibold text-sm leading-tight truncate">{entity.display_name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {votes.toLocaleString("es-CO")} votos
          </p>
        </div>

        {contestClosed ? (
          <div className="text-xs text-muted-foreground text-center py-1">Votación cerrada</div>
        ) : hasVotedToday ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs mt-auto"
            onClick={() => onVote(entity)}
          >
            <Heart className="w-3 h-3 mr-1 fill-red-500 text-red-500" />
            Ya votaste — Compartir
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full mt-auto min-h-[44px]"
            onClick={() => onVote(entity)}
            disabled={isVoting}
            aria-label={`Votar por ${entity.display_name}`}
          >
            <Heart className="w-3 h-3 mr-1" />
            Votar
          </Button>
        )}
      </div>
    </article>
  );
}
