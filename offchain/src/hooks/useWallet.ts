// The connected wallet, from the Kit wallet plugin: its address ("viewer"), name and
// icon, plus disconnect. Null address on the server and while logged out.

import type { Address } from "@solana/kit";
import { useConnectedWallet, useDisconnect, useWalletStatus } from "@solana/kit-plugin-wallet/react";
import { client } from "@/lib/client";
import { useHydrated } from "./useHydrated";

export interface WalletInfo {
  address: Address | null;
  walletName: string | null;
  walletIcon: string | null;
  connecting: boolean;
  disconnect: () => void;
}

export function useWallet(): WalletInfo {
  const hydrated = useHydrated();
  const connected = useConnectedWallet(client);
  const status = useWalletStatus(client);
  const { dispatch: disconnect } = useDisconnect(client);

  if (!hydrated || !connected) {
    const connecting = hydrated && (status === "connecting" || status === "reconnecting");
    return { address: null, walletName: null, walletIcon: null, connecting, disconnect: () => disconnect() };
  }
  return {
    address: connected.account.address as Address,
    walletName: connected.wallet.name,
    walletIcon: connected.wallet.icon,
    connecting: status === "connecting",
    disconnect: () => disconnect(),
  };
}
