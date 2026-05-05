import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useApproveSponsorApplication, useRejectSponsorApplication } from "@/hooks/admin/useSponsorApplications";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink } from "lucide-react";

// Supabase JS doesn't have first-class types for custom schemas yet;
// cast through unknown to access the schema() method.
type SchemaClient = { schema: (s: string) => typeof supabase };

interface SponsorOrganization {
  id: string;
  display_name: string;
  legal_name: string;
  tax_id: string | null;
  website: string | null;
  industry: string | null;
  primary_contact_user_id: string | null;
}

interface SponsorApplication {
  id: string;
  organization_id: string;
  event_id: string;
  activation_type: string;
  tier: string;
  pricing_model: string;
  flat_price_cents: number | null;
  status: string;
  rejection_reason: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
}

interface SponsorAsset {
  id: string;
  application_id: string;
  kind: string;
  storage_path: string | null;
  alt_text: string | null;
  ai_moderation_status: string;
}

interface DetailData {
  application: SponsorApplication;
  organization: SponsorOrganization;
  assets: SponsorAsset[];
}

function formatCop(cents: number | null): string {
  if (cents === null) return 'N/A';
  const value = cents / 100;
  return '$' + value.toLocaleString('es-CO') + ' COP';
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  live: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-500',
};

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-800',
  silver: 'bg-slate-100 text-slate-800',
  gold: 'bg-yellow-100 text-yellow-800',
  premium: 'bg-purple-100 text-purple-800',
};

const MODERATION_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  clean: 'bg-green-100 text-green-700',
  flagged: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-800',
};

