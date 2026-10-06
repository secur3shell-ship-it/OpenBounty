"use client";

// An entry on the judging board. Drag it onto a prize to vote (mouse), or use
// "Vote as..." (keyboard and phones). Shows your private score for it.

import { DragEvent } from "react";
import { GripVertical, Star, Vote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EscrowAccount } from "@/types/escrow";
import type { Submission } from "@/types/submission";
import { MAX_TOTAL, Score, scoreTotal } from "@/utils/scorecard";
import { formatSol, placeLabel, truncateAddress } from "@/utils/format";
import { votesPerTier } from "@/utils/submissions";
import { cn } from "@/lib/utils";

interface Props {
  submission: Submission;
  escrow: EscrowAccount;
  score: Score | undefined;
  voteTiers: number[];          // prizes this judge can still vote on
  onScore: () => void;
  onVote: (tierIndex: number) => void;
}

export default function BoardCard({ submission, escrow, score, voteTiers, onScore, onVote }: Props) {
  const total = scoreTotal(score);
  const canVote = voteTiers.length > 0;
  const voteCount = votesPerTier(escrow, submission.submitter).reduce((sum, n) => sum + n, 0);

  function handleDragStart(event: DragEvent<HTMLElement>) {
    event.dataTransfer.setData("text/plain", submission.id);
    event.dataTransfer.effectAllowed = "move";
  }

  let scoreText = "Not scored";
  if (total !== null) scoreText = `Your score ${total}/${MAX_TOTAL}`;

  return (
    <article
      draggable={canVote}
      onDragStart={handleDragStart}
      aria-label={submission.title}
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10",
        canVote && "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{submission.title}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {truncateAddress(submission.submitter)}
          </span>
        </div>
        {canVote && <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="outline" className={total === null ? "text-muted-foreground" : "border-primary/60 text-accent-foreground"}>
          {scoreText}
        </Badge>
        {voteCount > 0 && (
          <span className="text-muted-foreground">{voteCount} {voteCount === 1 ? "vote" : "votes"}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onScore}>
          <Star /> Score
        </Button>
        {canVote && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                <Vote /> Vote as...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Vote for this entry as</DropdownMenuLabel>
              {voteTiers.map((tierIndex) => (
                <DropdownMenuItem key={tierIndex} onSelect={() => onVote(tierIndex)}>
                  {placeLabel(tierIndex)} · {formatSol(escrow.tiers[tierIndex].amount)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </article>
  );
}
