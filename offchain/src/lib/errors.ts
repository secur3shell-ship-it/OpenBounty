import { isSolanaError, SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM } from '@solana/kit';
import * as E from '@/generated/openbounty';

// Friendly text for every program error. The generated
// getOpenbountyV2ErrorMessage() returns a placeholder in production builds,
// so the app keeps its own messages. When the program adds an error,
// regenerate the client and add a line here (the test checks nothing is missing).
export const PROGRAM_ERROR_MESSAGES: Record<number, string> = {
  [E.OPENBOUNTY_V2_ERROR__INVALID_TITLE]: 'Enter a title of up to 50 bytes (some characters use more than one byte).',
  [E.OPENBOUNTY_V2_ERROR__INVALID_METADATA_URI]: 'The details link is too long (max 100 bytes).',
  [E.OPENBOUNTY_V2_ERROR__INVALID_JUDGE_COUNT]: 'Add between 1 and 5 judges.',
  [E.OPENBOUNTY_V2_ERROR__DUPLICATE_JUDGE]: 'Each judge can be listed only once.',
  [E.OPENBOUNTY_V2_ERROR__ORGANIZER_CANNOT_BE_JUDGE]: "You can't judge your own bounty.",
  [E.OPENBOUNTY_V2_ERROR__INVALID_VOTE_THRESHOLD]: 'Votes needed must be more than half of the judges.',
  [E.OPENBOUNTY_V2_ERROR__INVALID_PRIZE_TIER_COUNT]: 'Add between 1 and 4 prizes.',
  [E.OPENBOUNTY_V2_ERROR__INVALID_PRIZE_AMOUNT]: 'Each prize must be at least 0.001 SOL.',
  [E.OPENBOUNTY_V2_ERROR__PRIZE_POOL_OVERFLOW]: 'The total prize pool is too large.',
  [E.OPENBOUNTY_V2_ERROR__INVALID_DEADLINE]: 'The deadline must be in the future and at most one year away.',
  [E.OPENBOUNTY_V2_ERROR__INCORRECT_FUNDING]: 'Funding check failed. Nothing moved except the network fee. Try again.',
  [E.OPENBOUNTY_V2_ERROR__UNAUTHORIZED_ORGANIZER]: "Only this bounty's organizer can do this.",
  [E.OPENBOUNTY_V2_ERROR__UNAUTHORIZED_JUDGE]: "Only this bounty's judges can vote.",
  [E.OPENBOUNTY_V2_ERROR__ORGANIZER_CANNOT_VOTE]: "Organizers can't vote on their own bounty.",
  [E.OPENBOUNTY_V2_ERROR__NOT_WINNER]: 'Only the winner of this prize can claim it.',
  [E.OPENBOUNTY_V2_ERROR__INVALID_TIER]: "That prize doesn't exist.",
  [E.OPENBOUNTY_V2_ERROR__INVALID_CANDIDATE]: "That address can't be chosen as a winner.",
  [E.OPENBOUNTY_V2_ERROR__DUPLICATE_VOTE]: "You've already voted on this prize. Votes are final.",
  [E.OPENBOUNTY_V2_ERROR__TIER_ALREADY_FINALIZED]: 'This prize already has a winner.',
  [E.OPENBOUNTY_V2_ERROR__TIER_NOT_FINALIZED]: "This prize doesn't have a winner yet.",
  [E.OPENBOUNTY_V2_ERROR__PRIZE_ALREADY_CLAIMED]: 'This prize has already been claimed.',
  [E.OPENBOUNTY_V2_ERROR__DEADLINE_NOT_REACHED]: 'Refunds open after the deadline.',
  [E.OPENBOUNTY_V2_ERROR__REFUND_NOT_ELIGIBLE]: "This prize can't be refunded.",
  [E.OPENBOUNTY_V2_ERROR__ORGANIZER_MISMATCH]: 'Something went wrong building the transaction. Refresh and try again.',
  [E.OPENBOUNTY_V2_ERROR__ARITHMETIC_OVERFLOW]: 'Amount calculation failed. Check the amounts.',
  [E.OPENBOUNTY_V2_ERROR__NOT_IMPLEMENTED]: "This action isn't available yet.",
};

/** Our program's error code (e.g. 6017) inside a failed send or simulation, or null. */
export function programErrorCode(err: unknown): number | null {
  let e: unknown = err;
  for (let depth = 0; depth < 5 && e; depth++) {
    if (isSolanaError(e, SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM)) return Number(e.context.code);
    e = (e as { cause?: unknown }).cause;
  }
  return null;
}

/** A message that's safe and useful to show the user. */
export function describeError(err: unknown): string {
  const code = programErrorCode(err);
  if (code !== null) return PROGRAM_ERROR_MESSAGES[code] ?? `The program rejected this (error ${code}).`;
  return 'Something went wrong. Check your wallet and network, then try again.';
}
