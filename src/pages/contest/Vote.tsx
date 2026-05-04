import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useContest, useContestEntities, useContestTally } from "@/hooks/useContest";
import { useVoteCast } from "@/hooks/useVoteCast";
import { useAuth } from "@/hooks/useAuth";
import { ContestHero } from "@/components/contest/ContestHero";
import { LeaderboardTopThree } from "@/components/contest/LeaderboardTopThree";
import { EntityCard } from "@/components/contest/EntityCard";
import { ShareModal } from "@/components/contest/ShareModal";
import { PhoneOtpModal } from "@/components/auth/PhoneOtpModal";
import type { ContestEntity } from "@/hooks/useContest";

export default function Vote() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const { data: contest, isLoading: contestLoading, error: contestError } = useContest(slug);
  const { data: entities = [], isLoading: entitiesLoading } = useContestEntities(contest?.id);
  const { data: tallies = [], isLoading: talliesLoading } = useContestTally(contest?.id);

  const voteCast = useVoteCast();

  const [otpOpen, setOtpOpen] = useState(false);
  const [pendingEntity, setPendingEntity] = useState<ContestEntity | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEntity, setShareEntity] = useState<ContestEntity | null>(null);
  const [votedEntityIds, setVotedEntityIds] = useState<Set<string>>(new Set());
  const [disabledUntil, setDisabledUntil] = useState<number | null>(null);

  const tallyMap = new Map(tallies.map((t) => [t.entity_id, t]));
  const contestClosed = contest?.status === "closed";
  const isRateLimited = disabledUntil !== null && Date.now() < disabledUntil;

  const fireVote = useCallback(async (entity: ContestEntity) => {
    if (!contest) return;
    // Already voted today → open share modal
    if (votedEntityIds.has(entity.id)) {
      setShareEntity(entity);
      setShareOpen(true);
      return;
    }
    try {
      await voteCast.mutateAsync({
        contest_id: contest.id,
        entity_id: entity.id,
      });
      setVotedEntityIds((prev) => new Set([...prev, entity.id]));
      setShareEntity(entity);
      setShareOpen(true);
    } catch (e) {
      const code = (e as Error & { code?: string }).code;
      if (code === "DAILY_QUOTA_EXCEEDED") {
        toast.info("Ya votaste hoy. Comparte para ganar votos extra mañana.");
        setShareEntity(entity);
        setShareOpen(true);
      } else if (code === "RATE_LIMITED") {
        setDisabledUntil(Date.now() + 30_000);
        toast.error("Espera un momento antes de volver a votar.");
      } else if (code === "CONTEST_CLOSED") {
        toast.error("Esta votación ya cerró.");
      } else {
        toast.error(e instanceof Error ? e.message : "No se pudo registrar el voto");
      }
    }
  }, [contest, voteCast, votedEntityIds]);

  const handleVoteTap = useCallback((entity: ContestEntity) => {
    if (isRateLimited) return;
    if (!user) {
      // Require phone OTP first
      setPendingEntity(entity);
      setOtpOpen(true);
      return;
    }
    void fireVote(entity);
  }, [user, isRateLimited, fireVote]);

  const handleOtpVerified = useCallback(() => {
    if (pendingEntity) {
      void fireVote(pendingEntity);
      setPendingEntity(null);
    }
  }, [pendingEntity, fireVote]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (contestLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-64 w-full" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found / draft ────────────────────────────────────────────────────
  if (contestError || !contest || contest.status === "draft") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center bg-background">
        <h1 className="text-2xl font-display font-bold">Concurso no encontrado</h1>
        <p className="text-muted-foreground">
          Este concurso no existe o aún no está disponible.
        </p>
        <Button asChild>
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  // ── Empty entities ────────────────────────────────────────────────────────
  const showEmpty = !entitiesLoading && entities.length === 0;

  const shareUrl = `${window.location.origin}/vote/${contest.slug}`;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Hero */}
      <ContestHero contest={contest} />

      {/* Top 3 leaderboard */}
      {!talliesLoading && tallies.length > 0 && (
        <div className="border-b border-border">
          <LeaderboardTopThree entities={entities} tallies={tallies} />
        </div>
      )}

      {/* Contestant grid */}
      <div className="px-4 pt-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Candidatas
        </h2>

        {showEmpty ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-muted-foreground">
              Esta competencia aún no tiene candidatas. Vuelve pronto.
            </p>
          </div>
        ) : entitiesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {entities.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                tally={tallyMap.get(entity.id)}
                onVote={handleVoteTap}
                hasVotedToday={votedEntityIds.has(entity.id)}
                isVoting={voteCast.isPending && isRateLimited}
                contestClosed={contestClosed}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pt-8 text-center">
        <p className="text-xs text-muted-foreground">
          ¿Cómo funciona la votación?{" "}
          <Link to={`/vote/${contest.slug}/how-it-works`} className="underline hover:text-foreground transition-colors">
            Más información
          </Link>
        </p>
      </div>

      {/* Phone OTP modal */}
      <PhoneOtpModal
        open={otpOpen}
        onOpenChange={setOtpOpen}
        onVerified={handleOtpVerified}
        promptText="Verifica tu teléfono para votar por tu candidata favorita"
      />

      {/* Share modal */}
      {shareEntity && contest && (
        <ShareModal
          open={shareOpen}
          onOpenChange={setShareOpen}
          contestTitle={contest.title}
          entityName={shareEntity.display_name}
          shareUrl={shareUrl}
        />
      )}
    </div>
  );
}
