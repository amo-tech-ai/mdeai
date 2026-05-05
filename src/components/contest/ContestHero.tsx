import { useEffect, useState } from "react";
import { Calendar, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Contest } from "@/hooks/useContest";

interface ContestHeroProps {
  contest: Contest;
}

function useCountdown(endsAt: string) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endsAt));
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return timeLeft;
}

function getTimeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { d, h, m, s };
}

const KIND_LABELS: Record<string, string> = {
  pageant: "Reinado",
  restaurant: "Restaurante",
  event: "Evento",
  generic: "Concurso",
};

export function ContestHero({ contest }: ContestHeroProps) {
  const timeLeft = useCountdown(contest.ends_at);

  return (
    <div className="relative w-full overflow-hidden">
      {contest.cover_url ? (
        <div className="absolute inset-0">
          <img
            src={contest.cover_url}
            alt={contest.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-primary/50" />
      )}

      <div className="relative z-10 px-4 pt-8 pb-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <Badge className="bg-yellow-400/20 text-yellow-300 border-yellow-400/40 text-xs">
            {KIND_LABELS[contest.kind] ?? "Concurso"}
          </Badge>
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-bold leading-tight mb-2">
          {contest.title}
        </h1>

        {contest.description && (
          <p className="text-sm text-white/80 mb-4 line-clamp-2">{contest.description}</p>
        )}

        <div className="flex items-center gap-2 text-sm text-white/70 mb-4">
          <Calendar className="w-4 h-4" />
          <span>
            Vota antes del{" "}
            <span className="text-white font-medium">
              {format(new Date(contest.ends_at), "d 'de' MMMM, yyyy", { locale: es })}
            </span>
          </span>
        </div>

        {timeLeft ? (
          <div className="flex gap-3">
            {[
              { label: "días", value: timeLeft.d },
              { label: "horas", value: timeLeft.h },
              { label: "min", value: timeLeft.m },
              { label: "seg", value: timeLeft.s },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 min-w-[48px]">
                  <span className="text-xl font-bold font-mono tabular-nums">
                    {String(value).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[10px] text-white/60 mt-0.5 block">{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <Badge variant="destructive" className="text-sm">
            Votación cerrada
          </Badge>
        )}
      </div>
    </div>
  );
}
