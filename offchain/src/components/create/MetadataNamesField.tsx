"use client";

// Details-file builder: a display name for each judge and a label for each prize,
// following the judges and prizes already entered in the create form.

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { METADATA_LIMITS } from "@/utils/metadata";
import { placeLabel, truncateAddress } from "@/utils/format";

interface Props {
  judges: string[];                    // valid judge addresses from the form
  judgeNames: Record<string, string>;  // address -> name
  prizeCount: number;
  prizeLabels: string[];
  onJudgeNamesChange: (names: Record<string, string>) => void;
  onPrizeLabelsChange: (labels: string[]) => void;
}

export default function MetadataNamesField({
  judges,
  judgeNames,
  prizeCount,
  prizeLabels,
  onJudgeNamesChange,
  onPrizeLabelsChange,
}: Props) {
  function updateLabel(index: number, value: string) {
    const next = Array.from({ length: Math.max(prizeCount, prizeLabels.length) }, (_, i) => prizeLabels[i] ?? "");
    next[index] = value;
    onPrizeLabelsChange(next);
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Judge names</legend>
        {judges.length === 0 && (
          <p className="text-sm text-muted-foreground">Add judge addresses above to give them names.</p>
        )}
        {judges.map((judge, index) => (
          <div key={judge} className="flex flex-col gap-1.5">
            <Label htmlFor={`meta-judge-${index}`} className="text-sm font-normal text-muted-foreground">
              Judge {index + 1} · <span className="font-mono">{truncateAddress(judge)}</span>
            </Label>
            <Input
              id={`meta-judge-${index}`}
              value={judgeNames[judge] ?? ""}
              onChange={(e) => onJudgeNamesChange({ ...judgeNames, [judge]: e.target.value })}
              placeholder="e.g. Alice"
              maxLength={METADATA_LIMITS.judgeName}
              autoComplete="off"
            />
          </div>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Prize names</legend>
        {prizeCount === 0 && (
          <p className="text-sm text-muted-foreground">Add prize amounts above to name them.</p>
        )}
        {Array.from({ length: prizeCount }, (_, index) => (
          <div key={index} className="flex flex-col gap-1.5">
            <Label htmlFor={`meta-prize-${index}`} className="text-sm font-normal text-muted-foreground">
              {placeLabel(index)}
            </Label>
            <Input
              id={`meta-prize-${index}`}
              value={prizeLabels[index] ?? ""}
              onChange={(e) => updateLabel(index, e.target.value)}
              placeholder={`e.g. ${index === 0 ? "Grand prize" : "Best design"}`}
              maxLength={METADATA_LIMITS.tierLabel}
              autoComplete="off"
            />
          </div>
        ))}
      </fieldset>
    </div>
  );
}
