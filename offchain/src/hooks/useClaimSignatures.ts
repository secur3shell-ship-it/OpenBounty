// The claim transaction of each claimed prize on a bounty (tierIndex -> signature),
// read from the bounty's transaction history. Empty while loading or if the RPC
// no longer has the history.

import type { EscrowAccount } from "@/types/escrow";
import { findClaimSignatures } from "@/lib/history";
import { useAsync } from "./useAsync";

export function useClaimSignatures(escrow: EscrowAccount | null): Map<number, string> {
  const claimed = escrow ? escrow.tiers.flatMap((tier, index) => (tier.claimed ? [index] : [])) : [];
  const key = escrow && claimed.length > 0 ? `${escrow.address}:${escrow.createdAt}:${claimed.join(",")}` : null;
  const { data } = useAsync<Map<number, string>>(key, () =>
    findClaimSignatures(escrow!.address, escrow!.createdAt, claimed)
  );
  return data ?? new Map();
}
