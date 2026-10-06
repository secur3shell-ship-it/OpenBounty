// The connected wallet's balance in lamports, or null (logged out or not loaded yet).

import { useEffect, useState } from "react";
import { getBalanceLamports } from "@/lib/chain";
import { useWallet } from "./useWallet";

export function useBalance(): bigint | null {
  const { address } = useWallet();
  const [balance, setBalance] = useState<{ address: string; lamports: bigint } | null>(null);

  useEffect(() => {
    if (!address) return;
    let live = true;
    getBalanceLamports(address)
      .then((lamports) => { if (live) setBalance({ address, lamports }); })
      .catch(() => {});
    return () => { live = false; };
  }, [address]);

  return balance && balance.address === address ? balance.lamports : null;
}
