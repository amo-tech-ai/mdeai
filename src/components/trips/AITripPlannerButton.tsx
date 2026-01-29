import { useState } from "react";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useAITripPlanner } from "@/hooks/useAITripPlanner";
import { AIPreviewPanel } from "@/components/ai/AIPreviewPanel";
import type { TripItem } from "@/types/trip";

const INTERESTS = [
  { id: "food", label: "Food & Dining" },
  { id: "culture", label: "Culture & History" },
  { id: "nature", label: "Nature & Outdoors" },
  { id: "nightlife", label: "Nightlife" },
  { id: "shopping", label: "Shopping" },
  { id: "adventure", label: "Adventure & Sports" },
];

interface AITripPlannerButtonProps {
  tripId: string;
  startDate: string;
  endDate: string;
  destination?: string;
  existingItems?: TripItem[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AITripPlannerButton({
  tripId,
  startDate,
  endDate,
  destination,
  existingItems,
  variant = "outline",
  size = "default",
}: AITripPlannerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [pace, setPace] = useState<"relaxed" | "moderate" | "packed">("moderate");
  const [budget, setBudget] = useState<string>("");

  const {
    isPlanning,
    proposal,
    isApplying,
    canUndo,
    generatePlan,
    applyPlan,
    rejectPlan,
    undoPlan,
  } = useAITripPlanner({
    tripId,
    startDate,
    endDate,
    destination,
    existingItems,
  });

  const handleGenerate = async () => {
    const result = await generatePlan({
      interests: selectedInterests.length > 0 ? selectedInterests : undefined,
      budget: budget ? Number(budget) : undefined,
      pace,
    });

    if (result && result.items.length > 0) {
      setShowPreview(true);
    }
  };

  const handleApply = async () => {
    await applyPlan();
    setIsOpen(false);
    setShowPreview(false);
  };

  const handleReject = () => {
    rejectPlan();
    setShowPreview(false);
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Wand2 className="w-4 h-4 mr-2" />
          Plan with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Trip Planner
          </DialogTitle>
          <DialogDescription>
            Let AI create a personalized itinerary based on your preferences
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-6 py-4">
            {/* Interests */}
            <div className="space-y-3">
              <Label>What are you interested in?</Label>
              <div className="grid grid-cols-2 gap-2">
                {INTERESTS.map((interest) => (
                  <label
                    key={interest.id}
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedInterests.includes(interest.id)}
                      onCheckedChange={() => toggleInterest(interest.id)}
                    />
                    <span className="text-sm">{interest.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pace */}
            <div className="space-y-3">
              <Label>Preferred pace</Label>
              <RadioGroup value={pace} onValueChange={(v) => setPace(v as typeof pace)}>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="relaxed" />
                    <span className="text-sm">Relaxed</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="moderate" />
                    <span className="text-sm">Moderate</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="packed" />
                    <span className="text-sm">Packed</span>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget">Total budget (optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g., 1000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isPlanning}
              className="w-full"
              size="lg"
            >
              {isPlanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Itinerary
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="py-4">
            <AIPreviewPanel
              proposal={proposal}
              isApplying={isApplying}
              canUndo={canUndo}
              onApply={handleApply}
              onReject={handleReject}
              onUndo={undoPlan}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
