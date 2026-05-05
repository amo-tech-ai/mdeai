import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Supabase JS doesn't have first-class types for custom schemas yet;
// cast through unknown to access the schema() method.
type SchemaClient = { schema: (s: string) => typeof supabase };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContractRow {
  id: string;
  application_id: string;
  sponsor_user_id: string;
  status: string;
  agreed_amount_cents: number;
  agreed_pricing_model: string;
  sponsor_signed_at: string | null;
  cancellation_window_days: number;
}

interface RoiDailyRow {
  clicks: number | null;
  impressions: number | null;
  attributed_conversions: number | null;
}

interface DisputeData {
  contract: ContractRow;
  roiRows: RoiDailyRow[];
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AdminSponsorDispute() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [adminNote, setAdminNote] = useState("");
  const [partialRefund, setPartialRefund] = useState("");

  // Fetch contract + ROI data
  const { data, isLoading, error } = useQuery<DisputeData>({
    queryKey: ["admin-dispute", id],
    queryFn: async () => {
      const sponsorDb = (supabase as unknown as SchemaClient).schema("sponsor");

      const { data: contract, error: contractErr } = await sponsorDb
        .from("contracts")
        .select("id, application_id, sponsor_user_id, status, agreed_amount_cents, agreed_pricing_model, sponsor_signed_at, cancellation_window_days")
        .eq("application_id", id!)
        .maybeSingle();

      if (contractErr || !contract) {
        throw new Error("Contract not found");
      }

      const { data: roi } = await sponsorDb
        .from("roi_daily")
        .select("clicks, impressions, attributed_conversions")
        .eq("placement_id", contract.id)
        .order("day", { ascending: false })
        .limit(30);

      return {
        contract: contract as unknown as ContractRow,
        roiRows: (roi ?? []) as unknown as RoiDailyRow[],
      };
    },
    enabled: !!id,
    staleTime: 30_000,
  });

  const resolve = useMutation({
    mutationFn: async (action: string) => {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sponsor-cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            application_id: id,
            action,
            admin_note: adminNote || undefined,
            partial_refund_cents: partialRefund
              ? parseInt(partialRefund, 10) * 100
              : undefined,
          }),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-dispute", id] });
      toast.success("Action applied successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Loading / error states ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-8 text-muted-foreground">Loading dispute data...</div>
    );
  }

  if (error || !data?.contract) {
    return (
      <div className="p-8 text-destructive">
        Contract not found.{" "}
        <Link to="/admin/sponsorships" className="underline">
          Back to list
        </Link>
      </div>
    );
  }

  const { contract, roiRows } = data;

  const statusColor: Record<string, string> = {
    signed: "bg-emerald-100 text-emerald-800",
    active: "bg-blue-100 text-blue-800",
    disputed: "bg-amber-100 text-amber-800",
    cancelled: "bg-red-100 text-red-800",
    draft: "bg-gray-100 text-gray-800",
    sent_for_signature: "bg-purple-100 text-purple-800",
    expired: "bg-gray-100 text-gray-600",
  };

  const totalImpressions = roiRows.reduce((s, r) => s + (r.impressions ?? 0), 0);
  const totalClicks = roiRows.reduce((s, r) => s + (r.clicks ?? 0), 0);
  const totalConversions = roiRows.reduce((s, r) => s + (r.attributed_conversions ?? 0), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          to={`/admin/sponsorships/${id}`}
          className="text-muted-foreground text-sm hover:underline"
        >
          Back
        </Link>
        <h1 className="text-2xl font-bold font-display">Dispute Resolution</h1>
        <Badge className={statusColor[contract.status] ?? "bg-gray-100 text-gray-800"}>
          {contract.status}
        </Badge>
      </div>

      {/* Contract summary */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Amount</span>
            <p className="font-medium">
              COP {(contract.agreed_amount_cents / 100).toLocaleString("es-CO")}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Pricing model</span>
            <p className="font-medium">{contract.agreed_pricing_model}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Signed</span>
            <p className="font-medium">
              {contract.sponsor_signed_at
                ? new Date(contract.sponsor_signed_at).toLocaleDateString("es-CO")
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Cancellation window</span>
            <p className="font-medium">{contract.cancellation_window_days} days</p>
          </div>
        </CardContent>
      </Card>

      {/* ROI summary */}
      <Card>
        <CardHeader>
          <CardTitle>ROI Summary (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {roiRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No rollup data yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Impressions</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Clicks</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{totalConversions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Attributed</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution actions */}
      <Card>
        <CardHeader>
          <CardTitle>Resolution Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="admin-note" className="text-sm font-medium">
              Admin note
            </label>
            <Input
              id="admin-note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Reason for resolution..."
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="partial-refund" className="text-sm font-medium">
              Partial refund amount (COP, optional)
            </label>
            <Input
              id="partial-refund"
              value={partialRefund}
              onChange={(e) => setPartialRefund(e.target.value)}
              placeholder="e.g. 2500000"
              type="number"
              className="mt-1"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="destructive"
              onClick={() => resolve.mutate("admin_resolve_cancel")}
              disabled={resolve.isPending}
            >
              Cancel + Full Refund
            </Button>
            <Button
              variant="outline"
              onClick={() => resolve.mutate("admin_resolve_cancel")}
              disabled={resolve.isPending || !partialRefund}
            >
              Cancel + Partial Refund
            </Button>
            <Button
              variant="default"
              onClick={() => resolve.mutate("admin_resolve_dispute")}
              disabled={resolve.isPending}
            >
              Resolve Dispute (no credit)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
