// Program address, limits and explorer links. Limits mirror
// programs/openbounty_v2/src/constants.rs; the ones the IDL exports come from the
// generated client so they can't drift.

import {
  MAX_CLAIM_WINDOW,
  MIN_CLAIM_WINDOW,
  MIN_PRIZE_AMOUNT,
  OPENBOUNTY_V2_PROGRAM_ADDRESS,
} from "@/generated/openbounty";
import { EXPLORER_CLUSTER } from "@/lib/config";

export const PROGRAM_ID = OPENBOUNTY_V2_PROGRAM_ADDRESS;

export const MAX_TITLE_BYTES = 50;
export const MAX_METADATA_URI_BYTES = 100;
export const MAX_JUDGES = 5;
export const MAX_TIERS = 4;
export const MIN_PRIZE_LAMPORTS = MIN_PRIZE_AMOUNT;

const DAY = 24 * 60 * 60;
// The claim window is set per bounty, in whole days on the form
export const MIN_CLAIM_WINDOW_DAYS = Number(MIN_CLAIM_WINDOW) / DAY;
export const MAX_CLAIM_WINDOW_DAYS = Number(MAX_CLAIM_WINDOW) / DAY;
export const DEFAULT_CLAIM_WINDOW_DAYS = 14;

export const explorerUrl = (signature: string) =>
  `https://explorer.solana.com/tx/${signature}?cluster=${EXPLORER_CLUSTER}`;

export const explorerAddressUrl = (address: string) =>
  `https://explorer.solana.com/address/${address}?cluster=${EXPLORER_CLUSTER}`;
