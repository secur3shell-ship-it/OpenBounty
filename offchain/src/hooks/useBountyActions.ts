// The transactions on one bounty: vote, claim, refund (every refundable prize in one
// transaction), submit an entry and close it. `pending` names the action in flight
// ("vote-0", "claim-1", "refund", "submit", "close-entry") so its button shows a spinner.
// Each action resolves to the transaction signature, or throws; callers show the toast.

import { useState } from "react";
import type { Address } from "@solana/kit";
import type { EscrowAccount } from "@/types/escrow";
import { client } from "@/lib/client";
import { UserFacingError } from "@/lib/errors";
import {
  buildClaim,
  buildCloseEntry,
  buildRefund,
  buildSubmitEntry,
  buildVote,
} from "@/lib/instructions";
import { refundableTiers } from "@/utils/status";
import type { SubmissionValues } from "@/utils/submissions";

export type PendingAction = `vote-${number}` | `claim-${number}` | "refund" | "submit" | "close-entry";

export function useBountyActions(escrow: EscrowAccount | null) {
  const [pending, setPending] = useState<PendingAction | null>(null);

  async function run(action: PendingAction, send: () => Promise<string>): Promise<string> {
    setPending(action);
    try {
      return await send();
    } finally {
      setPending(null);
    }
  }

  function requireEscrow(): EscrowAccount {
    if (!escrow) throw new Error("Bounty not loaded");
    return escrow;
  }

  function vote(tierIndex: number, candidate: Address) {
    return run(`vote-${tierIndex}`, async () => {
      const result = await buildVote(requireEscrow().address, tierIndex, candidate).sendTransaction();
      return result.context.signature;
    });
  }

  function claim(tierIndex: number) {
    return run(`claim-${tierIndex}`, async () => {
      const e = requireEscrow();
      const ix = await buildClaim(e.address, e, tierIndex);
      return (await ix.sendTransaction()).context.signature;
    });
  }

  // Every prize refundable right now, in one transaction (at most 4 instructions)
  function refund() {
    return run("refund", async () => {
      const e = requireEscrow();
      const tiers = refundableTiers(e);
      if (tiers.length === 0) throw new UserFacingError("Nothing can be refunded right now.");
      const ixs = await Promise.all(tiers.map((tier) => buildRefund(e.address, e, tier)));
      return (await client.sendTransaction(ixs)).context.signature;
    });
  }

  function submitEntry(values: SubmissionValues) {
    return run("submit", async () => {
      const e = requireEscrow();
      const ix = await buildSubmitEntry(
        e.address,
        e.createdAt,
        values.title.trim(),
        values.url.trim(),
        values.description.trim()
      );
      return (await ix.sendTransaction()).context.signature;
    });
  }

  function closeEntry() {
    return run("close-entry", async () => {
      const e = requireEscrow();
      const ix = await buildCloseEntry(e.address, e.createdAt);
      return (await ix.sendTransaction()).context.signature;
    });
  }

  return { vote, claim, refund, submitEntry, closeEntry, pending };
}
