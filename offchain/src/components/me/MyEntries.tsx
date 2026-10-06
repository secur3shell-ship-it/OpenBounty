"use client";

// "Your entries" on "Your bounties": every entry you've submitted, including ones on
// bounties that have since closed, so you can close them and get the rent back.

import type { Address } from "@solana/kit";
import ErrorState from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import EntryRow from "./EntryRow";
import type { useMyEntries } from "@/hooks/useMyEntries";
import { formatSol } from "@/utils/format";
import { toastTxError, toastTxSuccess } from "@/utils/txToast";

interface Props {
  viewer: Address;
  state: ReturnType<typeof useMyEntries>;
}

export default function MyEntries({ viewer, state }: Props) {
  const { entries, rentLamports, loading, error, refetch, closing, closeEntry } = state;
  const rentText = rentLamports === null ? null : formatSol(rentLamports);

  async function handleClose(index: number) {
    try {
      const signature = await closeEntry(entries[index]);
      toastTxSuccess(rentText ? `Entry closed, ${rentText} returned` : "Entry closed", signature);
      refetch();
    } catch (err) {
      toastTxError(err);
    }
  }

  let body;
  if (loading && entries.length === 0) {
    body = <Skeleton className="h-20 rounded-xl" />;
  } else if (error) {
    body = <ErrorState message="Couldn't load your entries." onRetry={refetch} />;
  } else if (entries.length === 0) {
    body = <p className="text-sm text-muted-foreground">You haven&apos;t entered a bounty yet.</p>;
  } else {
    body = (
      <ul className="flex flex-col gap-3">
        {entries.map((entry, index) => (
          <EntryRow
            key={entry.address}
            entry={entry}
            viewer={viewer}
            rentText={rentText}
            closing={closing === entry.address}
            onClose={() => handleClose(index)}
          />
        ))}
      </ul>
    );
  }

  return (
    <section aria-labelledby="my-entries-heading" className="flex flex-col gap-4">
      <h2 id="my-entries-heading" className="font-display text-2xl">
        Your entries <span className="font-sans text-base text-muted-foreground tabular-nums">{entries.length}</span>
      </h2>
      {body}
    </section>
  );
}
