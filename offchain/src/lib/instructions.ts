import type { Address } from '@solana/kit';
import type { Escrow } from '@/generated/openbounty';
import { client } from '@/lib/client';
import { findEscrowPda, findSubmissionPda, findVaultPda } from '@/lib/pda';

// Builders for the program's instructions, signed by the connected wallet.
// Each returns an instruction; send one with .sendTransaction(), or several in
// one transaction with client.sendTransaction([...]). Check the inputs first
// (src/domain/validation.ts); the program has the final say.

export type CreateBountyInput = {
  nonce: number;
  title: string;
  metadataUri: string;
  judges: Address[];
  voteThreshold: number;
  prizeAmounts: bigint[];
  /** Unix seconds: entries close. */
  submissionsDeadline: bigint;
  /** Unix seconds: voting closes. */
  deadline: bigint;
  /** Seconds after the deadline during which winners can claim. */
  claimWindow: bigint;
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

/** Winner: claim a finalized prize, until the claim window closes. */
export async function buildClaim(escrow: Address, data: Pick<Escrow, 'organizer' | 'nonce'>, tierIndex: number) {
  const [vault] = await findVaultPda(data.organizer, data.nonce);
  return client.openbountyV2.instructions.claimPrize({
    winner: client.identity,
    escrow,
    vault,
    organizer: data.organizer,
    tierIndex,
  });
}

/** Organizer: take back an undecided prize (after the deadline) or an unclaimed one (after the claim window). */
export async function buildRefund(escrow: Address, data: Pick<Escrow, 'organizer' | 'nonce'>, tierIndex: number) {
  const [vault] = await findVaultPda(data.organizer, data.nonce);
  return client.openbountyV2.instructions.refundUnclaimed({ organizer: client.identity, escrow, vault, tierIndex });
}

/** Builder: enter a bounty before entries close. */
export async function buildSubmitEntry(
  escrow: Address,
  escrowCreatedAt: bigint,
  title: string,
  url: string,
  description: string,
) {
  const [submission] = await findSubmissionPda(escrow, escrowCreatedAt, client.identity.address);
  return client.openbountyV2.instructions.submitEntry({
    submitter: client.identity,
    escrow,
    submission,
    title,
    url,
    description,
  });
}

/** Builder: close an entry after the deadline and get its rent back. */
export async function buildCloseEntry(escrow: Address, escrowCreatedAt: bigint) {
  const [submission] = await findSubmissionPda(escrow, escrowCreatedAt, client.identity.address);
  return client.openbountyV2.instructions.closeEntry({ submitter: client.identity, submission });
}