function AssetRow({ asset }: { asset: SponsorAsset }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlLoaded, setUrlLoaded] = useState(false);

  const isImage = ['logo', 'image'].includes(asset.kind);

  useState(() => {
    if (asset.storage_path && isImage && !urlLoaded) {
      supabase.storage
        .from('sponsor-assets')
        .createSignedUrl(asset.storage_path, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) setSignedUrl(data.signedUrl);
          setUrlLoaded(true);
        })
        .catch(() => setUrlLoaded(true));
    }
  });

  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-b-0">
      {isImage && signedUrl ? (
        <img
          src={signedUrl}
          alt={asset.alt_text ?? asset.kind}
          className="w-16 h-16 object-cover rounded border"
        />
      ) : isImage && !urlLoaded ? (
        <Skeleton className="w-16 h-16 rounded" />
      ) : (
        <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground uppercase">
          {asset.kind}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium capitalize">{asset.kind}</p>
        {asset.storage_path && (
          <p className="text-xs text-muted-foreground truncate">{asset.storage_path}</p>
        )}
        {asset.alt_text && (
          <p className="text-xs text-muted-foreground">{asset.alt_text}</p>
        )}
      </div>
      <Badge className={MODERATION_COLORS[asset.ai_moderation_status] ?? ''}>
        {asset.ai_moderation_status}
      </Badge>
      {signedUrl && (
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

export default function AdminSponsorshipDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const approve = useApproveSponsorApplication();
  const reject = useRejectSponsorApplication();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-sponsor-application-detail', id],
    enabled: !!id,
    queryFn: async (): Promise<DetailData> => {
      // 1. Fetch application
      const { data: app, error: appErr } = await (supabase as unknown as SchemaClient)
        .schema('sponsor')
        .from('applications')
        .select('id, organization_id, event_id, activation_type, tier, pricing_model, flat_price_cents, status, rejection_reason, submitted_at, approved_at, created_at')
        .eq('id', id!)
        .single();
      if (appErr) throw new Error(appErr.message);

      // 2. Fetch organization
      const { data: org, error: orgErr } = await (supabase as unknown as SchemaClient)
        .schema('sponsor')
        .from('organizations')
        .select('id, display_name, legal_name, tax_id, website, industry, primary_contact_user_id')
        .eq('id', app.organization_id)
        .single();
      if (orgErr) throw new Error(orgErr.message);

      // 3. Fetch assets
      const { data: assets, error: assetsErr } = await (supabase as unknown as SchemaClient)
        .schema('sponsor')
        .from('assets')
        .select('id, application_id, kind, storage_path, alt_text, ai_moderation_status')
        .eq('application_id', id!);
      if (assetsErr) throw new Error(assetsErr.message);

      return {
        application: app as SponsorApplication,
        organization: org as SponsorOrganization,
        assets: (assets ?? []) as SponsorAsset[],
      };
    },
  });

  const handleApprove = () => {
    if (!id) return;
    approve.mutate(id, {
      onSuccess: () => navigate('/admin/sponsorships'),
    });
  };

  const handleRejectConfirm = async () => {
    if (!id) return;
    if (rejectReason.trim().length < 10) {
      toast({ title: 'Rejection reason must be at least 10 characters.', variant: 'destructive' });
      return;
    }
    await reject.mutateAsync({ applicationId: id, reason: rejectReason.trim() });
    setRejectOpen(false);
    setRejectReason('');
    navigate('/admin/sponsorships');
  };

  const canApprove = data && ['submitted', 'under_review'].includes(data.application.status);

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          to="/admin/sponsorships"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sponsorships
        </Link>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        )}

        {error && (
          <p className="text-destructive text-sm">
            Failed to load application: {(error as Error).message}
          </p>
        )}

        {!isLoading && !error && data && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{data.organization.display_name}</h1>
                <p className="text-muted-foreground text-sm">{data.organization.legal_name}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={TIER_COLORS[data.application.tier] ?? ''}>{data.application.tier}</Badge>
                <Badge className={STATUS_COLORS[data.application.status] ?? ''}>{data.application.status}</Badge>
              </div>
            </div>

            {/* Brand Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Brand Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Display Name</span>
                  <span>{data.organization.display_name}</span>
                  <span className="text-muted-foreground">Legal Name</span>
                  <span>{data.organization.legal_name}</span>
                  <span className="text-muted-foreground">Tax ID</span>
                  <span>{data.organization.tax_id ?? 'N/A'}</span>
                  <span className="text-muted-foreground">Industry</span>
                  <span>{data.organization.industry ?? 'N/A'}</span>
                  <span className="text-muted-foreground">Website</span>
                  <span>
                    {data.organization.website ? (
                      <a
                        href={data.organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {data.organization.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : 'N/A'}
                  </span>
                  <span className="text-muted-foreground">Primary Contact ID</span>
                  <span className="font-mono text-xs">{data.organization.primary_contact_user_id ?? 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Package Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Package Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Activation Type</span>
                  <span className="capitalize">{data.application.activation_type.replace(/_/g, ' ')}</span>
                  <span className="text-muted-foreground">Tier</span>
                  <span className="capitalize">{data.application.tier}</span>
                  <span className="text-muted-foreground">Pricing Model</span>
                  <span className="uppercase">{data.application.pricing_model}</span>
                  <span className="text-muted-foreground">Flat Price</span>
                  <span>{formatCop(data.application.flat_price_cents)}</span>
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{data.application.submitted_at ? new Date(data.application.submitted_at).toLocaleDateString('es-CO') : 'N/A'}</span>
                  <span className="text-muted-foreground">Approved</span>
                  <span>{data.application.approved_at ? new Date(data.application.approved_at).toLocaleDateString('es-CO') : 'N/A'}</span>
                </div>
                {data.application.rejection_reason && (
                  <div className="mt-4 p-3 bg-red-50 rounded text-red-700 text-sm">
                    <p className="font-medium mb-1">Rejection Reason</p>
                    <p>{data.application.rejection_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Brand Assets ({data.assets.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {data.assets.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No assets uploaded yet.</p>
                ) : (
                  <div>
                    {data.assets.map((asset) => (
                      <AssetRow key={asset.id} asset={asset} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {canApprove && (
              <div className="flex gap-3">
                <Button onClick={handleApprove} disabled={approve.isPending}>
                  {approve.isPending ? 'Approving...' : 'Approve Application'}
                </Button>
                <Button variant="outline" onClick={() => setRejectOpen(true)}>
                  Reject Application
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Explain why this application is being rejected (min 10 characters)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={reject.isPending}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
