import type { Address } from '@solana/kit';
import type { Escrow } from '@/generated/openbounty';
import { tierWinner } from './tier';

export type Roles = {
  isOrganizer: boolean;
  isJudge: boolean;
  /** Indexes of the tiers this wallet won. */
  wonTiers: number[];
};

/**
 * What a wallet can do in one bounty. Roles are never stored anywhere; they
 * come from the bounty's own data, so they can differ from bounty to bounty.
 */
export function rolesFor(escrow: Escrow, wallet: Address | null): Roles {
  if (!wallet) return { isOrganizer: false, isJudge: false, wonTiers: [] };
  return {
    isOrganizer: escrow.organizer === wallet,
    isJudge: escrow.judges.includes(wallet),
    wonTiers: escrow.prizeTiers.flatMap((tier, index) => (tierWinner(tier) === wallet ? [index] : [])),
  };
}
