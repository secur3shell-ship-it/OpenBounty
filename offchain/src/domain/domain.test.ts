import { address, none, some, type Address } from '@solana/kit';
import { describe, expect, it } from 'vitest';
import * as generated from '@/generated/openbounty';
import type { Escrow, PrizeTier } from '@/generated/openbounty';
import { PROGRAM_ERROR_MESSAGES } from '@/lib/errors';
import { findEscrowPda, findVaultPda } from '@/lib/pda';
import { rolesFor } from './roles';
import { tierStatus } from './tier';
import { claimProblem, minimumPrize, refundProblem, validateCreate, voteProblem } from './validation';

const ORGANIZER = address('4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi');
const JUDGE_A = address('Ad5NzuNtFGG5GfWkSA4fkF3yViQiefv96BeESSMURwqk');
const JUDGE_B = address('GmsZy79Gc9hrSWYBNtKjJzmJw5givGuQqfJMhXjFcJqL');
const JUDGE_C = address('Gvhdkgjg1yonAbdNJ92jFttaFJ9qEo71pwG73GbJ13Ps');
const CANDIDATE = address('FEsqZKiz8ts5YsLvedA9LphoAELEsvUug6UK1YaKMKcH');
const ESCROW = address('GxuY9ZpPSaaubY9f7qDz6hJvf4DmVvG9zdasoGSLhbg3');
const VAULT = address('H1RRTgFj7LLYpr8x8A52fhXVMfs3cBYmyUX1Y73bGh43');
const NOW = 1_800_000_000n;
const RENT_EMPTY = 650_240n;

function tier(overrides: Partial<PrizeTier> = {}): PrizeTier {
  return { amount: 1_000_000_000n, winner: none(), claimed: false, refunded: false, votes: [], ...overrides };
}

function escrow(overrides: Partial<Escrow> = {}): Escrow {
  return {
    discriminator: new Uint8Array(8),
    organizer: ORGANIZER,
    nonce: 0,
    bump: 255,
    vaultBump: 254,
    voteThreshold: 2,
    deadline: NOW + 3600n,
    title: 'Hack',
    metadataUri: '',
    judges: [JUDGE_A, JUDGE_B, JUDGE_C],
    prizeTiers: [tier()],
    ...overrides,
  };
}

describe('PDAs match the known test vectors (frontend_handoff.md §5.3)', () => {
  it.each([
    [0, 'GmsZy79Gc9hrSWYBNtKjJzmJw5givGuQqfJMhXjFcJqL', 'CBTjFe5a62c2kdaXLGTTu9rVMJsGYsJPgCBzmiYXFbmN'],
    [1, 'Gvhdkgjg1yonAbdNJ92jFttaFJ9qEo71pwG73GbJ13Ps', 'FEsqZKiz8ts5YsLvedA9LphoAELEsvUug6UK1YaKMKcH'],
    [255, 'GxuY9ZpPSaaubY9f7qDz6hJvf4DmVvG9zdasoGSLhbg3', 'H1RRTgFj7LLYpr8x8A52fhXVMfs3cBYmyUX1Y73bGh43'],
  ])('nonce %i', async (nonce, escrowAddress, vaultAddress) => {
    expect((await findEscrowPda(ORGANIZER, nonce))[0]).toBe(escrowAddress);
    expect((await findVaultPda(ORGANIZER, nonce))[0]).toBe(vaultAddress);
  });
});

describe('tierStatus', () => {
  it('follows refunded → claimed → finalized → open', () => {
    expect(tierStatus(tier())).toBe('open');
    expect(tierStatus(tier({ winner: some(CANDIDATE) }))).toBe('finalized');
    expect(tierStatus(tier({ winner: some(CANDIDATE), claimed: true }))).toBe('claimed');
    expect(tierStatus(tier({ refunded: true }))).toBe('refunded');
    expect(() => tierStatus(tier({ claimed: true, refunded: true }))).toThrow();
  });
});

describe('rolesFor', () => {
  it('derives roles from the bounty, per wallet', () => {
    const e = escrow({ prizeTiers: [tier({ winner: some(CANDIDATE) }), tier()] });
    expect(rolesFor(e, ORGANIZER)).toEqual({ isOrganizer: true, isJudge: false, wonTiers: [] });
    expect(rolesFor(e, JUDGE_A).isJudge).toBe(true);
    expect(rolesFor(e, CANDIDATE).wonTiers).toEqual([0]);
    expect(rolesFor(e, null).isOrganizer).toBe(false);
  });
});

