import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { AdminSponsorApplication } from "@/hooks/admin/useSponsorApplications";
import { formatDistanceToNow } from "date-fns";

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-800',
  silver: 'bg-slate-100 text-slate-800',
  gold: 'bg-yellow-100 text-yellow-800',
  premium: 'bg-purple-100 text-purple-800',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  live: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-500',
};

interface Props {
  application: AdminSponsorApplication;
  onApprove: () => void;
  onReject: () => void;
  onView: () => void;
  isApproving: boolean;
}

export function SponsorApplicationCard({ application, onApprove, onReject, onView, isApproving }: Props) {
  const canApprove = ['submitted', 'under_review'].includes(application.status);
  const submittedAgo = application.submitted_at
    ? formatDistanceToNow(new Date(application.submitted_at), { addSuffix: true })
    : 'Not yet submitted';

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onView}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm">{application.org_display_name}</p>
            <p className="text-xs text-muted-foreground">{application.event_title}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={TIER_COLORS[application.tier] ?? ''}>{application.tier}</Badge>
            <Badge className={STATUS_COLORS[application.status] ?? ''}>{application.status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          {application.activation_type.replace(/_/g, ' ')} · Submitted {submittedAgo}
        </p>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {canApprove && (
            <Button size="sm" onClick={onApprove} disabled={isApproving}>
              {isApproving ? 'Approving...' : 'Approve'}
            </Button>
          )}
          {canApprove && (
            <Button size="sm" variant="outline" onClick={onReject}>
              Reject
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onView}>View</Button>
        </div>
      </CardContent>
    </Card>
  );
}
