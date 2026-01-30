import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RentalsWizardFormProps {
  onComplete: (filterJson: Record<string, unknown>) => void;
  onCancel?: () => void;
}

type WizardStep = 1 | 2 | 3 | 4;

const NEIGHBORHOODS = [
  "El Poblado",
  "Laureles",
  "Envigado",
  "Sabaneta",
  "Belén",
  "Centro",
];

const AMENITIES = [
  { id: "wifi", label: "WiFi", icon: "📶" },
  { id: "ac", label: "A/C", icon: "❄️" },
  { id: "parking", label: "Parking", icon: "🚗" },
  { id: "gym", label: "Gym", icon: "💪" },
  { id: "pool", label: "Pool", icon: "🏊" },
  { id: "balcony", label: "Balcony", icon: "🌇" },
  { id: "washer", label: "Washer", icon: "🧺" },
  { id: "elevator", label: "Elevator", icon: "🛗" },
];

const WORK_NEEDS = [
  { id: "desk", label: "Desk/Workspace" },
  { id: "fast_wifi", label: "Fast WiFi (50+ Mbps)" },
  { id: "quiet", label: "Quiet Area" },
  { id: "backup_power", label: "Backup Power" },
];

const STAY_LENGTHS = [
  { value: 1, label: "1 month" },
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12+ months" },
];

