'use client';

import { useEffect, useState } from 'react';
import type { Address } from '@solana/kit';
import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWallets,
  WalletReadyGate,
} from '@solana/kit-plugin-wallet/react';
import { getBalanceLamports } from '@/lib/chain';
import { client } from '@/lib/client';
import { formatSol, shortAddress } from '@/lib/format';

function Balance({ address }: { address: Address }) {
  const [text, setText] = useState('…');
  useEffect(() => {
    let live = true;
    getBalanceLamports(address)
      .then((lamports) => {
        if (live) setText(formatSol(lamports));
      })
      .catch(() => {
        if (live) setText('balance unavailable');
      });
    return () => {
      live = false;
    };
  }, [address]);
  return <span className="text-sm text-zinc-500">{text}</span>;
}

function Inner() {
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const { dispatch: connect } = useConnect(client);
  const { dispatch: disconnect } = useDisconnect(client);

  if (connected) {
    const address = connected.account.address as Address;
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm" title={address}>
          {shortAddress(address)}
        </span>
        <Balance address={address} />
        <button className="rounded border px-3 py-1 text-sm" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }
  if (wallets.length === 0) {
    return <span className="text-sm">No Solana wallet found. Install Phantom, Solflare or Backpack.</span>;
  }
  return (
    <div className="flex gap-2">
      {wallets.map((wallet) => (
        <button key={wallet.name} className="rounded border px-3 py-1 text-sm" onClick={() => connect(wallet)}>
          Connect {wallet.name}
        </button>
      ))}
    </div>
  );
}

export function WalletButton() {
  return (
    <WalletReadyGate client={client} fallback={<span className="text-sm">Loading wallets…</span>}>
      <Inner />
    </WalletReadyGate>
  );
}
