import { createClient } from '@solana/kit';
import { solanaRpc } from '@solana/kit-plugin-rpc';
import { walletSigner } from '@solana/kit-plugin-wallet';
import { openbountyV2Program } from '@/generated/openbounty';
import { SOLANA_CHAIN, SOLANA_RPC_URL } from '@/lib/config';

// One client for the whole app. The connected wallet signs (client.identity),
// the RPC reads and sends (client.rpc), and client.openbountyV2 gives typed
// access to our program. Use it from client components.
export const client = createClient()
  .use(walletSigner({ chain: SOLANA_CHAIN }))
  .use(solanaRpc({ rpcUrl: SOLANA_RPC_URL }))
  .use(openbountyV2Program());

export type AppClient = typeof client;
