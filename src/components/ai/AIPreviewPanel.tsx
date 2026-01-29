import { useState } from "react";
import { Check, X, RotateCcw, Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export interface AIProposedChange {
  id: string;
  type: "add" | "remove" | "reorder" | "update";
  summary: string;
  details?: string;
  before?: unknown;
  after?: unknown;
}

export interface AIProposal {
  id: string;
  title: string;
  description: string;
  changes: AIProposedChange[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface AIPreviewPanelProps {
  proposal: AIProposal | null;
  isApplying?: boolean;
  canUndo?: boolean;
  onApply: () => void | Promise<void>;
  onReject: () => void;
  onUndo?: () => void | Promise<void>;
  className?: string;
}

function ChangeItem({ change }: { change: AIProposedChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const typeColors: Record<string, string> = {
    add: "bg-green-500/10 text-green-600 border-green-500/20",
    remove: "bg-red-500/10 text-red-600 border-red-500/20",
    reorder: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    update: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  };
  
  const typeLabels: Record<string, string> = {
    add: "Add",
    remove: "Remove",
    reorder: "Reorder",
    update: "Update",
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
        <Badge variant="outline" className={cn("shrink-0 text-xs", typeColors[change.type])}>
          {typeLabels[change.type]}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{change.summary}</p>
          {change.details && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-0 text-xs text-muted-foreground hover:text-foreground">
                {isOpen ? (
                  <>
                    Hide details <ChevronUp className="w-3 h-3 ml-1" />
                  </>
                ) : (
                  <>
                    Show details <ChevronDown className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          )}
          <CollapsibleContent>
            <p className="text-xs text-muted-foreground mt-2 pl-2 border-l-2 border-border">
              {change.details}
            </p>
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  );
}

export function AIPreviewPanel({
  proposal,
  isApplying = false,
  canUndo = false,
  onApply,
  onReject,
  onUndo,
  className,
}: AIPreviewPanelProps) {
  if (!proposal) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No AI suggestions at the moment
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Ask the AI to help plan or optimize your trip
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-primary/20 shadow-lg", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{proposal.title}</CardTitle>
            <CardDescription className="text-xs">
              {proposal.changes.length} change{proposal.changes.length !== 1 ? "s" : ""} proposed
            </CardDescription>
          </div>
        </div>
        {proposal.description && (
          <p className="text-sm text-muted-foreground mt-2">{proposal.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Changes list */}
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {proposal.changes.map((change) => (
              <ChangeItem key={change.id} change={change} />
            ))}
          </div>
        </ScrollArea>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Button
            onClick={onApply}
            disabled={isApplying}
            className="flex-1"
            size="sm"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Apply Changes
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={onReject}
            disabled={isApplying}
            size="sm"
          >
            <X className="w-4 h-4 mr-2" />
            Dismiss
          </Button>
        </div>

        {/* Undo button (shown after apply) */}
        {canUndo && onUndo && (
          <Button
            variant="ghost"
            onClick={onUndo}
            size="sm"
            className="w-full text-muted-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Undo Last Change
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
