import { isSome, unwrapOption, type Address } from '@solana/kit';
import type { PrizeTier } from '@/generated/openbounty';

export type TierStatus = 'open' | 'finalized' | 'claimed' | 'refunded';

/**
 * A prize tier's state, worked out from its fields:
 * refunded → claimed → finalized (has a winner) → open.
 * Throws on a combination the program never produces.
 */
export function tierStatus(tier: PrizeTier): TierStatus {
  if (tier.claimed && tier.refunded) {
    throw new Error('Corrupt prize tier: marked both claimed and refunded');
  }
  if (tier.refunded) return 'refunded';
  if (tier.claimed) return 'claimed';
  return isSome(tier.winner) ? 'finalized' : 'open';
}

/** A tier is settled once its money has left the vault. */
export function isSettled(tier: PrizeTier): boolean {
  const status = tierStatus(tier);
  return status === 'claimed' || status === 'refunded';
}

export function tierWinner(tier: PrizeTier): Address | null {
  return unwrapOption(tier.winner);
}

/** Votes per candidate on one tier. */
export function voteCounts(tier: PrizeTier): Map<Address, number> {
  const counts = new Map<Address, number>();
  for (const vote of tier.votes) {
    counts.set(vote.candidate, (counts.get(vote.candidate) ?? 0) + 1);
  }
  return counts;
}
