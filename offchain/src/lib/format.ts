import { formatDecimalFixedPoint, lamports, lamportsToSol, sol, solToLamports } from '@solana/kit';
import { EXPLORER_CLUSTER } from '@/lib/config';

const solFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 9 });

/** 1_500_000_000n → "1.5 SOL". Amounts stay bigint lamports everywhere else. */
export function formatSol(amount: bigint): string {
  return `${formatDecimalFixedPoint(solFormat, lamportsToSol(lamports(amount)))} SOL`;
}

/** "1.5" → 1_500_000_000n, or null if it isn't a valid SOL amount. */
export function parseSol(input: string): bigint | null {
  try {
    return solToLamports(sol(input.trim()));
  } catch {
    return null;
  }
}

/** "Ad5NzuNt…URwqk" style, for tight spaces. Always offer the full address too. */
export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

/** Unix seconds → a local date and time. */
export function formatUnixTime(seconds: bigint): string {
  return new Date(Number(seconds) * 1000).toLocaleString();
}

export function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=${EXPLORER_CLUSTER}`;
}

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${EXPLORER_CLUSTER}`;
}
