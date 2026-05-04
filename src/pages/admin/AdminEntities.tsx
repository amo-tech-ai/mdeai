import { useState } from "react";
import { format } from "date-fns";
import { ExternalLink, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  useAdminEntities,
  useApproveEntity,
  useRejectEntity,
  type AdminEntity,
  type AdminEntityTab,
} from "@/hooks/useAdminEntities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ─── Signed URL helper ────────────────────────────────────────────────────────

async function getSignedUrl(storagePath: string, bucket: string): Promise<string | null> {
  if (!storagePath) return null;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 3600);
  if (error) return null;
  return data.signedUrl;
}

// ─── AI moderation badge ──────────────────────────────────────────────────────

interface ModerationBadgeProps {
  entity: AdminEntity;
}

function ModerationBadge({ entity }: ModerationBadgeProps) {
  if (entity.approved) {
    return <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>;
  }
  if (entity.rejection_reason) {
    return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>;
  }
  if (entity.ai_flagged) {
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200">AI Flagged</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Awaiting Review</Badge>;
}

// ─── Expandable detail panel ──────────────────────────────────────────────────

interface EntityDetailProps {
  entity: AdminEntity;
}

function EntityDetail({ entity }: EntityDetailProps) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string | null>>({});
  const [urlsLoaded, setUrlsLoaded] = useState(false);

  const loadSignedUrls = async () => {
    if (urlsLoaded) return;
    const results: Record<string, string | null> = {};

    if (entity.id_front_url) {
      results.id_front = await getSignedUrl(entity.id_front_url, "identity-docs");
    }
    if (entity.id_back_url) {
      results.id_back = await getSignedUrl(entity.id_back_url, "identity-docs");
    }
    if (entity.waiver_url) {
      results.waiver = await getSignedUrl(entity.waiver_url, "identity-docs");
    }

    setSignedUrls(results);
    setUrlsLoaded(true);
  };

  // Load signed URLs once on mount
  useState(() => {
    loadSignedUrls();
  });

  const socialEntries = Object.entries(entity.socials).filter(
    ([, value]) => value != null && value !== "",
  );

  return (
    <div className="p-4 bg-muted/40 rounded-lg space-y-4">
      {/* Bio */}
      {entity.bio && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Bio
          </p>
          <p className="text-sm text-foreground leading-relaxed">{entity.bio}</p>
        </div>
      )}

      {/* Photos */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Photos
        </p>
        <div className="flex flex-wrap gap-3">
          {entity.hero_url && (
            <div className="relative">
              <img
                src={entity.hero_url}
                alt="Hero photo"
                className="w-24 h-24 object-cover rounded-lg border"
              />
              <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                Hero
              </span>
            </div>
          )}
          {entity.media.map((item, idx) => (
            <div key={idx} className="relative">
              <img
                src={item.url}
                alt={`Photo ${idx + 1}`}
                className="w-24 h-24 object-cover rounded-lg border"
              />
              {item.moderation?.flagged && (
                <span className="absolute top-1 right-1 text-[10px] bg-amber-500 text-white px-1 rounded">
                  Flagged
                </span>
              )}
              <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                {item.slot}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Socials */}
      {socialEntries.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Socials
          </p>
          <div className="flex flex-wrap gap-2">
            {socialEntries.map(([platform, handle]) => (
              <a
                key={platform}
                href={
                  platform === "instagram"
                    ? `https://instagram.com/${handle}`
                    : platform === "tiktok"
                      ? `https://tiktok.com/@${handle}`
                      : platform === "facebook"
                        ? `https://facebook.com/${handle}`
                        : `#`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {platform}: {handle}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Identity documents */}
      {(entity.id_front_url || entity.id_back_url || entity.waiver_url) && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Identity Documents
          </p>
          <div className="flex flex-wrap gap-2">
            {signedUrls.id_front && (
              <a
                href={signedUrls.id_front}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                ID Front <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {signedUrls.id_back && (
              <a
                href={signedUrls.id_back}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                ID Back <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {signedUrls.waiver && (
              <a
                href={signedUrls.waiver}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Waiver <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {!urlsLoaded && (
              <span className="text-xs text-muted-foreground">Loading document links…</span>
            )}
          </div>
        </div>
      )}

      {/* Rejection reason (if set) */}
      {entity.rejection_reason && (
        <div>
          <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">
            Rejection Reason
          </p>
          <p className="text-sm text-red-700 bg-red-50 rounded px-3 py-2">
            {entity.rejection_reason}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Table row with expandable detail ────────────────────────────────────────

interface EntityRowProps {
  entity: AdminEntity;
}

function EntityRow({ entity }: EntityRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const approveMutation = useApproveEntity();
  const rejectMutation = useRejectEntity();

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(entity.id);
      toast.success(`${entity.display_name} approved.`);
    } catch {
      toast.error("Failed to approve entity.");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    try {
      await rejectMutation.mutateAsync({ entityId: entity.id, reason: rejectReason.trim() });
      toast.success(`${entity.display_name} rejected.`);
      setRejectOpen(false);
      setRejectReason("");
    } catch {
      toast.error("Failed to reject entity.");
    }
  };

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <TableCell>
          <div className="flex items-center gap-3">
            {entity.hero_url ? (
              <img
                src={entity.hero_url}
                alt={entity.display_name}
                className="w-10 h-10 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
                {entity.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">{entity.display_name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                {entity.slug}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <span className="text-sm text-foreground">{entity.contest_title}</span>
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">
            {entity.submitted_at
              ? format(new Date(entity.submitted_at), "MMM d, yyyy")
              : "—"}
          </span>
        </TableCell>
        <TableCell>
          <ModerationBadge entity={entity} />
        </TableCell>
        <TableCell>
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {!entity.approved && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 px-2 gap-1 text-xs bg-green-600 hover:bg-green-700"
                  disabled={approveMutation.isPending}
                  onClick={handleApprove}
                >
                  <Check className="w-3 h-3" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 gap-1 text-xs border-red-300 text-red-600 hover:bg-red-50"
                  disabled={rejectMutation.isPending}
                  onClick={() => setRejectOpen((v) => !v)}
                >
                  <X className="w-3 h-3" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </TableCell>
        <TableCell>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </TableCell>
      </TableRow>

      {/* Reject textarea row */}
      {rejectOpen && !entity.approved && (
        <TableRow>
          <TableCell colSpan={6} className="p-3 bg-red-50/60">
            <div className="space-y-2 max-w-xl" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs font-medium text-red-700">Rejection reason (required)</p>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this application is being rejected…"
                className="text-sm min-h-[80px] border-red-200 focus-visible:ring-red-300"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  disabled={rejectMutation.isPending || !rejectReason.trim()}
                  onClick={handleReject}
                >
                  Confirm Rejection
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => {
                    setRejectOpen(false);
                    setRejectReason("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}

      {/* Expanded detail row */}
      {expanded && (
        <TableRow>
          <TableCell colSpan={6} className="p-3">
            <EntityDetail entity={entity} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-10 w-48" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-7 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Main page content ────────────────────────────────────────────────────────

function AdminEntitiesContent() {
  const [tab, setTab] = useState<AdminEntityTab>("awaiting");
  const { data: entities, isLoading, error } = useAdminEntities(tab);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">Contest Entities</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review and moderate contestant applications.
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Tab filter */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as AdminEntityTab)}>
          <TabsList>
            <TabsTrigger value="awaiting">Awaiting Review</TabsTrigger>
            <TabsTrigger value="flagged">AI Flagged</TabsTrigger>
            <TabsTrigger value="all">All Submitted</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table card */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isLoading
                ? "Loading…"
                : `${entities?.length ?? 0} application${(entities?.length ?? 0) !== 1 ? "s" : ""}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">Contestant</TableHead>
                  <TableHead>Contest</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableSkeleton />}

                {!isLoading && error && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-destructive">
                      Failed to load entities: {(error as Error).message}
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && !error && entities?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground"
                    >
                      No applications in this queue.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  !error &&
                  entities?.map((entity) => (
                    <EntityRow key={entity.id} entity={entity} />
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminEntities() {
  return (
    <AdminLayout>
      <AdminEntitiesContent />
    </AdminLayout>
  );
}
