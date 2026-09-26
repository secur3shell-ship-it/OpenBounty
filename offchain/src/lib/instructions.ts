import type { Address } from '@solana/kit';
import type { Escrow } from '@/generated/openbounty';
import { client } from '@/lib/client';
import { findEscrowPda, findVaultPda } from '@/lib/pda';

// Builders for the program's four instructions, signed by the connected
// wallet. Each returns an instruction with .planTransaction() and
// .sendTransaction(). Always check the inputs (src/domain/validation.ts), show
// a review screen and simulate before calling .sendTransaction().
// Until an instruction is implemented on-chain it fails with error 6025.

export type CreateBountyInput = {
  nonce: number;
  title: string;
  metadataUri: string;
  judges: Address[];
  voteThreshold: number;
  prizeAmounts: bigint[];
  /** Unix seconds. */
  deadline: bigint;
};

/** Organizer: create a bounty and lock the whole prize pool. */
export async function buildCreateBounty(input: CreateBountyInput) {
  const organizer = client.identity.address;
  const [escrow] = await findEscrowPda(organizer, input.nonce);
  const [vault] = await findVaultPda(organizer, input.nonce);
  return client.openbountyV2.instructions.initializeEscrow({ organizer: client.identity, escrow, vault, ...input });
}

/** Judge: vote for a candidate on one prize tier. */
export function buildVote(escrow: Address, tierIndex: number, candidate: Address) {
  return client.openbountyV2.instructions.voteWinner({ judge: client.identity, escrow, tierIndex, candidate });
}

/** Winner: claim a finalized prize. */
export async function buildClaim(escrow: Address, data: Escrow, tierIndex: number) {
  const [vault] = await findVaultPda(data.organizer, data.nonce);
  return client.openbountyV2.instructions.claimPrize({
    winner: client.identity,
    escrow,
    vault,
    organizer: data.organizer,
    tierIndex,
  });
}

/** Organizer: take back a prize that never got a winner, after the deadline. */
export async function buildRefund(escrow: Address, data: Escrow, tierIndex: number) {
  const [vault] = await findVaultPda(data.organizer, data.nonce);
  return client.openbountyV2.instructions.refundUnclaimed({ organizer: client.identity, escrow, vault, tierIndex });
}
