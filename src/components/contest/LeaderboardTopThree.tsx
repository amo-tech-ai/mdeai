import { Crown } from "lucide-react";
import type { ContestEntity, EntityTally } from "@/hooks/useContest";
import eventPlaceholder from "@/assets/event-1.jpg";

interface LeaderboardTopThreeProps {
  entities: ContestEntity[];
  tallies: EntityTally[];
}

const MEDAL = ["🥇", "🥈", "🥉"];
const SIZES = ["h-24 w-24", "h-20 w-20", "h-18 w-18"];
const ORDER = [1, 0, 2]; // podium visual order: 2nd, 1st, 3rd

export function LeaderboardTopThree({ entities, tallies }: LeaderboardTopThreeProps) {
  const tallyMap = new Map(tallies.map((t) => [t.entity_id, t]));

  const ranked = entities
    .map((e) => ({ entity: e, tally: tallyMap.get(e.id) }))
    .sort((a, b) => (b.tally?.audience_votes ?? 0) - (a.tally?.audience_votes ?? 0))
    .slice(0, 3);

  if (ranked.length === 0) return null;

  // Reorder for podium display: 2nd, 1st, 3rd
  const podium = ORDER.map((i) => ranked[i]).filter(Boolean);

  return (
    <div className="px-4 py-5">
      <div className="flex items-center gap-2 mb-4">
        <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Top 3
        </h2>
      </div>
      <div className="flex items-end justify-center gap-2">
        {podium.map((item, podiumIdx) => {
          if (!item) return null;
          const realRank = ranked.indexOf(item);
          const isFirst = realRank === 0;
          return (
            <div
              key={item.entity.id}
              className={`flex flex-col items-center gap-1 ${isFirst ? "order-2" : podiumIdx === 1 ? "order-1" : "order-3"}`}
            >
              <span className="text-lg">{MEDAL[realRank]}</span>
              <div className={`relative rounded-full overflow-hidden border-2 border-background shadow-md ${SIZES[realRank] ?? SIZES[2]}`}>
                <img
                  src={item.entity.hero_url ?? eventPlaceholder}
                  alt={item.entity.display_name}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              <p className="text-xs font-medium text-center max-w-[80px] truncate">
                {item.entity.display_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(item.tally?.audience_votes ?? 0).toLocaleString("es-CO")} votos
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
