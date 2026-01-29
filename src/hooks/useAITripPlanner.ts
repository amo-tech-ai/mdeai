import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAIProposal } from "./useAIProposal";
import { useAddTripItem } from "./useTripItems";
import type { TripItem } from "@/types/trip";

export interface AITripPlanItem {
  dayIndex: number;
  title: string;
  type: "restaurant" | "apartment" | "car" | "event" | "activity";
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  estimatedCost?: number;
  sourceId?: string;
}

interface AITripPlanResponse {
  items: AITripPlanItem[];
  summary: string;
  totalEstimatedCost?: number;
}

interface UseAITripPlannerOptions {
  tripId: string;
  startDate: string;
  endDate: string;
  destination?: string;
  existingItems?: TripItem[];
}

export function useAITripPlanner(options: UseAITripPlannerOptions) {
  const { tripId, startDate, endDate, destination, existingItems } = options;
  const [isPlanning, setIsPlanning] = useState(false);
  const [planResponse, setPlanResponse] = useState<AITripPlanResponse | null>(null);
  
  const addTripItem = useAddTripItem();
  
  const {
    proposal,
    isApplying,
    canUndo,
    createTripPlanProposal,
    applyProposal,
    rejectProposal,
    undoLastChange,
    clearProposal,
  } = useAIProposal({
    onApplySuccess: () => {
      setPlanResponse(null);
    },
  });

  // Generate AI trip plan
  const generatePlan = useCallback(async (preferences?: {
    interests?: string[];
    budget?: number;
    pace?: "relaxed" | "moderate" | "packed";
  }) => {
    setIsPlanning(true);
    
    try {
      const prompt = buildPlanPrompt(startDate, endDate, destination, preferences);
      
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
          tab: "trips",
          context: {
            tripId,
            startDate,
            endDate,
            destination,
            planMode: true,
          },
        },
      });

      if (error) throw error;

      // Parse the AI response into structured items
      const parsedPlan = parseAIPlanResponse(data, startDate, endDate);
      setPlanResponse(parsedPlan);

      // Create proposal for preview
      if (parsedPlan.items.length > 0) {
        createTripPlanProposal(
          parsedPlan.items,
          tripId,
          existingItems
        );
      }

      return parsedPlan;
    } catch (error) {
      console.error("AI trip planning error:", error);
      toast.error("Failed to generate trip plan. Please try again.");
      return null;
    } finally {
      setIsPlanning(false);
    }
  }, [tripId, startDate, endDate, destination, existingItems, createTripPlanProposal]);

  // Apply the generated plan to the trip
  const applyPlan = useCallback(async () => {
    if (!planResponse || planResponse.items.length === 0) {
      toast.error("No plan to apply");
      return;
    }

    await applyProposal(async () => {
      const startDateObj = new Date(startDate);
      
      // Add all items to the trip
      for (const item of planResponse.items) {
        const itemDate = new Date(startDateObj);
        itemDate.setDate(itemDate.getDate() + item.dayIndex);
        
        // Set time if provided
        if (item.startTime) {
          const [hours, minutes] = item.startTime.split(":").map(Number);
          itemDate.setHours(hours, minutes, 0, 0);
        } else {
          // Default time based on item index
          itemDate.setHours(9 + (planResponse.items.indexOf(item) % 12), 0, 0, 0);
        }

        await addTripItem.mutateAsync({
          trip_id: tripId,
          item_type: item.type,
          source_id: item.sourceId || null,
          title: item.title,
          description: item.description || null,
          start_at: itemDate.toISOString(),
          end_at: item.endTime ? new Date(itemDate.getTime() + 2 * 60 * 60 * 1000).toISOString() : null,
          location_name: item.location || null,
          address: item.address || null,
          latitude: item.latitude || null,
          longitude: item.longitude || null,
          metadata: {
            estimatedCost: item.estimatedCost,
            aiGenerated: true,
          },
        });
      }
    });
  }, [planResponse, startDate, tripId, addTripItem, applyProposal]);

  // Undo applied plan (restore previous state)
  const undoPlan = useCallback(async () => {
    await undoLastChange(async (state) => {
      // Delete all AI-generated items and restore original
      // This would need a batch delete/insert operation
      // For now, we'll just invalidate the cache
      toast.info("Undo functionality coming soon");
    });
  }, [undoLastChange]);

  return {
    isPlanning,
    planResponse,
    proposal,
    isApplying,
    canUndo,
    generatePlan,
    applyPlan,
    rejectPlan: rejectProposal,
    undoPlan,
    clearPlan: clearProposal,
  };
}

function buildPlanPrompt(
  startDate: string,
  endDate: string,
  destination?: string,
  preferences?: {
    interests?: string[];
    budget?: number;
    pace?: "relaxed" | "moderate" | "packed";
  }
): string {
  const days = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  let prompt = `Create a detailed ${days}-day itinerary for ${destination || "Medellín, Colombia"} from ${startDate} to ${endDate}.`;

  if (preferences?.interests?.length) {
    prompt += ` Focus on: ${preferences.interests.join(", ")}.`;
  }

  if (preferences?.budget) {
    prompt += ` Budget: $${preferences.budget} total.`;
  }

  if (preferences?.pace) {
    const paceDescriptions = {
      relaxed: "Keep a relaxed pace with plenty of downtime.",
      moderate: "Balance activities with rest time.",
      packed: "Pack in as many activities as possible.",
    };
    prompt += ` ${paceDescriptions[preferences.pace]}`;
  }

  prompt += ` For each day, suggest 3-4 activities including restaurants, attractions, and experiences. Use the search tools to find real places from the database.`;

  return prompt;
}

function parseAIPlanResponse(
  data: Record<string, unknown>,
  startDate: string,
  endDate: string
): AITripPlanResponse {
  const items: AITripPlanItem[] = [];
  let summary = (data.content as string) || "Your personalized itinerary";
  let totalEstimatedCost = 0;

  // Parse tool results if available
  if (data.toolResults && Array.isArray(data.toolResults)) {
    for (const toolResult of data.toolResults) {
      if (Array.isArray(toolResult.data)) {
        for (const item of toolResult.data) {
          const type = getItemType(toolResult.toolName);
          const planItem: AITripPlanItem = {
            dayIndex: items.length % 3, // Distribute across days
            title: (item.name as string) || (item.title as string) || "Activity",
            type,
            description: item.description as string,
            location: (item.neighborhood as string) || (item.city as string),
            address: item.address as string,
            latitude: item.latitude as number,
            longitude: item.longitude as number,
            sourceId: item.id as string,
          };

          // Add estimated cost
          if (item.price_daily || item.price_monthly || item.ticket_price_min) {
            planItem.estimatedCost = (item.price_daily as number) || 
              (item.ticket_price_min as number) || 
              ((item.price_monthly as number) / 30);
            totalEstimatedCost += planItem.estimatedCost;
          }

          items.push(planItem);
        }
      }
    }
  }

  // If no structured data, try to parse from content
  if (items.length === 0 && data.content) {
    // Basic parsing - in production, this would be more sophisticated
    summary = data.content as string;
  }

  return {
    items,
    summary,
    totalEstimatedCost: totalEstimatedCost > 0 ? totalEstimatedCost : undefined,
  };
}

function getItemType(toolName: string): AITripPlanItem["type"] {
  if (toolName.includes("restaurant")) return "restaurant";
  if (toolName.includes("apartment")) return "apartment";
  if (toolName.includes("car")) return "car";
  if (toolName.includes("event")) return "event";
  return "activity";
}
