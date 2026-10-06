// Tokens OpenBounty knows about. Prizes are SOL only in v1; the others appear on the
// Markets page and in the prize converter, and become prize tokens in phase 2.

export type AssetId = "SOL" | "USDC" | "USDT" | "BONK" | "JUP";

export interface Asset {
  id: AssetId;
  name: string;
  decimals: number;          // amounts are stored in base units, like lamports for SOL
  kind: "native" | "stablecoin" | "ecosystem";
  mainnetMint: string;       // reference for the real integration; the preview sends nothing
  crossChain: boolean;       // can be paid out on other chains (USDC, via Circle CCTP)
}

// A short allowlist instead of "any token": known decimals, no scam tokens, and no
// Token-2022 extensions (like permanent delegate) that could drain an escrow.
export const ASSETS: Record<AssetId, Asset> = {
  SOL:  { id: "SOL",  name: "Solana",     decimals: 9, kind: "native",     crossChain: false, mainnetMint: "So11111111111111111111111111111111111111112" },
  USDC: { id: "USDC", name: "USD Coin",   decimals: 6, kind: "stablecoin", crossChain: true,  mainnetMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  USDT: { id: "USDT", name: "Tether USD", decimals: 6, kind: "stablecoin", crossChain: false, mainnetMint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" },
  BONK: { id: "BONK", name: "Bonk",       decimals: 5, kind: "ecosystem",  crossChain: false, mainnetMint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  JUP:  { id: "JUP",  name: "Jupiter",    decimals: 6, kind: "ecosystem",  crossChain: false, mainnetMint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
};

export const ASSET_IDS: AssetId[] = ["SOL", "USDC", "USDT", "BONK", "JUP"];
