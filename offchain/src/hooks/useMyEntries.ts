// The connected wallet's own entries on every bounty, matched to the bounty they
// belong to (null once that bounty has closed), plus closing an entry to get its
// rent back. Used by "Your bounties".

import { useState } from "react";
import type { Address } from "@solana/kit";
import type { EscrowAccount } from "@/types/escrow";
import { listSubmissionsBySubmitter } from "@/lib/queries";
import { buildCloseEntry } from "@/lib/instructions";
import { getRentMinimum } from "@/lib/chain";
import { useAsync } from "./useAsync";

export interface MyEntry {
  address: Address;
  title: string;
  submittedAt: Date;
  escrow: Address;
  escrowCreatedAt: bigint;
  closeAfter: bigint;      // unix seconds; the entry can be closed after this
  bounty: EscrowAccount | null;
}

export function useMyEntries(viewer: Address | null, escrows: EscrowAccount[], escrowsReady: boolean) {
  const { data, loading, error, refetch } = useAsync(viewer, async () => {
    const [rows, rent] = await Promise.all([listSubmissionsBySubmitter(viewer!), getRentMinimum(539)]);
    return { rows, rent };
  });
  const [closing, setClosing] = useState<Address | null>(null);

  const entries: MyEntry[] = (data?.rows ?? []).map(({ address, data: entry }) => ({
    address,
    title: entry.title,
    submittedAt: new Date(Number(entry.submittedAt) * 1000),
    escrow: entry.escrow,
    escrowCreatedAt: entry.escrowCreatedAt,
    closeAfter: entry.closeAfter,
    // Same address and creation time: the bounty this entry was made for (not a newer one)
    bounty: escrows.find((e) => e.address === entry.escrow && e.createdAt === entry.escrowCreatedAt) ?? null,
  }));

  async function closeEntry(entry: MyEntry): Promise<string> {
    setClosing(entry.address);
    try {
      const ix = await buildCloseEntry(entry.escrow, entry.escrowCreatedAt);
      return (await ix.sendTransaction()).context.signature;
    } finally {
      setClosing(null);
    }
  }

  return {
    entries,
    rentLamports: data?.rent ?? null,
    loading: loading || !escrowsReady,
    error,
    refetch,
    closing,
    closeEntry,
  };
}
