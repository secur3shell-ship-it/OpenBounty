import {
  getBase58Decoder,
  getBase64Encoder,
  getI64Encoder,
  type Address,
  type Base58EncodedBytes,
} from '@solana/kit';
import {
  ESCROW_DISCRIMINATOR,
  getEscrowDecoder,
  getSubmissionDecoder,
  OPENBOUNTY_V2_PROGRAM_ADDRESS,
  SUBMISSION_DISCRIMINATOR,
  type Escrow,
  type Submission,
} from '@/generated/openbounty';
import { client } from '@/lib/client';
import { findEscrowPda } from '@/lib/pda';

// Reads straight from the chain with getProgramAccounts; there is no backend.
// Each account type starts with its 8-byte discriminator. Both account types
// have a fixed size (strings and lists are allocated at their maximum).
const ESCROW_SIZE = 1870n;
const SUBMISSION_SIZE = 539n;
// The organizer (Escrow) and the escrow (Submission) sit right after the discriminator;
// a Submission then has its escrow's createdAt.
const FIRST_FIELD_OFFSET = 8n;
const SUBMISSION_CREATED_AT_OFFSET = 40n;
const SUBMISSION_SUBMITTER_OFFSET = 48n;

const base58 = getBase58Decoder();
const base64 = getBase64Encoder();

function memcmp(offset: bigint, bytes: string) {
  return { memcmp: { offset, bytes: bytes as Base58EncodedBytes, encoding: 'base58' as const } };
}

export type EscrowRow = { address: Address; data: Escrow };
export type SubmissionRow = { address: Address; data: Submission };

async function listEscrows(organizer?: Address): Promise<EscrowRow[]> {
  const filters = [
    { dataSize: ESCROW_SIZE },
    memcmp(0n, base58.decode(ESCROW_DISCRIMINATOR)),
    ...(organizer ? [memcmp(FIRST_FIELD_OFFSET, organizer)] : []),
  ];
  const rows = await client.rpc
    .getProgramAccounts(OPENBOUNTY_V2_PROGRAM_ADDRESS, { encoding: 'base64', filters })
    .send();
  const decoder = getEscrowDecoder();
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

/**
 * Every entry submitted to one bounty, oldest first. `escrowCreatedAt` keeps out
 * entries left from an earlier, closed bounty at the same address.
 */
export async function listSubmissions(escrow: Address, escrowCreatedAt: bigint): Promise<SubmissionRow[]> {
  const rows = await client.rpc
    .getProgramAccounts(OPENBOUNTY_V2_PROGRAM_ADDRESS, {
      encoding: 'base64',
      filters: [
        { dataSize: SUBMISSION_SIZE },
        memcmp(0n, base58.decode(SUBMISSION_DISCRIMINATOR)),
        memcmp(FIRST_FIELD_OFFSET, escrow),
        memcmp(SUBMISSION_CREATED_AT_OFFSET, base58.decode(getI64Encoder().encode(escrowCreatedAt))),
      ],
    })
    .send();
  const decoder = getSubmissionDecoder();
  return rows
    .map((row) => ({ address: row.pubkey, data: decoder.decode(base64.encode(row.account.data[0])) }))
    .sort((a, b) => Number(a.data.submittedAt - b.data.submittedAt));
}

/** Every entry one wallet has made, on any bounty (including closed ones), newest first. */
export async function listSubmissionsBySubmitter(submitter: Address): Promise<SubmissionRow[]> {
  const rows = await client.rpc
    .getProgramAccounts(OPENBOUNTY_V2_PROGRAM_ADDRESS, {
      encoding: 'base64',
      filters: [
        { dataSize: SUBMISSION_SIZE },
        memcmp(0n, base58.decode(SUBMISSION_DISCRIMINATOR)),
        memcmp(SUBMISSION_SUBMITTER_OFFSET, submitter),
      ],
    })
    .send();
  const decoder = getSubmissionDecoder();
  return rows
    .map((row) => ({ address: row.pubkey, data: decoder.decode(base64.encode(row.account.data[0])) }))
    .sort((a, b) => Number(b.data.submittedAt - a.data.submittedAt));
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
