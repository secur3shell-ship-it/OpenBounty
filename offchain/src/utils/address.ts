// Wallet address helpers.

import { address, isAddress, type Address } from "@solana/kit";

// Text -> Address, or null when it isn't a valid Solana address
export function parseAddress(text: string): Address | null {
  const trimmed = text.trim();
  return isAddress(trimmed) ? address(trimmed) : null;
}

// The organizer's "details link" or an entry link as a safe href, or null.
// Only http(s) and ipfs:// are allowed, so a "javascript:" link can never run.
export function safeDetailsUrl(uri: string): string | null {
  const text = uri.trim();
  if (text.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${text.slice("ipfs://".length)}`;
  if (text.startsWith("https://") || text.startsWith("http://")) return text;
  return null;
}

// UTF-8 length, the unit the program counts limits in
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}
