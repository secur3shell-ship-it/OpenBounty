import { web3 } from "@anchor-lang/core";

// Mirrors the seeds in programs/openbounty_v2/src/constants.rs.
const ESCROW_SEED = Buffer.from("escrow");
const VAULT_SEED = Buffer.from("vault");
const SUBMISSION_SEED = Buffer.from("submission");

function nonceSeed(nonce: number): Buffer {
  if (!Number.isInteger(nonce) || nonce < 0 || nonce > 255) {
    throw new RangeError(`nonce must be a u8, got ${nonce}`);
  }
  return Buffer.from([nonce]);
}

/** Escrow PDA: `["escrow", organizer, nonce]`. */
export function findEscrowPda(
  programId: web3.PublicKey,
  organizer: web3.PublicKey,
  nonce: number
): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [ESCROW_SEED, organizer.toBuffer(), nonceSeed(nonce)],
    programId
  );
}

/** Vault PDA: `["vault", organizer, nonce]`. */
export function findVaultPda(
  programId: web3.PublicKey,
  organizer: web3.PublicKey,
  nonce: number
): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [VAULT_SEED, organizer.toBuffer(), nonceSeed(nonce)],
    programId
  );
}

/** Submission PDA: `["submission", escrow, escrow.created_at (i64 LE), submitter]`. */
export function findSubmissionPda(
  programId: web3.PublicKey,
  escrow: web3.PublicKey,
  escrowCreatedAt: number,
  submitter: web3.PublicKey
): [web3.PublicKey, number] {
  const createdAt = Buffer.alloc(8);
  createdAt.writeBigInt64LE(BigInt(escrowCreatedAt));
  return web3.PublicKey.findProgramAddressSync(
    [SUBMISSION_SEED, escrow.toBuffer(), createdAt, submitter.toBuffer()],
    programId
  );
}
