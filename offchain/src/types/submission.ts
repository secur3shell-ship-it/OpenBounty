// A builder's entry to a bounty (the on-chain Submission account). The submitter's
// wallet is the candidate judges vote for.

import type { Address } from "@solana/kit";

export interface Submission {
  id: string;            // the Submission account address
  bounty: Address;       // escrow address
  submitter: Address;    // builder's wallet, also the address judges vote for
  title: string;         // project name
  url: string;           // demo or repo link
  description: string;
  submittedAt: Date;
}
