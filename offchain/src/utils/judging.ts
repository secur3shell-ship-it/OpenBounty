// Judging board rules: which prizes a judge can still vote on, and entry ordering.

import type { Address } from "@solana/kit";
import type { EscrowAccount } from "@/types/escrow";
import type { Submission } from "@/types/submission";
import { Scorecard, scoreTotal } from "./scorecard";
import { isVotingOpen } from "./status";

// Same checks as the program's vote_winner: before the deadline, no winner yet,
// and this judge hasn't voted on the tier
export function canVoteOnTier(escrow: EscrowAccount, tierIndex: number, judge: Address): boolean {
  const tier = escrow.tiers[tierIndex];
  if (!isVotingOpen(escrow)) return false;
  if (tier.winner) return false;
  return !tier.votes.some((vote) => vote.judge === judge);
}

export function votableTiers(escrow: EscrowAccount, judge: Address): number[] {
  const tiers: number[] = [];
  escrow.tiers.forEach((_, index) => {
    if (canVoteOnTier(escrow, index, judge)) tiers.push(index);
  });
  return tiers;
}

export type EntrySort = "newest" | "score";

// "newest" keeps the given order; "score" puts your highest totals first, unscored last
export function sortEntries(submissions: Submission[], scorecard: Scorecard, sort: EntrySort): Submission[] {
  if (sort === "newest") return submissions;
  return [...submissions].sort((a, b) => {
    const totalA = scoreTotal(scorecard[a.id]) ?? -1;
    const totalB = scoreTotal(scorecard[b.id]) ?? -1;
    return totalB - totalA;
  });
}
