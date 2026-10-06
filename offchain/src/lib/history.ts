import { getBase64Encoder, type Address, type Signature } from '@solana/kit';
import { getPrizeClaimedEventDecoder, PRIZE_CLAIMED_EVENT_DISCRIMINATOR } from '@/generated/openbounty';
import { client } from '@/lib/client';

// Reads a bounty's past transactions straight from the RPC (no indexer): the
// program's Anchor events are in each transaction's logs as "Program data: <base64>".

const EVENT_PREFIX = 'Program data: ';
const MAX_SIGNATURES = 100;
const base64 = getBase64Encoder();

function isPrizeClaimed(bytes: Uint8Array): boolean {
  return PRIZE_CLAIMED_EVENT_DISCRIMINATOR.every((byte, i) => bytes[i] === byte);
}

/**
 * The transaction that claimed each prize of a bounty, as tierIndex -> signature.
 * `since` (the escrow's createdAt) skips transactions of an earlier bounty that
 * used the same address. Stops as soon as every wanted tier is found.
 */
export async function findClaimSignatures(
  escrow: Address,
  since: bigint,
  wantedTiers: number[],
): Promise<Map<number, Signature>> {
  const found = new Map<number, Signature>();
  if (wantedTiers.length === 0) return found;

  const signatures = await client.rpc.getSignaturesForAddress(escrow, { limit: MAX_SIGNATURES }).send();
  const candidates = signatures.filter((s) => s.err === null && (s.blockTime === null || s.blockTime >= since));

  for (const { signature } of candidates) {
    const tx = await client.rpc
      .getTransaction(signature, { encoding: 'json', maxSupportedTransactionVersion: 0, commitment: 'confirmed' })
      .send();
    for (const line of tx?.meta?.logMessages ?? []) {
      if (!line.startsWith(EVENT_PREFIX)) continue;
      const bytes = base64.encode(line.slice(EVENT_PREFIX.length)) as Uint8Array;
      if (!isPrizeClaimed(bytes)) continue;
      const event = getPrizeClaimedEventDecoder().decode(bytes);
      if (event.escrow === escrow && wantedTiers.includes(event.tierIndex)) found.set(event.tierIndex, signature);
    }
    if (wantedTiers.every((tier) => found.has(tier))) break;
  }
  return found;
}
