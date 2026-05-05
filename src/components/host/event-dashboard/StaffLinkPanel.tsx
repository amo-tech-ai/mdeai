import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, KeyRound, AlertTriangle } from "lucide-react";

interface StaffLinkPanelProps {
  eventId: string;
  staffLinkVersion: number;
  /** Called after the version is successfully bumped, to refresh the parent. */
  onRevoked?: () => void;
}

interface GenerateResult {
  staff_link_url: string;
  expires_at: string;
  staff_link_version: number;
}

/**
 * Right-panel "Door-staff link" widget. Calls the event-staff-link-generator
 * edge function (task 034) for both generate + revoke paths. Never calls
 * `bump_staff_link_version` RPC directly — that's locked to service_role only.
 */
export function StaffLinkPanel({ eventId, staffLinkVersion, onRevoked }: StaffLinkPanelProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        data?: GenerateResult;
        error?: { code: string; message: string };
      }>("event-staff-link-generator", {
        body: { event_id: eventId, ttl_hours: 24 },
      });
      if (error) throw error;
      if (!data?.success || !data.data) {
        throw new Error(data?.error?.message ?? "Failed to generate staff link");
      }
      const url = data.data.staff_link_url;
      setLastUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Copied — share via WhatsApp",
          description: `Expires in 24h. Version v${data.data.staff_link_version}.`,
        });
      } catch {
        toast({
          title: "Link generated (clipboard unavailable)",
          description: "Click the URL below to copy manually.",
        });
      }
    } catch (err) {
      toast({
        title: "Couldn't generate staff link",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke() {
    if (!confirm(
      "Revoke ALL existing staff links for this event? Door staff will need to ask you for a fresh link before scanning again.",
    )) {
      return;
    }
    setRevoking(true);
    try {
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        data?: { revoked: true; staff_link_version: number };
      }>("event-staff-link-generator", {
        body: { event_id: eventId, revoke: true },
      });
      if (error) throw error;
      if (!data?.success) throw new Error("Revoke failed");
      setLastUrl(null);
      toast({
        title: "Staff link revoked",
        description: `Outstanding scanner tokens are now invalid (v${data.data?.staff_link_version}).`,
      });
      onRevoked?.();
    } catch (err) {
      toast({
        title: "Couldn't revoke staff link",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setRevoking(false);
    }
  }

  async function copyAgain() {
    if (!lastUrl) return;
    try {
      await navigator.clipboard.writeText(lastUrl);
      toast({ title: "Copied" });
    } catch {
      toast({ title: "Clipboard unavailable", variant: "destructive" });
    }
  }

  return (
    <Card data-testid="staff-link-panel">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" /> Door-staff link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full"
          data-testid="generate-staff-link"
        >
          {generating ? "Generating…" : "Generate link"}
        </Button>
        {lastUrl ? (
          <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-2">
            <span className="flex-1 truncate text-xs font-mono text-muted-foreground">
              {lastUrl}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyAgain}
              aria-label="Copy URL again"
              data-testid="copy-staff-link"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Active version:{" "}
          <span className="font-medium tabular-nums">v{staffLinkVersion}</span>
        </p>
        <Button
          variant="outline"
          onClick={handleRevoke}
          disabled={revoking}
          className="w-full"
          data-testid="revoke-staff-link"
        >
          <AlertTriangle className="mr-2 h-3.5 w-3.5" />
          {revoking ? "Revoking…" : "Revoke staff link"}
        </Button>
      </CardContent>
    </Card>
  );
}
