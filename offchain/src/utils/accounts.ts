// Decoded program accounts (generated client types) -> the shapes components use.

import { unwrapOption, type Address } from "@solana/kit";
import type { Escrow, Submission as SubmissionAccount } from "@/generated/openbounty";
import type { EscrowAccount } from "@/types/escrow";
import type { Submission } from "@/types/submission";

export function toEscrowAccount(address: Address, data: Escrow): EscrowAccount {
  return {
    address,
    organizer: data.organizer,
    nonce: data.nonce,
    title: data.title,
    metadataUri: data.metadataUri,
    judges: [...data.judges],
    threshold: data.voteThreshold,
    tiers: data.prizeTiers.map((tier) => ({
      amount: tier.amount,
      winner: unwrapOption(tier.winner),
      claimed: tier.claimed,
      refunded: tier.refunded,
      votes: tier.votes.map((vote) => ({ judge: vote.judge, candidate: vote.candidate })),
    })),
    createdAt: data.createdAt,
    submissionsDeadline: data.submissionsDeadline,
    deadline: data.deadline,
    claimDeadline: data.claimDeadline,
  };
}

export function toSubmission(address: Address, data: SubmissionAccount): Submission {
  return {
    id: address,
    bounty: data.escrow,
    submitter: data.submitter,
    title: data.title,
    url: data.url,
    description: data.description,
    submittedAt: new Date(Number(data.submittedAt) * 1000),
  };
}
