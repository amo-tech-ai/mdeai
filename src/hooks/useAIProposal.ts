import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { AIProposal, AIProposedChange } from "@/components/ai/AIPreviewPanel";
import type { TripItem } from "@/types/trip";

interface UndoState {
  type: "trip_items";
  tripId: string;
  items: TripItem[];
}

interface UseAIProposalOptions {
  onApplySuccess?: () => void;
  onUndoSuccess?: () => void;
}

export function useAIProposal(options: UseAIProposalOptions = {}) {
  const [proposal, setProposal] = useState<AIProposal | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Create a proposal from AI response
  const createProposal = useCallback(
    (
      title: string,
      description: string,
      changes: AIProposedChange[],
      metadata?: Record<string, unknown>
    ) => {
      const newProposal: AIProposal = {
        id: crypto.randomUUID(),
        title,
        description,
        changes,
        metadata,
        createdAt: new Date(),
      };
      setProposal(newProposal);
      return newProposal;
    },
    []
  );

  // Create proposal from trip planner response
  const createTripPlanProposal = useCallback(
    (
      items: Array<{
        title: string;
        type: string;
        dayIndex: number;
        description?: string;
        location?: string;
      }>,
      tripId: string,
      existingItems?: TripItem[]
    ) => {
      const changes: AIProposedChange[] = items.map((item, index) => ({
        id: `change-${index}`,
        type: "add" as const,
        summary: `Day ${item.dayIndex + 1}: ${item.title}`,
        details: item.description || `${item.type} activity${item.location ? ` at ${item.location}` : ""}`,
      }));

      // Store existing items for undo
      if (existingItems) {
        setUndoState({
          type: "trip_items",
          tripId,
          items: existingItems,
        });
      }

      return createProposal(
        "AI-Generated Itinerary",
        `${items.length} activities suggested based on your preferences`,
        changes,
        { tripId, proposedItems: items }
      );
    },
    [createProposal]
  );

  // Create proposal from route optimization
  const createRouteOptimizationProposal = useCallback(
    (
      optimizedOrder: string[],
      originalItems: TripItem[],
      savings: { timeMinutes: number; distanceKm: number },
      explanation: string
    ) => {
      const changes: AIProposedChange[] = [
        {
          id: "reorder-change",
          type: "reorder",
          summary: `Reorder ${optimizedOrder.length} items for optimal route`,
          details: explanation,
        },
      ];

      if (savings.timeMinutes > 0) {
        changes.push({
          id: "savings-time",
          type: "update",
          summary: `Save ~${savings.timeMinutes} minutes of travel time`,
        });
      }

      if (savings.distanceKm > 0) {
        changes.push({
          id: "savings-distance",
          type: "update",
          summary: `Save ~${savings.distanceKm.toFixed(1)} km of travel distance`,
        });
      }

      // Store current order for undo
      if (originalItems.length > 0) {
        setUndoState({
          type: "trip_items",
          tripId: originalItems[0].trip_id,
          items: originalItems,
        });
      }

      return createProposal(
        "Optimized Route",
        explanation,
        changes,
        { optimizedOrder, originalOrder: originalItems.map((i) => i.id) }
      );
    },
    [createProposal]
  );

  // Apply the current proposal
  const applyProposal = useCallback(
    async (applyFn: () => Promise<void>) => {
      if (!proposal) return;

      setIsApplying(true);
      try {
        await applyFn();
        toast.success("Changes applied successfully");
        setProposal(null);
        options.onApplySuccess?.();
      } catch (error) {
        console.error("Failed to apply proposal:", error);
        toast.error("Failed to apply changes");
      } finally {
        setIsApplying(false);
      }
    },
    [proposal, options]
  );

  // Reject/dismiss the proposal
  const rejectProposal = useCallback(() => {
    setProposal(null);
    setUndoState(null);
    toast.info("Suggestion dismissed");
  }, []);

  // Undo the last applied change
  const undoLastChange = useCallback(
    async (undoFn: (state: UndoState) => Promise<void>) => {
      if (!undoState) {
        toast.error("Nothing to undo");
        return;
      }

      try {
        await undoFn(undoState);
        toast.success("Change undone");
        setUndoState(null);
        options.onUndoSuccess?.();
      } catch (error) {
        console.error("Failed to undo:", error);
        toast.error("Failed to undo changes");
      }
    },
    [undoState, options]
  );

  // Clear all state
  const clearProposal = useCallback(() => {
    setProposal(null);
    setUndoState(null);
  }, []);

  return {
    proposal,
    undoState,
    isApplying,
    canUndo: !!undoState,
    createProposal,
    createTripPlanProposal,
    createRouteOptimizationProposal,
    applyProposal,
    rejectProposal,
    undoLastChange,
    clearProposal,
  };
}
