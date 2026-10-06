// What the connected wallet needs to do across all bounties, for the "Your bounties" page.

import type { Address } from "@solana/kit";
import type { EscrowAccount } from "@/types/escrow";
import { isClaimWindowOpen, isVotingOpen, refundableTiers } from "./status";

export interface TierTask {
  escrow: EscrowAccount;
  tierIndex: number;
}

export interface ViewerTasks {
  toVote: TierTask[];           // you judge, voting is open, no winner yet, you haven't voted
  toClaim: TierTask[];          // you won, haven't claimed, and the claim window is open
  toRefund: EscrowAccount[];    // you organize and at least one prize is refundable now
  organizing: EscrowAccount[];
  judging: EscrowAccount[];
}

export function getViewerTasks(escrows: EscrowAccount[], viewer: Address): ViewerTasks {
  const tasks: ViewerTasks = { toVote: [], toClaim: [], toRefund: [], organizing: [], judging: [] };

  for (const escrow of escrows) {
    const isOrganizer = escrow.organizer === viewer;
    const isJudge = escrow.judges.includes(viewer);

    if (isOrganizer) tasks.organizing.push(escrow);
    if (isJudge) tasks.judging.push(escrow);
    if (isOrganizer && refundableTiers(escrow).length > 0) tasks.toRefund.push(escrow);

    escrow.tiers.forEach((tier, tierIndex) => {
      const hasVoted = tier.votes.some((vote) => vote.judge === viewer);
      const canClaim = tier.winner === viewer && !tier.claimed && !tier.refunded;

      if (isJudge && isVotingOpen(escrow) && !tier.winner && !hasVoted) tasks.toVote.push({ escrow, tierIndex });
      if (canClaim && isClaimWindowOpen(escrow)) tasks.toClaim.push({ escrow, tierIndex });
    });
  }

  return tasks;
}
