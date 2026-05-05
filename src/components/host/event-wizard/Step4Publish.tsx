import { useState } from "react";
import { CheckCircle2, Copy, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Step4PublishProps {
  draftId: string | null;
  publishedSlug: string | null;
  publishing: boolean;
  publishError: string | null;
  onBack: () => void;
  onPublish: () => void;
}

/**
 * Step 4 — Publish. Trigger the publish mutation; on success, show the public
 * URL + share copy. The slug-collision retry happens inside `usePublishEvent`.
 */
export function Step4Publish({
  draftId,
  publishedSlug,
  publishing,
  publishError,
  onBack,
  onPublish,
}: Step4PublishProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (publishedSlug) {
    const publicUrl = `${window.location.origin}/event/${publishedSlug}`;

    const copyUrl = async () => {
      try {
        await navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        toast({ title: "URL copied", description: publicUrl });
        setTimeout(() => setCopied(false), 1500);
      } catch {
        toast({
          variant: "destructive",
          title: "Couldn't copy",
          description: "Select the URL manually + copy.",
        });
      }
    };

    return (
      <div className="space-y-5 text-center py-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Your event is live</h3>
          <p className="text-sm text-muted-foreground">
            Anyone with the URL can view the listing + buy tickets.
          </p>
        </div>

        <div className="flex items-center gap-2 max-w-md mx-auto">
          <Input readOnly value={publicUrl} className="font-mono text-sm" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={copyUrl}
            aria-label="Copy URL"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        {copied && (
          <p className="text-xs text-emerald-600">Copied to clipboard</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button asChild variant="outline">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" /> View live
            </a>
          </Button>
          <Button asChild>
            <a href={`/host/event/${draftId}`}>Open dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  // Pre-publish state
  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-medium mb-2">Ready to publish?</h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>• A unique URL will be generated from your event name</li>
          <li>• The event becomes visible on /events to anyone</li>
          <li>• You can keep editing tickets + dashboard after publish</li>
          <li>• Refunds + cancellations available later from /host/event/:id</li>
        </ul>
      </div>

      {publishError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {publishError}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          disabled={publishing || !draftId}
          onClick={onPublish}
        >
          {publishing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Publish event
        </Button>
      </div>
    </div>
  );
}
