// The create-bounty form's values, its validation, and the transaction that creates
// the bounty and locks the prize pool. validateForm gives instant feedback; the final
// check (network time, rent) runs in createBounty, and the program has the last word.

import { useState } from "react";
import type { Address } from "@solana/kit";
import { client } from "@/lib/client";
import { buildCreateBounty } from "@/lib/instructions";
import { findFreeNonce } from "@/lib/queries";
import { findEscrowPda } from "@/lib/pda";
import { getRentMinimum, networkNow } from "@/lib/chain";
import { validateCreate } from "@/domain/validation";
import { UserFacingError } from "@/lib/errors";
import {
  DEFAULT_CLAIM_WINDOW_DAYS,
  MAX_CLAIM_WINDOW_DAYS,
  MAX_JUDGES,
  MAX_METADATA_URI_BYTES,
  MAX_TIERS,
  MAX_TITLE_BYTES,
  MIN_CLAIM_WINDOW_DAYS,
  MIN_PRIZE_LAMPORTS,
} from "@/constants/program";
import { byteLength, parseAddress } from "@/utils/address";
import { formatSol, toLamports } from "@/utils/format";

export interface CreateBountyValues {
  title: string;
  metadataUri: string;
  judges: string[];            // blank rows already removed
  threshold: number;
  tierAmounts: string[];       // SOL as typed, blank rows already removed
  submissionsDeadline: string; // datetime-local
  deadline: string;            // datetime-local
  claimWindowDays: string;
}

export type CreateBountyErrors = Partial<Record<keyof CreateBountyValues, string>>;

export interface CreatedBounty {
  signature: string;
  address: Address;
}

export const DEFAULT_CLAIM_WINDOW_TEXT = String(DEFAULT_CLAIM_WINDOW_DAYS);

const MIN_LEAD_MS = 10 * 60 * 1000; // a deadline at least 10 minutes away
const MAX_AHEAD_MS = 365 * 24 * 60 * 60 * 1000;

function toUnixSeconds(local: string): bigint | null {
  const ms = new Date(local).getTime();
  return Number.isNaN(ms) ? null : BigInt(Math.floor(ms / 1000));
}

export function validateForm(values: CreateBountyValues, organizer: Address | null): CreateBountyErrors {
  const errors: CreateBountyErrors = {};
  const now = Date.now();

  const titleBytes = byteLength(values.title.trim());
  if (titleBytes === 0) errors.title = "Give the bounty a title.";
  else if (titleBytes > MAX_TITLE_BYTES) errors.title = `Keep the title under ${MAX_TITLE_BYTES} characters.`;

  if (byteLength(values.metadataUri.trim()) > MAX_METADATA_URI_BYTES) {
    errors.metadataUri = `Keep the link under ${MAX_METADATA_URI_BYTES} characters.`;
  }

  const judges = values.judges.map((j) => j.trim());
  if (judges.length === 0) errors.judges = "Add at least one judge.";
  else if (judges.length > MAX_JUDGES) errors.judges = `Add at most ${MAX_JUDGES} judges.`;
  else if (judges.some((j) => !parseAddress(j))) errors.judges = "Every judge must be a valid Solana address.";
  else if (new Set(judges).size !== judges.length) errors.judges = "Each judge can be listed only once.";
  else if (organizer && judges.includes(organizer)) errors.judges = "You can't judge your own bounty.";

  const n = judges.length;
  if (n > 0 && (values.threshold > n || values.threshold * 2 <= n)) {
    errors.threshold = `Must be more than half of the judges: ${Math.floor(n / 2) + 1} to ${n}.`;
  }

  if (values.tierAmounts.length === 0) errors.tierAmounts = "Add at least one prize.";
  else if (values.tierAmounts.length > MAX_TIERS) errors.tierAmounts = `Add at most ${MAX_TIERS} prizes.`;
  else {
    const amounts = values.tierAmounts.map(toLamports);
    if (amounts.some((a) => a === null)) errors.tierAmounts = "Enter each prize as a SOL amount, like 2.5.";
    else if (amounts.some((a) => a! < MIN_PRIZE_LAMPORTS)) errors.tierAmounts = `Each prize must be at least ${formatSol(MIN_PRIZE_LAMPORTS)}.`;
  }

  const entriesMs = new Date(values.submissionsDeadline).getTime();
  const deadlineMs = new Date(values.deadline).getTime();
  if (!values.deadline || Number.isNaN(deadlineMs)) errors.deadline = "Pick when judging ends.";
  else if (deadlineMs < now + MIN_LEAD_MS) errors.deadline = "Judging must end at least 10 minutes from now.";
  else if (deadlineMs > now + MAX_AHEAD_MS) errors.deadline = "Judging can end at most one year from now.";

  if (!values.submissionsDeadline || Number.isNaN(entriesMs)) errors.submissionsDeadline = "Pick when entries close.";
  else if (entriesMs < now + MIN_LEAD_MS) errors.submissionsDeadline = "Entries must close at least 10 minutes from now.";
  else if (!Number.isNaN(deadlineMs) && entriesMs > deadlineMs) errors.submissionsDeadline = "Entries must close before (or when) judging ends.";

  const days = Number(values.claimWindowDays);
  if (!Number.isInteger(days) || days < MIN_CLAIM_WINDOW_DAYS || days > MAX_CLAIM_WINDOW_DAYS) {
    errors.claimWindowDays = `Pick ${MIN_CLAIM_WINDOW_DAYS} to ${MAX_CLAIM_WINDOW_DAYS} days.`;
  }

  return errors;
}

export function hasErrors(errors: CreateBountyErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function useCreateBounty() {
  const [submitting, setSubmitting] = useState(false);

  async function createBounty(values: CreateBountyValues): Promise<CreatedBounty> {
    setSubmitting(true);
    try {
      const organizer = client.identity.address;
      const input = {
        title: values.title.trim(),
        metadataUri: values.metadataUri.trim(),
        judges: values.judges.map((j) => parseAddress(j)!) as Address[],
        voteThreshold: values.threshold,
        prizeAmounts: values.tierAmounts.map((a) => toLamports(a)!),
        submissionsDeadline: toUnixSeconds(values.submissionsDeadline)!,
        deadline: toUnixSeconds(values.deadline)!,
        claimWindow: BigInt(Number(values.claimWindowDays) * 24 * 60 * 60),
      };

      // Final check against network time and the live rent minimum
      const [now, rentMinimumEmpty, nonce] = await Promise.all([
        networkNow(),
        getRentMinimum(0),
        findFreeNonce(organizer),
      ]);
      const problems = validateCreate(input, { organizer, now, rentMinimumEmpty });
      if (problems.length > 0) throw new UserFacingError(problems[0].message);
      if (nonce === null) throw new UserFacingError("You've used all 256 bounty slots for this wallet.");

      const ix = await buildCreateBounty({ ...input, nonce });
      const result = await ix.sendTransaction();
      const [address] = await findEscrowPda(organizer, nonce);
      return { signature: result.context.signature, address };
    } finally {
      setSubmitting(false);
    }
  }

  return { createBounty, submitting };
}
