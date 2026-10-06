// What the connected wallet ("viewer") is on a bounty: organizer, judge, and/or winner.

import type { Address } from "@solana/kit";
import type { EscrowAccount } from "@/types/escrow";

export interface ViewerRoles {
  isOrganizer: boolean;
  isJudge: boolean;
  wonTiers: number[]; // indexes of tiers this wallet won
}

export function getViewerRoles(escrow: EscrowAccount, viewer: Address | null): ViewerRoles {
  const roles: ViewerRoles = { isOrganizer: false, isJudge: false, wonTiers: [] };
  if (!viewer) return roles;

  roles.isOrganizer = escrow.organizer === viewer;
  roles.isJudge = escrow.judges.includes(viewer);

  escrow.tiers.forEach((tier, index) => {
    if (tier.winner === viewer) roles.wonTiers.push(index);
  });

  return roles;
}
