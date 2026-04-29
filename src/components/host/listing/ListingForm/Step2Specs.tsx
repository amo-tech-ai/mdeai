import { Bed, Bath, Maximize, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Currency } from "@/hooks/host/useListingDraft";

/**
 * Step 2 — Specs.
 *
 * One screen, lots of fields. We arrange in 4 visual blocks:
 *   1. Bedrooms / bathrooms (number steppers)
 *   2. Size + price + currency (specs the renter filters on)
 *   3. Furnished + minimum stay (qualitative)
 *   4. Amenities + building amenities (multi-select chips)
 *
 * Validation here is light — required fields are gated at the parent
 * wizard's "Continue" button. The form is intentionally controlled by
 * the parent (no internal state) so the draft hook is the single source
 * of truth.
 */

export interface Step2SpecsValue {
  bedrooms: number;
  bathrooms: number;
  size_sqm: number | null;
  furnished: boolean;
  price_monthly: number | null;
  currency: Currency;
  minimum_stay_days: number;
  amenities: string[];
  building_amenities: string[];
}

interface Step2SpecsProps {
  value: Step2SpecsValue;
  onChange: (next: Step2SpecsValue) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const AMENITY_OPTIONS = [
  "WiFi",
  "Air conditioning",
  "Hot water",
  "Washing machine",
  "Kitchen",
  "TV",
  "Workspace",
  "Pet friendly",
  "Smoking allowed",
  "Parking",
] as const;

const BUILDING_AMENITY_OPTIONS = [
  "Pool",
  "Gym",
  "24/7 security",
  "Elevator",
  "Rooftop",
  "Coworking space",
  "BBQ area",
  "Visitor parking",
] as const;

function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 20,
  testId,
  ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  testId: string;
  ariaLabel: string;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div
      className="inline-flex items-center gap-2"
      role="group"
      aria-label={ariaLabel}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={dec}
        disabled={value <= min}
        data-testid={`${testId}-dec`}
        aria-label={`Decrease ${ariaLabel}`}
      >
        −
      </Button>
      <span
        className="w-10 text-center font-semibold text-lg"
        data-testid={`${testId}-value`}
      >
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={inc}
        disabled={value >= max}
        data-testid={`${testId}-inc`}
        aria-label={`Increase ${ariaLabel}`}
      >
        +
      </Button>
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onChange,
  testIdPrefix,
}: {
  options: ReadonlyArray<string>;
  selected: string[];
  onChange: (next: string[]) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
      {options.map((opt) => {
        const checked = selected.includes(opt);
        return (
          <label
            key={opt}
            className={cn(
              "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 cursor-pointer transition-colors",
              checked
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40",
            )}
            data-testid={`${testIdPrefix}-${opt.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(next) => {
                onChange(
                  next
                    ? [...selected, opt]
                    : selected.filter((s) => s !== opt),
                );
              }}
            />
            <span className="text-sm font-normal">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

export function Step2Specs({
  value,
  onChange,
  onSubmit,
  onBack,
}: Step2SpecsProps) {
  const submitDisabled =
    !value.bedrooms ||
    !value.bathrooms ||
    !value.price_monthly ||
    value.price_monthly <= 0;

  return (
    <div className="space-y-8" data-testid="step2-specs-form">
      {/* Block 1: rooms */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Bed className="w-4 h-4 text-muted-foreground" /> Bedrooms
          </Label>
          <NumberStepper
            value={value.bedrooms}
            onChange={(n) => onChange({ ...value, bedrooms: n })}
            min={0}
            max={10}
            testId="step2-bedrooms"
            ariaLabel="bedrooms"
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Bath className="w-4 h-4 text-muted-foreground" /> Bathrooms
          </Label>
          <NumberStepper
            value={value.bathrooms}
            onChange={(n) => onChange({ ...value, bathrooms: n })}
            min={1}
            max={10}
            testId="step2-bathrooms"
            ariaLabel="bathrooms"
          />
        </div>
      </section>

      {/* Block 2: size + price */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="size-sqm" className="flex items-center gap-2">
            <Maximize className="w-4 h-4 text-muted-foreground" /> Size (m²)
          </Label>
          <Input
            id="size-sqm"
            type="number"
            inputMode="numeric"
            min={10}
            max={2000}
            value={value.size_sqm ?? ""}
            placeholder="e.g. 65"
            onChange={(e) =>
              onChange({
                ...value,
                size_sqm: e.target.value ? Number(e.target.value) : null,
              })
            }
            data-testid="step2-size-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price-monthly" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" /> Monthly
            price
          </Label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input
              id="price-monthly"
              type="number"
              inputMode="numeric"
              min={0}
              value={value.price_monthly ?? ""}
              placeholder={value.currency === "COP" ? "1500000" : "500"}
              onChange={(e) =>
                onChange({
                  ...value,
                  price_monthly: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
              data-testid="step2-price-input"
            />
            <Select
              value={value.currency}
              onValueChange={(v) =>
                onChange({ ...value, currency: v as Currency })
              }
            >
              <SelectTrigger
                className="w-24"
                data-testid="step2-currency-trigger"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COP">COP</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Block 3: qualitative */}
      <section className="grid gap-4 sm:grid-cols-2 items-end">
        <div className="space-y-2">
          <Label htmlFor="min-stay">Minimum stay (days)</Label>
          <Input
            id="min-stay"
            type="number"
            inputMode="numeric"
            min={1}
            max={365}
            value={value.minimum_stay_days}
            onChange={(e) =>
              onChange({
                ...value,
                minimum_stay_days: e.target.value
                  ? Number(e.target.value)
                  : 1,
              })
            }
            data-testid="step2-min-stay-input"
          />
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 min-h-[42px]">
          <Switch
            id="furnished"
            checked={value.furnished}
            onCheckedChange={(checked) =>
              onChange({ ...value, furnished: !!checked })
            }
            data-testid="step2-furnished-switch"
          />
          <Label htmlFor="furnished" className="cursor-pointer font-normal">
            Furnished
          </Label>
        </div>
      </section>

      {/* Block 4: amenities */}
      <section className="space-y-4">
        <div className="space-y-2">
          <Label>Apartment amenities</Label>
          <ChipGroup
            options={AMENITY_OPTIONS}
            selected={value.amenities}
            onChange={(next) => onChange({ ...value, amenities: next })}
            testIdPrefix="step2-amenity"
          />
        </div>
        <div className="space-y-2">
          <Label>Building amenities</Label>
          <ChipGroup
            options={BUILDING_AMENITY_OPTIONS}
            selected={value.building_amenities}
            onChange={(next) =>
              onChange({ ...value, building_amenities: next })
            }
            testIdPrefix="step2-building"
          />
        </div>
      </section>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="flex-1"
          onClick={onBack}
          data-testid="step2-back"
        >
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          onClick={onSubmit}
          disabled={submitDisabled}
          data-testid="step2-submit"
        >
          Continue to photos
        </Button>
      </div>
    </div>
  );
}
