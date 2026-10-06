'use client';

import type { ReactNode } from 'react';
import { ClientProvider } from '@solana/react';
import { client } from '@/lib/client';
import { WalletModalProvider } from '@/components/wallet/WalletModal';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClientProvider client={client}>
      <WalletModalProvider>{children}</WalletModalProvider>
    </ClientProvider>
  );
}
