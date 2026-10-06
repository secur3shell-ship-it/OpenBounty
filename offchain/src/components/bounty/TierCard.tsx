"use client";

// One prize on the bounty detail page: amount, status, vote progress or winner,
// and the action for your role (judges vote, the winner claims within the claim window).

import type { Address as SolanaAddress } from "@solana/kit";
import { Loader2, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Address from "@/components/common/Address";
import TokenAmount from "@/components/common/TokenAmount";
import TierStatusBadge from "./TierStatusBadge";
import type { EscrowAccount } from "@/types/escrow";
import { formatDate, formatSol, placeLabel, truncateAddress } from "@/utils/format";
import { getCandidateTallies, getTierProgress, isClaimWindowOpen, isVotingOpen } from "@/utils/status";
import type { PendingAction } from "@/hooks/useBountyActions";

interface Props {
  escrow: EscrowAccount;
  tierIndex: number;
  viewer: SolanaAddress | null;
  pending: PendingAction | null;
  onVote: (tierIndex: number) => void;
  onClaim: (tierIndex: number) => void;
}

export default function TierCard({ escrow, tierIndex, viewer, pending, onVote, onClaim }: Props) {
  const tier = escrow.tiers[tierIndex];
  const progress = getTierProgress(escrow, tier);
  const tallies = getCandidateTallies(tier);
  const votingOpen = isVotingOpen(escrow);

  const isJudge = viewer !== null && escrow.judges.includes(viewer);
  const myVote = viewer ? tier.votes.find((vote) => vote.judge === viewer) : undefined;
  const isMyPrize = viewer !== null && tier.winner === viewer;

  const canVote = isJudge && !myVote && !tier.winner && votingOpen;
  const canClaim = isMyPrize && !tier.claimed && !tier.refunded && isClaimWindowOpen(escrow);
  const awaitingClaim = progress.status === "winner";
  const claiming = pending === `claim-${tierIndex}`;
  const voting = pending === `vote-${tierIndex}`;

  return (
    <Card className="gap-4 px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {placeLabel(tierIndex)}
          </span>
          <TokenAmount amount={tier.amount} className="text-2xl" />
        </div>
        <TierStatusBadge progress={progress} threshold={escrow.threshold} />
      </div>

      {tier.winner && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Winner</span>
          <Address address={tier.winner} isYou={isMyPrize} />
        </div>
      )}

      {awaitingClaim && (
        <p className="text-sm text-muted-foreground">
          The winner can claim until {formatDate(escrow.claimDeadline)}. After that the organizer can refund it.
        </p>
      )}

      {progress.status === "unclaimed" && (
        <p className="text-sm text-muted-foreground">
          The claim window closed on {formatDate(escrow.claimDeadline)} without a claim.
        </p>
      )}

      {progress.status === "no-winner" && (
        <p className="text-sm text-muted-foreground">Voting closed without a winner.</p>
      )}

      {!tier.winner && votingOpen && (
        <div className="flex flex-col gap-2">
          <Progress
            value={(progress.leadingVotes / escrow.threshold) * 100}
            aria-label={`Leading candidate has ${progress.leadingVotes} of ${escrow.threshold} votes needed`}
          />
          {tallies.length === 0 && <p className="text-sm text-muted-foreground">No votes yet.</p>}
          {tallies.map((tally) => (
            <div key={tally.candidate} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <Address address={tally.candidate} isYou={tally.candidate === viewer} />
              <span className="tabular-nums text-muted-foreground">
                {tally.votes} {tally.votes === 1 ? "vote" : "votes"}
              </span>
            </div>
          ))}
        </div>
      )}

      {myVote && !tier.winner && (
        <p className="text-sm text-muted-foreground">
          You voted for <span className="font-mono">{truncateAddress(myVote.candidate)}</span>
        </p>
      )}

      {canVote && (
        <Button variant="outline" className="self-start" onClick={() => onVote(tierIndex)} disabled={voting}>
          {voting ? <Loader2 className="animate-spin" /> : <Vote />}
          {voting ? "Confirming..." : "Vote for a winner"}
        </Button>
      )}

      {canClaim && (
        <Button className="self-start" onClick={() => onClaim(tierIndex)} disabled={claiming}>
          {claiming && <Loader2 className="animate-spin" />}
          {claiming ? "Confirming..." : `Claim ${formatSol(tier.amount)}`}
        </Button>
      )}
    </Card>
  );
}
