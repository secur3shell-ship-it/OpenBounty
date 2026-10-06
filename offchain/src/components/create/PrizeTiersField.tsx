"use client";

// Prizes part of the create form: 1 to 4 prize amounts in SOL (1st place first)
// and the total that will be locked.

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_TIERS } from "@/constants/program";
import { formatSol, placeLabel, toLamports } from "@/utils/format";

interface Props {
  amounts: string[];  // kept as text so half-typed values like "0." still work
  error?: string;
  onChange: (amounts: string[]) => void;
}

export default function PrizeTiersField({ amounts, error, onChange }: Props) {
  // Exact lamport sum; amounts that aren't valid yet count as zero
  const total = amounts.reduce((sum, amount) => sum + (toLamports(amount) ?? 0n), 0n);

  function updateAmount(index: number, value: string) {
    onChange(amounts.map((amount, i) => (i === index ? value : amount)));
  }

  function removeAmount(index: number) {
    onChange(amounts.filter((_, i) => i !== index));
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">Prizes</legend>
      <p className="text-sm text-muted-foreground">
        Up to {MAX_TIERS} prizes in SOL. Each one gets its own winner.
      </p>

      {amounts.map((amount, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-20 shrink-0 text-sm text-muted-foreground">{placeLabel(index)}</span>
          <div className="relative w-full max-w-48">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => updateAmount(index, e.target.value)}
              placeholder="0.00"
              aria-label={`${placeLabel(index)} in SOL`}
              aria-invalid={Boolean(error)}
              className="pr-12 tabular-nums"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              SOL
            </span>
          </div>
          {amounts.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeAmount(index)}
              aria-label={`Remove ${placeLabel(index)}`}
            >
              <X />
            </Button>
          )}
        </div>
      ))}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([...amounts, ""])}
          disabled={amounts.length >= MAX_TIERS}
        >
          <Plus /> Add prize
        </Button>
        <p className="text-sm text-muted-foreground">
          Total to lock:{" "}
          <span className="font-semibold tabular-nums text-highlight">{formatSol(total)}</span>
        </p>
      </div>
    </fieldset>
  );
}
