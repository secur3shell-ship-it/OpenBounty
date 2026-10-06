// One bounty by address: null when it doesn't exist or has closed after settling.

import { address as toAddress } from "@solana/kit";
import type { EscrowAccount } from "@/types/escrow";
import { fetchEscrowOrNull } from "@/lib/queries";
import { toEscrowAccount } from "@/utils/accounts";
import { useAsync } from "./useAsync";

export function useEscrow(address: string) {
  const { data, loading, error, refetch } = useAsync<EscrowAccount | null>(address, async () => {
    const row = await fetchEscrowOrNull(toAddress(address));
    return row ? toEscrowAccount(row.address, row.data) : null;
  });
  return { escrow: data ?? null, loading, error, refetch };
}
