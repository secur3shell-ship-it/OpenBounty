// App settings. Anything starting with NEXT_PUBLIC_ ends up in the browser, so
// never put secrets here (see .env.example).

/** Devnet RPC URL. Put your own provider URL in .env.local; the public one is a slow fallback. */
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';

/** Wallet Standard chain id for the network we use. */
export const SOLANA_CHAIN = 'solana:devnet';

/** `cluster` value for explorer.solana.com links. */
export const EXPLORER_CLUSTER = 'devnet';
