import { getBase64Encoder, type Address, type Base58EncodedBytes } from '@solana/kit';
import { getEscrowDecoder, OPENBOUNTY_V2_PROGRAM_ADDRESS, type Escrow } from '@/generated/openbounty';
import { client } from '@/lib/client';
import { findEscrowPda } from '@/lib/pda';

// Every bounty account is exactly this size, and starts with this 8-byte type
// marker (base58). The organizer's address sits at byte 8.
const ESCROW_SIZE = 1846n;
const ESCROW_DISCRIMINATOR_BASE58 = '6Kq5Q7N59ES' as Base58EncodedBytes;
const ORGANIZER_OFFSET = 8n;

export type EscrowRow = { address: Address; data: Escrow };

async function listEscrows(organizer?: Address): Promise<EscrowRow[]> {
  const filters = [
    { dataSize: ESCROW_SIZE },
    { memcmp: { offset: 0n, bytes: ESCROW_DISCRIMINATOR_BASE58, encoding: 'base58' as const } },
    ...(organizer
      ? [{ memcmp: { offset: ORGANIZER_OFFSET, bytes: organizer as unknown as Base58EncodedBytes, encoding: 'base58' as const } }]
      : []),
  ];
  const rows = await client.rpc
    .getProgramAccounts(OPENBOUNTY_V2_PROGRAM_ADDRESS, { encoding: 'base64', filters })
    .send();
  const decoder = getEscrowDecoder();
  const base64 = getBase64Encoder();
  return rows.map((row) => ({ address: row.pubkey, data: decoder.decode(base64.encode(row.account.data[0])) }));
}

/** Every bounty on the network. Judges and winners can't be filtered on-chain, so filter these in the browser. */
export function listAllEscrows(): Promise<EscrowRow[]> {
  return listEscrows();
}

/** Bounties created by one organizer. */
export function listEscrowsByOrganizer(organizer: Address): Promise<EscrowRow[]> {
  return listEscrows(organizer);
}

/** One bounty, or null if the account doesn't exist (never created, or closed after settling). */
export async function fetchEscrowOrNull(address: Address): Promise<EscrowRow | null> {
  const [account] = await client.openbountyV2.accounts.escrow.fetchAllMaybe([address]);
  return account.exists ? { address, data: account.data } : null;
}

/** The lowest nonce (0-255) this organizer hasn't used yet, or null if all 256 are taken. */
export async function findFreeNonce(organizer: Address): Promise<number | null> {
  for (let start = 0; start < 256; start += 100) {
    const nonces = Array.from({ length: Math.min(100, 256 - start) }, (_, i) => start + i);
    const addresses = await Promise.all(nonces.map(async (nonce) => (await findEscrowPda(organizer, nonce))[0]));
    const accounts = await client.openbountyV2.accounts.escrow.fetchAllMaybe(addresses);
    const free = accounts.findIndex((account) => !account.exists);
    if (free !== -1) return nonces[free];
  }
  return null;
}