export function RentalsWizardForm({ onComplete, onCancel }: RentalsWizardFormProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [isSearching, setIsSearching] = useState(false);
  
  // Step 1: Dates & Stay
  const [moveInDate, setMoveInDate] = useState<Date>();
  const [stayLength, setStayLength] = useState<number>(3);
  
  // Step 2: Space & Budget
  const [bedrooms, setBedrooms] = useState<number>(1);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([500, 2000]);
  const [flexibleBudget, setFlexibleBudget] = useState(false);
  
  // Step 3: Location
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [furnished, setFurnished] = useState<boolean | null>(true);
  
  // Step 4: Amenities
  const [amenities, setAmenities] = useState<string[]>([]);
  const [workNeeds, setWorkNeeds] = useState<string[]>([]);
  const [petsAllowed, setPetsAllowed] = useState(false);

  const toggleNeighborhood = (n: string) => {
    setNeighborhoods(prev => 
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    );
  };

  const toggleAmenity = (id: string) => {
    setAmenities(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleWorkNeed = (id: string) => {
    setWorkNeeds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step < 4) setStep((step + 1) as WizardStep);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as WizardStep);
  };

  const handleSearch = async () => {
    setIsSearching(true);
    
    const filterJson: Record<string, unknown> = {
      move_in_date: moveInDate ? format(moveInDate, "yyyy-MM-dd") : null,
      stay_length_months: stayLength,
      bedrooms_min: bedrooms === 0 ? 0 : bedrooms,
      budget_min: budgetRange[0],
      budget_max: flexibleBudget ? Math.round(budgetRange[1] * 1.1) : budgetRange[1],
      neighborhoods: neighborhoods.length > 0 ? neighborhoods : null,
      furnished: furnished,
      amenities: amenities.length > 0 ? amenities : null,
      work_needs: workNeeds.length > 0 ? workNeeds : null,
      pets: petsAllowed,
    };
    
    // Clean null values
    Object.keys(filterJson).forEach(key => {
      if (filterJson[key] === null) delete filterJson[key];
    });
    
    // Simulate brief delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSearching(false);
    onComplete(filterJson);
  };

  const stepTitles = {
    1: { title: "When are you moving?", desc: "Tell us about your dates and length of stay" },
    2: { title: "Space & Budget", desc: "How many bedrooms and what's your budget?" },
    3: { title: "Location", desc: "Which neighborhoods are you interested in?" },
    4: { title: "Amenities & Lifestyle", desc: "What features are must-haves?" },
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Move-in Date */}
            <div className="space-y-2">
              <Label>Move-in Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !moveInDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {moveInDate ? format(moveInDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={moveInDate}
                    onSelect={setMoveInDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Length of Stay */}
            <div className="space-y-3">
              <Label>Length of Stay</Label>
              <div className="grid grid-cols-2 gap-2">
                {STAY_LENGTHS.map(({ value, label }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={stayLength === value ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setStayLength(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Bedrooms */}
            <div className="space-y-3">
              <Label>Bedrooms</Label>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((num) => (
                  <Button
                    key={num}
                    type="button"
                    variant={bedrooms === num ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setBedrooms(num)}
                  >
                    {num === 0 ? "Studio" : num === 3 ? "3+" : num}
                  </Button>
                ))}
              </div>
            </div>

            {/* Budget Range */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Monthly Budget (USD)</Label>
                <span className="text-sm font-medium">
                  ${budgetRange[0]} - ${budgetRange[1]}
                </span>
              </div>
              <Slider
                value={budgetRange}
                onValueChange={(v) => setBudgetRange(v as [number, number])}
                min={300}
                max={5000}
                step={100}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>$300</span>
                <span>$5,000+</span>
              </div>
            </div>

            {/* Flexible Budget */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Flexible Budget</Label>
                <p className="text-sm text-muted-foreground">
                  Show listings up to 10% over budget
                </p>
              </div>
              <Switch
                checked={flexibleBudget}
                onCheckedChange={setFlexibleBudget}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Neighborhoods */}
            <div className="space-y-3">
              <Label>Preferred Neighborhoods</Label>
              <p className="text-sm text-muted-foreground">
                Select one or more (leave empty for any)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {NEIGHBORHOODS.map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant={neighborhoods.includes(n) ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => toggleNeighborhood(n)}
                  >
                    {neighborhoods.includes(n) && "✓ "}
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            {/* Furnished */}
            <div className="space-y-3">
              <Label>Furnished</Label>
              <div className="flex gap-2">
                {[
                  { value: true, label: "Furnished" },
                  { value: false, label: "Unfurnished" },
                  { value: null, label: "Either" },
                ].map(({ value, label }) => (
                  <Button
                    key={String(value)}
                    type="button"
                    variant={furnished === value ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setFurnished(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Amenities */}
            <div className="space-y-3">
              <Label>Must-Have Amenities</Label>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map(({ id, label, icon }) => (
                  <Button
                    key={id}
                    type="button"
                    variant={amenities.includes(id) ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => toggleAmenity(id)}
                  >
                    <span className="mr-2">{icon}</span>
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Work Needs */}
            <div className="space-y-3">
              <Label>Remote Work Needs</Label>
              <div className="flex flex-wrap gap-2">
                {WORK_NEEDS.map(({ id, label }) => (
                  <Badge
                    key={id}
                    variant={workNeeds.includes(id) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5"
                    onClick={() => toggleWorkNeed(id)}
                  >
                    {workNeeds.includes(id) && "✓ "}
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Pets */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Pet-Friendly</Label>
                <p className="text-sm text-muted-foreground">
                  I have or plan to have pets
                </p>
              </div>
              <Switch
                checked={petsAllowed}
                onCheckedChange={setPetsAllowed}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="border-primary/20 max-w-xl">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-2 w-8 rounded-full transition-colors",
                  s === step ? "bg-primary" : s < step ? "bg-primary/60" : "bg-muted"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            Step {step} of 4
          </span>
        </div>
        <CardTitle>{stepTitles[step].title}</CardTitle>
        <CardDescription>{stepTitles[step].desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : onCancel ? (
            <Button variant="ghost" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          ) : null}
          
          {step < 4 ? (
            <Button onClick={handleNext} className="flex-1">
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSearch} disabled={isSearching} className="flex-1">
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Apartments
                </>
              )}
            </Button>
          )}
        </div>

        {/* Summary of selections */}
        {(neighborhoods.length > 0 || amenities.length > 0) && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t">
            {neighborhoods.map(n => (
              <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>
            ))}
            {amenities.map(a => (
              <Badge key={a} variant="outline" className="text-xs">
                {AMENITIES.find(x => x.id === a)?.label}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