describe('validateCreate', () => {
  const ctx = { organizer: ORGANIZER, now: NOW, rentMinimumEmpty: RENT_EMPTY };
  const good = {
    title: 'OpenBounty Hack',
    metadataUri: '',
    judges: [JUDGE_A, JUDGE_B, JUDGE_C] as string[],
    voteThreshold: 2,
    prizeAmounts: [2_000_000_000n, 1_000_000n],
    deadline: NOW + 7n * 24n * 3600n,
  };
  const fields = (input: typeof good) => validateCreate(input, ctx).map((p) => p.field);

  it('accepts valid input, with an empty details link (Q8)', () => {
    expect(validateCreate(good, ctx)).toEqual([]);
  });
  it('requires a strict majority threshold (Q6)', () => {
    expect(fields({ ...good, judges: [JUDGE_A, JUDGE_B], voteThreshold: 1 })).toContain('voteThreshold');
    expect(fields({ ...good, voteThreshold: 4 })).toContain('voteThreshold');
  });
  it('counts title bytes, not characters', () => {
    expect(fields({ ...good, title: '€'.repeat(17) })).toContain('title'); // 51 bytes
    expect(fields({ ...good, title: '' })).toContain('title');
  });
  it('rejects duplicate judges and the organizer as a judge', () => {
    expect(fields({ ...good, judges: [JUDGE_A, JUDGE_A, JUDGE_B] })).toContain('judges');
    expect(fields({ ...good, judges: [ORGANIZER, JUDGE_A, JUDGE_B] })).toContain('judges');
  });
  it('enforces the minimum prize (MIN_PRIZE_AMOUNT and the rent floor)', () => {
    expect(minimumPrize(RENT_EMPTY)).toBe(1_000_000n);
    expect(minimumPrize(2_000_000n)).toBe(2_000_000n);
    expect(fields({ ...good, prizeAmounts: [999_999n] })).toContain('prizeAmounts');
  });
  it('keeps the deadline in the future and within a year (Q14)', () => {
    expect(fields({ ...good, deadline: NOW + 60n })).toContain('deadline');
    expect(fields({ ...good, deadline: NOW + 400n * 24n * 3600n })).toContain('deadline');
  });
});

describe('vote, claim and refund checks', () => {
  const voteCtx = (overrides = {}) => ({
    wallet: JUDGE_A as Address,
    escrowAddress: ESCROW,
    vaultAddress: VAULT,
    tierIndex: 0,
    candidate: CANDIDATE as string,
    now: NOW,
    ...overrides,
  });

  it('lets a judge vote for a valid candidate', () => {
    expect(voteProblem(escrow(), voteCtx())).toBeNull();
  });
  it('blocks the organizer, non-judges, late votes and second votes (Q1, Q2)', () => {
    expect(voteProblem(escrow(), voteCtx({ wallet: ORGANIZER }))).not.toBeNull();
    expect(voteProblem(escrow(), voteCtx({ wallet: CANDIDATE }))).not.toBeNull();
    expect(voteProblem(escrow(), voteCtx({ now: NOW + 3601n }))).toMatch(/closed/);
    const voted = escrow({ prizeTiers: [tier({ votes: [{ judge: JUDGE_A, candidate: CANDIDATE }] })] });
    expect(voteProblem(voted, voteCtx())).toMatch(/final/);
  });
  it('rejects invalid candidates (Q5)', () => {
    for (const bad of [ORGANIZER, JUDGE_B, ESCROW, VAULT, '11111111111111111111111111111111', 'not-an-address']) {
      expect(voteProblem(escrow(), voteCtx({ candidate: bad }))).not.toBeNull();
    }
  });
  it('lets only the winner claim, even after the deadline (Q3)', () => {
    const won = escrow({ deadline: NOW - 10n, prizeTiers: [tier({ winner: some(CANDIDATE) })] });
    expect(claimProblem(won, CANDIDATE, 0)).toBeNull();
    expect(claimProblem(won, JUDGE_A, 0)).not.toBeNull();
  });
  it('refunds only undecided prizes, strictly after the deadline (Q3, Q9)', () => {
    const past = escrow({ deadline: NOW - 1n });
    expect(refundProblem(past, ORGANIZER, 0, NOW)).toBeNull();
    expect(refundProblem(escrow({ deadline: NOW }), ORGANIZER, 0, NOW)).not.toBeNull();
    const decided = escrow({ deadline: NOW - 1n, prizeTiers: [tier({ winner: some(CANDIDATE) })] });
    expect(refundProblem(decided, ORGANIZER, 0, NOW)).not.toBeNull();
  });
});

describe('error messages', () => {
  it('has friendly text for every program error in the generated client', () => {
    const codes = Object.entries(generated)
      .filter(([name]) => name.startsWith('OPENBOUNTY_V2_ERROR__'))
      .map(([, code]) => code as number);
    expect(codes.length).toBeGreaterThan(0);
    for (const code of codes) expect(PROGRAM_ERROR_MESSAGES[code], `error ${code}`).toBeTruthy();
  });
});
