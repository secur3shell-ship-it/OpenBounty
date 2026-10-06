// Display helpers: SOL amounts, deadlines and addresses. Amounts are lamports and
// times are unix seconds, both bigint, as they come from the program.

import type { PrizeTier } from "@/types/escrow";
import { ASSETS, type AssetId } from "@/constants/assets";

const LAMPORTS_PER_SOL = 1_000_000_000n;

// Base units -> display text, using the asset's decimals:
// (12500000000n, "SOL") -> "12.5 SOL", (2500000000n, "USDC") -> "2,500 USDC"
export function formatAmount(amount: bigint | number, assetId: AssetId): string {
  const asset = ASSETS[assetId];
  const value = Number(amount) / 10 ** asset.decimals;
  const text = value.toLocaleString(undefined, { maximumFractionDigits: value < 1 ? 4 : 2 });
  return `${text} ${asset.id}`;
}

// Lamports -> "12.5 SOL"
export function formatSol(lamports: bigint): string {
  return formatAmount(lamports, "SOL");
}

// US dollars: "$84,001.00", "$121.08", "$1.00", "$0.34", and tiny prices with two
// significant digits so they don't round to zero: "$0.0000037"
export function formatUsd(value: number): string {
  if (value >= 0.1) {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${value.toLocaleString(undefined, { maximumSignificantDigits: 2 })}`;
}

// How fresh something is: "just now", "12s ago", "3 min ago"
export function formatUpdatedAgo(date: Date, now: number): string {
  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)} min ago`;
}

// Signed percent: "+2.26%", "-0.63%", "0.00%"
export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

// Typed SOL ("2.5") -> lamports, or null when it isn't a valid amount with at most
// 9 decimals. Exact: no floating point.
export function toLamports(text: string): bigint | null {
  const trimmed = text.trim();
  if (!/^\d*(\.\d{0,9})?$/.test(trimmed) || trimmed === "" || trimmed === ".") return null;
  const [whole, fraction = ""] = trimmed.split(".");
  return BigInt(whole || "0") * LAMPORTS_PER_SOL + BigInt(fraction.padEnd(9, "0"));
}

// Sum of every tier's prize
export function totalLocked(tiers: PrizeTier[]): bigint {
  return tiers.reduce((sum, tier) => sum + tier.amount, 0n);
}

// Sum of the prizes still in the vault (not claimed, not refunded)
export function unsettledTotal(tiers: PrizeTier[]): bigint {
  return tiers
    .filter((tier) => !tier.claimed && !tier.refunded)
    .reduce((sum, tier) => sum + tier.amount, 0n);
}

// A time relative to now: "12 days left", "3 hours left", "Ended 2 days ago".
// `endedWord` changes the past form, e.g. "Closed 2 days ago".
export function formatDeadline(deadline: bigint, endedWord = "Ended"): string {
  const diffMs = Number(deadline) * 1000 - Date.now();
  const amount = formatSpan(Math.floor(Math.abs(diffMs) / 1000));

  if (diffMs > 0) return amount ? `${amount} left` : "Ending now";
  return amount ? `${endedWord} ${amount} ago` : `${endedWord} just now`;
}

// 90061 -> "1 day", 7200 -> "2 hours", 300 -> "5 min", 20 -> ""
export function formatSpan(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(seconds / 86400);
  if (days > 0) return `${days} day${days === 1 ? "" : "s"}`;
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  if (minutes > 0) return `${minutes} min`;
  return "";
}

// How long ago something happened: "Just now", "5 min ago", "3 hours ago", "2 days ago",
// then a short date like "Sep 12" after a week
export function formatTimeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Full date in the viewer's locale, e.g. "Oct 9, 2026, 6:00 PM"
export function formatDate(unixSeconds: bigint): string {
  return new Date(Number(unixSeconds) * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Claim window length in whole days: deadline -> claim deadline
export function claimWindowDays(deadline: bigint, claimDeadline: bigint): number {
  return Math.round(Number(claimDeadline - deadline) / 86400);
}

// 0 -> "1st prize", 1 -> "2nd prize", ...
const PLACE_LABELS = ["1st prize", "2nd prize", "3rd prize", "4th prize"];

export function placeLabel(index: number): string {
  return PLACE_LABELS[index] ?? `Prize ${index + 1}`;
}

// "4BagKz...35Hp" -> "4Bag...35Hp"
export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
