import { getAddressEncoder, getProgramDerivedAddress, type Address } from '@solana/kit';
import { ESCROW_SEED, OPENBOUNTY_V2_PROGRAM_ADDRESS, VAULT_SEED } from '@/generated/openbounty';

// The escrow and vault addresses come from (organizer, nonce). The generated
// client doesn't work these out, so they're derived here.

const addressEncoder = getAddressEncoder();

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
