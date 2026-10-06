// Escrow data as the frontend uses it, decoded from the on-chain Escrow account
// (programs/openbounty_v2/src/state/escrow.rs). Amounts are lamports and times are
// unix seconds, both as bigint.

import type { Address } from "@solana/kit";

// One judge's vote on a prize tier
export interface TierVote {
  judge: Address;
  candidate: Address;
}

// One prize. `winner` is set once a candidate reaches the vote threshold.
export interface PrizeTier {
  amount: bigint;
  winner: Address | null;
  claimed: boolean;
  refunded: boolean;
  votes: TierVote[];
}

export interface EscrowAccount {
  address: Address;              // the escrow account, used in /bounty/[address]
  organizer: Address;
  nonce: number;                 // lets one organizer run many bounties
  title: string;
  metadataUri: string;
  judges: Address[];
  threshold: number;             // votes needed to pick a winner
  tiers: PrizeTier[];
  createdAt: bigint;
  submissionsDeadline: bigint;   // entries close
  deadline: bigint;              // voting closes
  claimDeadline: bigint;         // winners claim until then
}
