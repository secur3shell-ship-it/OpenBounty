"use client";

// Judges part of the create form: up to 5 judge wallet addresses, and how many
// of their votes a candidate needs to win a prize (a strict majority).

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FormField, { messageId } from "@/components/common/FormField";
import { MAX_JUDGES } from "@/constants/program";

interface Props {
  judges: string[];
  threshold: number;
  judgesError?: string;
  thresholdError?: string;
  onJudgesChange: (judges: string[]) => void;
  onThresholdChange: (threshold: number) => void;
}

export default function JudgesField({
  judges,
  threshold,
  judgesError,
  thresholdError,
  onJudgesChange,
  onThresholdChange,
}: Props) {
  const filledCount = judges.filter((judge) => judge.trim() !== "").length;

  function updateJudge(index: number, value: string) {
    onJudgesChange(judges.map((judge, i) => (i === index ? value : judge)));
  }

  function removeJudge(index: number) {
    onJudgesChange(judges.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Judges</legend>
        <p className="text-sm text-muted-foreground">
          Wallet addresses of up to {MAX_JUDGES} people who vote on the winners.
        </p>

        {judges.map((judge, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={judge}
              onChange={(e) => updateJudge(index, e.target.value)}
              placeholder="Wallet address"
              aria-label={`Judge ${index + 1} wallet address`}
              aria-invalid={Boolean(judgesError)}
              className="font-mono"
              spellCheck={false}
              autoComplete="off"
            />
            {judges.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeJudge(index)}
                aria-label={`Remove judge ${index + 1}`}
              >
                <X />
              </Button>
            )}
          </div>
        ))}

        {judgesError && <p role="alert" className="text-sm text-destructive">{judgesError}</p>}

        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => onJudgesChange([...judges, ""])}
          disabled={judges.length >= MAX_JUDGES}
        >
          <Plus /> Add judge
        </Button>
      </fieldset>

      <FormField
        id="threshold"
        label="Votes needed to pick a winner"
        helper={`Out of ${filledCount} ${filledCount === 1 ? "judge" : "judges"}. More than half must agree.`}
        error={thresholdError}
      >
        <Input
          id="threshold"
          type="number"
          min={1}
          max={MAX_JUDGES}
          value={threshold || ""}
          onChange={(e) => onThresholdChange(Number(e.target.value))}
          aria-invalid={Boolean(thresholdError)}
          aria-describedby={messageId("threshold")}
          className="w-24 tabular-nums"
        />
      </FormField>
    </div>
  );
}
