import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, PenLine } from "lucide-react";

interface SignatureFormProps {
  onSign: (displayName: string) => void;
  isLoading: boolean;
}

export function SignatureForm({ onSign, isLoading }: SignatureFormProps) {
  const [agreed, setAgreed] = useState(false);
  const [name, setName] = useState("");

  const isNameValid = name.trim().length >= 3;
  const canSubmit = agreed && isNameValid && !isLoading;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    onSign(name.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <Checkbox
          id="agree-terms"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked === true)}
          aria-required="true"
        />
        <Label
          htmlFor="agree-terms"
          className="text-sm leading-relaxed cursor-pointer"
        >
          I have read and agree to the terms of this agreement
        </Label>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signature-name" className="text-sm font-medium">
          Full name
        </Label>
        <Input
          id="signature-name"
          placeholder="Full name as it appears on your ID"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          disabled={isLoading}
        />
        {name.length > 0 && !isNameValid && (
          <p className="text-xs text-destructive">
            Name must be at least 3 characters
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        className="w-full gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing…
          </>
        ) : (
          <>
            <PenLine className="w-4 h-4" />
            Sign Contract
          </>
        )}
      </Button>
    </form>
  );
}
