// Status names users see (see .claude/skills/openbounty-ui/SKILL.md, "Status names").
//
// A bounty moves through four phases, set by its three dates:
//   Open (entries open) -> Judging (entries closed, judges vote) -> Ended (voting
//   closed, winners claim) -> claim window over (unclaimed prizes refundable).
// "Ending soon" is Open with under 24 hours until entries close.

import type { Address } from "@solana/kit";
import type { EscrowAccount, PrizeTier } from "@/types/escrow";

export type BountyStatus = "open" | "ending-soon" | "judging" | "ended";

const ENDING_SOON_SECONDS = 24 * 60 * 60;

export function nowSeconds(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

export function getBountyStatus(escrow: EscrowAccount): BountyStatus {
  const now = nowSeconds();
  if (now > escrow.deadline) return "ended";
  if (now > escrow.submissionsDeadline) return "judging";
  if (escrow.submissionsDeadline - now < ENDING_SOON_SECONDS) return "ending-soon";
  return "open";
}

export function isVotingOpen(escrow: EscrowAccount): boolean {
  return nowSeconds() <= escrow.deadline;
}

export function isEntriesOpen(escrow: EscrowAccount): boolean {
  return nowSeconds() <= escrow.submissionsDeadline;
}

export function isClaimWindowOpen(escrow: EscrowAccount): boolean {
  return nowSeconds() <= escrow.claimDeadline;
}

// Tier: Awaiting votes -> Voting (x of threshold) -> Winner picked -> Claimed.
// After the deadline an undecided tier is "No winner"; after the claim window an
// unclaimed winner's tier is "Unclaimed". Either can then be "Refunded".
export type TierStatus = "awaiting" | "voting" | "winner" | "claimed" | "no-winner" | "unclaimed" | "refunded";

export interface TierProgress {
  status: TierStatus;
  leadingVotes: number; // votes of the candidate with the most votes
}

export function getTierProgress(escrow: EscrowAccount, tier: PrizeTier): TierProgress {
  const tallies = getCandidateTallies(tier);
  const leadingVotes = tallies.length > 0 ? tallies[0].votes : 0;

  if (tier.claimed) return { status: "claimed", leadingVotes };
  if (tier.refunded) return { status: "refunded", leadingVotes };
  if (tier.winner) {
    return { status: isClaimWindowOpen(escrow) ? "winner" : "unclaimed", leadingVotes };
  }
  if (!isVotingOpen(escrow)) return { status: "no-winner", leadingVotes };
  if (tier.votes.length === 0) return { status: "awaiting", leadingVotes };
  return { status: "voting", leadingVotes };
}

// Tiers the organizer can refund right now: never decided (after the deadline), or
// won but not claimed (after the claim window). Mirrors refund_unclaimed.
export function refundableTiers(escrow: EscrowAccount): number[] {
  const now = nowSeconds();
  const tiers: number[] = [];
  escrow.tiers.forEach((tier, index) => {
    if (tier.claimed || tier.refunded || now <= escrow.deadline) return;
    if (tier.winner && now <= escrow.claimDeadline) return;
    tiers.push(index);
  });
  return tiers;
}

// Tiers that will become refundable once the claim window closes
export function pendingWinnerTiers(escrow: EscrowAccount): number[] {
  return escrow.tiers.flatMap((tier, index) =>
    tier.winner && !tier.claimed && !tier.refunded ? [index] : []
  );
}

// How many tiers already have a winner (claimed or not)
export function countDecidedTiers(tiers: PrizeTier[]): number {
  return tiers.filter((tier) => tier.winner !== null).length;
}

// Votes per candidate on one tier, most votes first
export interface CandidateTally {
  candidate: Address;
  votes: number;
}

export function getCandidateTallies(tier: PrizeTier): CandidateTally[] {
  const tallies: CandidateTally[] = [];
  for (const vote of tier.votes) {
    const existing = tallies.find((tally) => tally.candidate === vote.candidate);
    if (existing) existing.votes += 1;
    else tallies.push({ candidate: vote.candidate, votes: 1 });
  }
  return tallies.sort((a, b) => b.votes - a.votes);
}
