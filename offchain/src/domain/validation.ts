import { isAddress, type Address } from '@solana/kit';
import { MIN_PRIZE_AMOUNT, type Escrow } from '@/generated/openbounty';
import {
  DEADLINE_SAFETY_MARGIN_SECONDS,
  MAX_DEADLINE_AHEAD_SECONDS,
  MAX_JUDGES,
  MAX_METADATA_URI_BYTES,
  MAX_PRIZE_TIERS,
  MAX_TITLE_BYTES,
  SYSTEM_PROGRAM_ADDRESS,
  U64_MAX,
} from './rules';
import { tierStatus, tierWinner } from './tier';

// Early checks that mirror the program's rules, so users see a clear message
// before signing. They never replace the program's own checks. "Qn" refers to
// the owner's decisions in doc/project_context.md §9.3.

export type Problem = { field: string; message: string };

const byteLength = (text: string) => new TextEncoder().encode(text).length;

/** The smallest allowed prize: the larger of MIN_PRIZE_AMOUNT and an empty account's rent. */
export function minimumPrize(rentMinimumEmpty: bigint): bigint {
  return MIN_PRIZE_AMOUNT > rentMinimumEmpty ? MIN_PRIZE_AMOUNT : rentMinimumEmpty;
}

export type CreateInput = {
  title: string;
  metadataUri: string;
  judges: string[];
  voteThreshold: number;
  prizeAmounts: bigint[];
  /** Unix seconds. */
  deadline: bigint;
};

export type CreateContext = {
  organizer: Address;
  /** Network time (see networkNow). */
  now: bigint;
  /** Rent for an empty account (getRentMinimum(0)). */
  rentMinimumEmpty: bigint;
};

/** Every problem with a new bounty's inputs. An empty list means it looks good. */
export function validateCreate(input: CreateInput, ctx: CreateContext): Problem[] {
  const problems: Problem[] = [];
  const add = (field: string, message: string) => problems.push({ field, message });

  const titleBytes = byteLength(input.title);
  if (titleBytes === 0 || titleBytes > MAX_TITLE_BYTES) {
    add('title', `Enter a title of 1 to ${MAX_TITLE_BYTES} bytes (now ${titleBytes}).`);
  }

  // Q8: the details link is optional, but can't be too long.
  if (byteLength(input.metadataUri) > MAX_METADATA_URI_BYTES) {
    add('metadataUri', `The details link can be at most ${MAX_METADATA_URI_BYTES} bytes.`);
  }

  const judges = input.judges.map((j) => j.trim());
  if (judges.length === 0 || judges.length > MAX_JUDGES) {
    add('judges', `Add between 1 and ${MAX_JUDGES} judges.`);
  }
  if (judges.some((j) => !isAddress(j))) add('judges', 'Every judge must be a valid Solana address.');
  if (new Set(judges).size !== judges.length) add('judges', 'Each judge can be listed only once.');
  if (judges.includes(ctx.organizer)) add('judges', "You can't judge your own bounty.");

  // Q6: votes needed must be a strict majority of the judges.
  const threshold = input.voteThreshold;
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > judges.length || threshold * 2 <= judges.length) {
    add('voteThreshold', 'Votes needed must be more than half of the judges (and no more than all of them).');
  }

  if (input.prizeAmounts.length === 0 || input.prizeAmounts.length > MAX_PRIZE_TIERS) {
    add('prizeAmounts', `Add between 1 and ${MAX_PRIZE_TIERS} prizes.`);
  }
  const floor = minimumPrize(ctx.rentMinimumEmpty);
  if (input.prizeAmounts.some((amount) => amount < floor)) {
    add('prizeAmounts', 'Each prize must be at least the minimum prize.');
  }
  if (input.prizeAmounts.reduce((sum, amount) => sum + amount, 0n) > U64_MAX) {
    add('prizeAmounts', 'The total prize pool is too large.');
  }

  // Q14: in the future (with a safety margin) and at most one year away.
  if (input.deadline <= ctx.now + DEADLINE_SAFETY_MARGIN_SECONDS) {
    add('deadline', 'The deadline must be at least 10 minutes in the future.');
  } else if (input.deadline > ctx.now + MAX_DEADLINE_AHEAD_SECONDS) {
    add('deadline', 'The deadline can be at most one year away.');
  }

  return problems;
}

export type VoteContext = {
  wallet: Address;
  escrowAddress: Address;
  vaultAddress: Address;
  tierIndex: number;
  candidate: string;
  now: bigint;
};

/** Why this wallet can't cast this vote, or null if it can. */
export function voteProblem(escrow: Escrow, ctx: VoteContext): string | null {
  if (ctx.wallet === escrow.organizer) return "Organizers can't vote on their own bounty.";
  if (!escrow.judges.includes(ctx.wallet)) return "Only this bounty's judges can vote.";
  if (ctx.now > escrow.deadline) return 'Voting closed at the deadline.'; // Q2
  const tier = escrow.prizeTiers[ctx.tierIndex];
  if (!tier) return "That prize doesn't exist.";
  if (tierStatus(tier) !== 'open') return 'This prize already has a winner.';
  if (tier.votes.some((vote) => vote.judge === ctx.wallet)) {
    return "You've already voted on this prize. Votes are final."; // Q1
  }
  const candidate = ctx.candidate.trim();
  const invalid = [escrow.organizer, ...escrow.judges, SYSTEM_PROGRAM_ADDRESS, ctx.escrowAddress, ctx.vaultAddress];
  if (!isAddress(candidate) || invalid.includes(candidate)) {
    return "That address can't be chosen as a winner."; // Q5 (winning several prizes is fine, Q4)
  }
  return null;
}

/** Why this wallet can't claim this prize, or null if it can. Winners can claim even after the deadline (Q3). */
export function claimProblem(escrow: Escrow, wallet: Address, tierIndex: number): string | null {
  const tier = escrow.prizeTiers[tierIndex];
  if (!tier) return "That prize doesn't exist.";
  const status = tierStatus(tier);
  if (status === 'open') return "This prize doesn't have a winner yet.";
  if (status === 'claimed') return 'This prize has already been claimed.';
  if (status === 'refunded') return 'This prize was refunded.';
  if (tierWinner(tier) !== wallet) return 'Only the winner of this prize can claim it.';
  return null;
}

/** Why this wallet can't refund this prize, or null if it can. */
export function refundProblem(escrow: Escrow, wallet: Address, tierIndex: number, now: bigint): string | null {
  if (wallet !== escrow.organizer) return "Only this bounty's organizer can do this.";
  if (now <= escrow.deadline) return 'Refunds open after the deadline.'; // Q9: strictly after
  const tier = escrow.prizeTiers[tierIndex];
  if (!tier) return "That prize doesn't exist.";
  // Q3: only prizes that never got a winner can be refunded.
  if (tierStatus(tier) !== 'open') return "This prize can't be refunded: it has a winner or is already settled.";
  return null;
}
