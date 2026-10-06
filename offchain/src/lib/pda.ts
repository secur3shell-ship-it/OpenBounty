import { getAddressEncoder, getI64Encoder, getProgramDerivedAddress, type Address } from '@solana/kit';
import { ESCROW_SEED, OPENBOUNTY_V2_PROGRAM_ADDRESS, SUBMISSION_SEED, VAULT_SEED } from '@/generated/openbounty';

// The escrow and vault addresses come from (organizer, nonce), and an entry's
// from (escrow, submitter). They're derived here so every caller uses the same seeds.

const addressEncoder = getAddressEncoder();
const i64Encoder = getI64Encoder();

function nonceSeed(nonce: number): Uint8Array {
  if (!Number.isInteger(nonce) || nonce < 0 || nonce > 255) {
    throw new RangeError(`nonce must be 0-255, got ${nonce}`);
  }
  return new Uint8Array([nonce]);
}

/** Escrow PDA: ["escrow", organizer, nonce]. Resolves to [address, bump]. */
export function findEscrowPda(organizer: Address, nonce: number, programAddress: Address = OPENBOUNTY_V2_PROGRAM_ADDRESS) {
  return getProgramDerivedAddress({ programAddress, seeds: [ESCROW_SEED, addressEncoder.encode(organizer), nonceSeed(nonce)] });
}

/** Vault PDA: ["vault", organizer, nonce]. Resolves to [address, bump]. */
export function findVaultPda(organizer: Address, nonce: number, programAddress: Address = OPENBOUNTY_V2_PROGRAM_ADDRESS) {
  return getProgramDerivedAddress({ programAddress, seeds: [VAULT_SEED, addressEncoder.encode(organizer), nonceSeed(nonce)] });
}

/**
 * Submission PDA: ["submission", escrow, escrow.createdAt (i64 LE), submitter]. Resolves to
 * [address, bump]. createdAt is in the seeds because a closed bounty's address can be reused.
 */
export function findSubmissionPda(
  escrow: Address,
  escrowCreatedAt: bigint,
  submitter: Address,
  programAddress: Address = OPENBOUNTY_V2_PROGRAM_ADDRESS,
) {
  return getProgramDerivedAddress({
    programAddress,
    seeds: [SUBMISSION_SEED, addressEncoder.encode(escrow), i64Encoder.encode(escrowCreatedAt), addressEncoder.encode(submitter)],
  });
}
