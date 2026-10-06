"use client";

// One prize on the judging board. Dropping an entry here asks to vote for it for this
// prize. Shows the votes so far, which entry you voted for, and the winner once picked.

import { DragEvent, useState } from "react";
import type { Address } from "@solana/kit";
import { Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import TokenAmount from "@/components/common/TokenAmount";
import TierStatusBadge from "@/components/bounty/TierStatusBadge";
import type { EscrowAccount } from "@/types/escrow";
import type { Submission } from "@/types/submission";
import { placeLabel } from "@/utils/format";
import { getTierProgress } from "@/utils/status";
import { getVoteCandidates } from "@/utils/submissions";
import { canVoteOnTier } from "@/utils/judging";
import { cn } from "@/lib/utils";

interface Props {
  escrow: EscrowAccount;
  tierIndex: number;
  submissions: Submission[];
  judge: Address;
  isEnded: boolean;
  onDropEntry: (submissionId: string) => void;
}

export default function PrizeColumn({ escrow, tierIndex, submissions, judge, isEnded, onDropEntry }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const tier = escrow.tiers[tierIndex];
  const progress = getTierProgress(escrow, tier);
  const canDrop = canVoteOnTier(escrow, tierIndex, judge);
  const myVote = tier.votes.find((vote) => vote.judge === judge);
  const voted = getVoteCandidates(tier, submissions).filter((candidate) => candidate.votes > 0);

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (!canDrop) return;
    event.preventDefault(); // allows the drop
    setDragOver(true);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragOver(false);
    const submissionId = event.dataTransfer.getData("text/plain");
    if (canDrop && submissionId) onDropEntry(submissionId);
  }

  // No hint once there's a winner: the badge already says so
  let hint: string | null = "Drop an entry here to vote for it";
  if (tier.winner) hint = null;
  else if (myVote) hint = "You've voted on this prize";
  else if (isEnded) hint = "Voting closed";

  return (
    <section
      aria-label={`${placeLabel(tierIndex)} votes`}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-4 transition-colors",
        canDrop && "border-dashed",
        dragOver && "border-primary bg-accent"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {placeLabel(tierIndex)}
          </span>
          <TokenAmount amount={tier.amount} className="text-lg" />
        </div>
        <TierStatusBadge progress={progress} threshold={escrow.threshold} />
      </div>

      {!tier.winner && (
        <Progress
          value={(progress.leadingVotes / escrow.threshold) * 100}
          aria-label={`Leading entry has ${progress.leadingVotes} of ${escrow.threshold} votes needed`}
        />
      )}

      {voted.length > 0 && (
        <ul className="flex flex-col gap-1.5 text-sm">
          {voted.map((candidate) => {
            const isWinner = tier.winner === candidate.address;
            const isMine = myVote !== undefined && myVote.candidate === candidate.address;
            return (
              <li key={candidate.address} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  {isWinner && <Trophy className="size-4 shrink-0 text-highlight" aria-label="Winner" />}
                  <span className="truncate">{candidate.label}</span>
                  {isMine && <span className="shrink-0 text-xs font-semibold text-highlight">your vote</span>}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {candidate.votes} {candidate.votes === 1 ? "vote" : "votes"}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </section>
  );
}
