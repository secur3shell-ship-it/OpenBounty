"use client";

// Side-by-side table of your private scores for every entry, best total first.

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Submission } from "@/types/submission";
import { CRITERIA, MAX_TOTAL, Scorecard, scoreTotal } from "@/utils/scorecard";
import { sortEntries } from "@/utils/judging";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  submissions: Submission[];
  scorecard: Scorecard;
  onOpenChange: (open: boolean) => void;
}

export default function ScoreCompare({ open, submissions, scorecard, onOpenChange }: Props) {
  const rows = sortEntries(submissions, scorecard, "score");
  const best = scoreTotal(scorecard[rows[0]?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compare your scores</DialogTitle>
          <DialogDescription>Only you see these. Best total first; unscored entries last.</DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-semibold">Entry</th>
                {CRITERIA.map((criterion) => (
                  <th key={criterion.key} scope="col" className="px-2 text-center font-semibold">{criterion.label}</th>
                ))}
                <th scope="col" className="pl-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((submission) => {
                const score = scorecard[submission.id];
                const total = scoreTotal(score);
                const isBest = total !== null && total === best;
                return (
                  <tr key={submission.id} className="border-t">
                    <th scope="row" className="py-2.5 pr-3 text-left font-medium">
                      {submission.title}
                      {score?.note && (
                        <span className="block text-xs font-normal text-muted-foreground">{score.note}</span>
                      )}
                    </th>
                    {CRITERIA.map((criterion) => (
                      <td key={criterion.key} className="px-2 text-center tabular-nums">
                        {score && score[criterion.key] > 0 ? score[criterion.key] : "–"}
                      </td>
                    ))}
                    <td className={cn("pl-2 text-right font-semibold tabular-nums", isBest && "text-highlight")}>
                      {total === null ? "–" : `${total}/${MAX_TOTAL}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
