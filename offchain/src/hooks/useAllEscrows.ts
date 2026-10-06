// Every bounty on the network. Works without a wallet; `enabled = false` skips loading.

import type { EscrowAccount } from "@/types/escrow";
import { listAllEscrows } from "@/lib/queries";
import { toEscrowAccount } from "@/utils/accounts";
import { useAsync } from "./useAsync";

export function useAllEscrows(enabled = true) {
  const { data, loading, error, refetch } = useAsync<EscrowAccount[]>(enabled ? "all" : null, async () => {
    const rows = await listAllEscrows();
    return rows.map((row) => toEscrowAccount(row.address, row.data));
  });
  return { escrows: data ?? [], loading, error, refetch };
}
