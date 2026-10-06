// The prize tiers of a bounty as a stack of TierCards.

import type { Address } from "@solana/kit";
import TierCard from "./TierCard";
import type { EscrowAccount } from "@/types/escrow";
import type { PendingAction } from "@/hooks/useBountyActions";

interface Props {
  escrow: EscrowAccount;
  viewer: Address | null;
  pending: PendingAction | null;
  claimSignatures: Map<number, string>;
  onVote: (tierIndex: number) => void;
  onClaim: (tierIndex: number) => void;
}

export default function PrizeList({ escrow, viewer, pending, claimSignatures, onVote, onClaim }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {escrow.tiers.map((_, index) => (
        <TierCard
          key={index}
          escrow={escrow}
          tierIndex={index}
          viewer={viewer}
          pending={pending}
          claimSignature={claimSignatures.get(index)}
          onVote={onVote}
          onClaim={onClaim}
        />
      ))}
    </div>
  );
}
