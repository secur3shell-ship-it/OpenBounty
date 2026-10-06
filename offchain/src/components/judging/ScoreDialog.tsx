"use client";

// Dialog where a judge privately rates one entry 1-5 on each criterion, with a note.
// Render it with key={entry id} so it starts from that entry's saved score.

import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CRITERIA, CriterionKey, MAX_RATING, MAX_TOTAL, Score, emptyScore, scoreTotal } from "@/utils/scorecard";
import { cn } from "@/lib/utils";

const RATINGS = Array.from({ length: MAX_RATING }, (_, i) => i + 1);

interface Props {
  open: boolean;
  entryTitle: string;
  initial: Score | undefined;
  onOpenChange: (open: boolean) => void;
  onSave: (score: Score) => void;
}

export default function ScoreDialog({ open, entryTitle, initial, onOpenChange, onSave }: Props) {
  const [score, setScore] = useState<Score>(initial ?? emptyScore());
  const total = scoreTotal(score);

  function rate(key: CriterionKey, value: number) {
    setScore({ ...score, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Score &ldquo;{entryTitle}&rdquo;</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <Lock className="size-3.5" aria-hidden /> Only you see these scores. They&apos;re saved in this browser.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {CRITERIA.map((criterion) => (
            <fieldset key={criterion.key} className="flex flex-col gap-2">
              <legend className="text-sm font-medium">{criterion.label}</legend>
              <p className="text-sm text-muted-foreground">{criterion.hint}</p>
              <div className="flex gap-2">
                {RATINGS.map((value) => (
                  <label
                    key={value}
                    className={cn(
                      "flex size-11 cursor-pointer items-center justify-center rounded-md border font-semibold tabular-nums transition-colors hover:bg-accent sm:size-10",
                      "has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring"
                    )}
                  >
                    <input
                      type="radio"
                      name={`score-${criterion.key}`}
                      value={value}
                      checked={score[criterion.key] === value}
                      onChange={() => rate(criterion.key, value)}
                      className="sr-only"
                      aria-label={`${criterion.label}: ${value} of ${MAX_RATING}`}
                    />
                    {value}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="flex flex-col gap-2">
            <Label htmlFor="score-note">Note (optional)</Label>
            <Textarea
              id="score-note"
              value={score.note}
              onChange={(e) => setScore({ ...score, note: e.target.value })}
              rows={2}
              placeholder="What stood out?"
            />
          </div>
        </div>

        <DialogFooter className="items-center">
          <p className="mr-auto text-sm text-muted-foreground tabular-nums">
            Total: {total === null ? "rate all three" : `${total} / ${MAX_TOTAL}`}
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(score); onOpenChange(false); }}>Save score</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
