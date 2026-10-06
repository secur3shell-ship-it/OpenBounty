// Rules and helpers for bounty entries: who may submit, validation, and how the
// on-chain votes (which point at wallet addresses) map onto entries.

import type { Address } from "@solana/kit";
import type { EscrowAccount, PrizeTier } from "@/types/escrow";
import type { Submission } from "@/types/submission";
import {
  MAX_SUBMISSION_DESCRIPTION,
  MAX_SUBMISSION_TITLE,
  MAX_SUBMISSION_URL,
} from "@/constants/submissions";
import { getCandidateTallies, isEntriesOpen } from "./status";
import { truncateAddress } from "./format";
import { byteLength, safeDetailsUrl } from "./address";

// Why a wallet can't submit an entry right now (null = it can). Mirrors submit_entry.
export type SubmitBlock = "not-connected" | "closed" | "organizer" | "judge" | "already-submitted";

export const SUBMIT_BLOCK_TEXT: Record<SubmitBlock, string> = {
  "not-connected": "Connect your wallet to submit an entry.",
  "closed": "Entries for this bounty have closed.",
  "organizer": "Organizers can't enter their own bounty.",
  "judge": "Judges can't enter a bounty they judge.",
  "already-submitted": "You've already submitted an entry.",
};

export function getSubmitBlock(
  escrow: EscrowAccount,
  viewer: Address | null,
  submissions: Submission[]
): SubmitBlock | null {
  if (!viewer) return "not-connected";
  if (!isEntriesOpen(escrow)) return "closed";
  if (escrow.organizer === viewer) return "organizer";
  if (escrow.judges.includes(viewer)) return "judge";
  if (submissions.some((s) => s.submitter === viewer)) return "already-submitted";
  return null;
}

// The entry behind a vote candidate, if that wallet submitted one
export function findSubmission(submissions: Submission[], candidate: Address): Submission | undefined {
  return submissions.find((s) => s.submitter === candidate);
}

// Votes an entry has on each tier: [2, 0] = 2 votes for 1st prize, none for 2nd
export function votesPerTier(escrow: EscrowAccount, submitter: Address): number[] {
  return escrow.tiers.map((tier) => tier.votes.filter((vote) => vote.candidate === submitter).length);
}

// Tier indexes this entry won
export function wonTiers(escrow: EscrowAccount, submitter: Address): number[] {
  const won: number[] = [];
  escrow.tiers.forEach((tier, index) => {
    if (tier.winner === submitter) won.push(index);
  });
  return won;
}

// Who a judge can vote for on one tier: every entry (named by its title), plus any
// wallet that already has votes without an entry. Most votes first.
export interface VoteCandidate {
  address: Address;
  label: string;
  votes: number;
}

export function getVoteCandidates(tier: PrizeTier, submissions: Submission[]): VoteCandidate[] {
  const candidates: VoteCandidate[] = submissions.map((s) => ({
    address: s.submitter,
    label: s.title,
    votes: tier.votes.filter((vote) => vote.candidate === s.submitter).length,
  }));

  for (const tally of getCandidateTallies(tier)) {
    if (!candidates.some((c) => c.address === tally.candidate)) {
      candidates.push({ address: tally.candidate, label: truncateAddress(tally.candidate), votes: tally.votes });
    }
  }
  return candidates.sort((a, b) => b.votes - a.votes);
}

export interface SubmissionValues {
  title: string;
  url: string;
  description: string;
}

export type SubmissionErrors = Partial<Record<keyof SubmissionValues, string>>;

// Same limits as submit_entry, counted in bytes like the program does
export function validateSubmission(values: SubmissionValues): SubmissionErrors {
  const errors: SubmissionErrors = {};
  const title = values.title.trim();
  if (!title) errors.title = "Give your entry a name.";
  else if (byteLength(title) > MAX_SUBMISSION_TITLE) errors.title = `Keep the name under ${MAX_SUBMISSION_TITLE} characters.`;

  const url = values.url.trim();
  if (!safeDetailsUrl(url)) errors.url = "Add a link starting with https:// (or ipfs://).";
  else if (byteLength(url) > MAX_SUBMISSION_URL) errors.url = `Keep the link under ${MAX_SUBMISSION_URL} characters.`;

  if (byteLength(values.description.trim()) > MAX_SUBMISSION_DESCRIPTION) {
    errors.description = `Keep the description under ${MAX_SUBMISSION_DESCRIPTION} characters.`;
  }
  return errors;
}
