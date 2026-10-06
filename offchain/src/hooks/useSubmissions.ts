// Entries for one bounty, newest first, plus a refetch after submitting.

import type { EscrowAccount } from "@/types/escrow";
import type { Submission } from "@/types/submission";
import { listSubmissions } from "@/lib/queries";
import { toSubmission } from "@/utils/accounts";
import { useAsync } from "./useAsync";

export interface SubmissionsState {
  submissions: Submission[];
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useSubmissions(escrow: EscrowAccount | null): SubmissionsState {
  const key = escrow ? `${escrow.address}:${escrow.createdAt}` : null;
  const { data, loading, error, refetch } = useAsync<Submission[]>(key, async () => {
    const rows = await listSubmissions(escrow!.address, escrow!.createdAt);
    return rows.map((row) => toSubmission(row.address, row.data)).reverse();
  });
  return { submissions: data ?? [], loading, error, refetch };
}
