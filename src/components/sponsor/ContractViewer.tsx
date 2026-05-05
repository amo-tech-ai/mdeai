import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContractViewerProps {
  signedUrl: string | null;
}

export function ContractViewer({ signedUrl }: ContractViewerProps) {
  if (!signedUrl) {
    return (
      <div
        className={cn(
          "w-full min-h-[600px] rounded-lg border flex flex-col items-center justify-center",
          "bg-muted/30 text-muted-foreground gap-3",
        )}
        role="status"
        aria-label="Loading contract PDF"
      >
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Loading contract PDF…</p>
      </div>
    );
  }

  return (
    <iframe
      src={signedUrl}
      className="w-full h-full min-h-[600px] rounded-lg border"
      title="Contract PDF"
    />
  );
}
