// A titled grid of bounty cards, or a short note when there are none.

import { ReactNode } from "react";
import type { Address } from "@solana/kit";
import BountyCard from "@/components/bounty/BountyCard";
import type { EscrowAccount } from "@/types/escrow";

interface Props {
  title: string;
  escrows: EscrowAccount[];
  viewer: Address;
  emptyText: string;
  emptyAction?: ReactNode;
}

export default function BountyGridSection({ title, escrows, viewer, emptyText, emptyAction }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl">
        {title} <span className="font-sans text-base tabular-nums text-muted-foreground">{escrows.length}</span>
      </h2>

      {escrows.length === 0 && (
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <p>{emptyText}</p>
          {emptyAction}
        </div>
      )}

      {escrows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {escrows.map((escrow) => (
            <BountyCard key={escrow.address} escrow={escrow} viewer={viewer} />
          ))}
        </div>
      )}
    </section>
  );
}
