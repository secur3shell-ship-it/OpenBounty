"use client";

// The wallet picker: a dialog listing every Wallet Standard wallet in the browser.
// Any component opens it with useWalletModal().setVisible(true).

import { createContext, useContext, useState, type ReactNode } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useConnect, useWallets } from "@solana/kit-plugin-wallet/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { client } from "@/lib/client";
import { friendlyTxError } from "@/utils/txErrors";

interface WalletModalState {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

type UiWallet = ReturnType<typeof useWallets>[number];

const WalletModalContext = createContext<WalletModalState>({ visible: false, setVisible: () => {} });

export function useWalletModal(): WalletModalState {
  return useContext(WalletModalContext);
}

interface Props {
  children: ReactNode;
}

export function WalletModalProvider({ children }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <WalletModalContext.Provider value={{ visible, setVisible }}>
      {children}
      <WalletPicker open={visible} onOpenChange={setVisible} />
    </WalletModalContext.Provider>
  );
}

interface PickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function WalletPicker({ open, onOpenChange }: PickerProps) {
  const wallets = useWallets(client);
  const { dispatch: connect } = useConnect(client);
  const [connecting, setConnecting] = useState<string | null>(null);

  async function pick(wallet: UiWallet) {
    setConnecting(wallet.name);
    try {
      await connect(wallet);
      onOpenChange(false);
    } catch (err) {
      toast.error(friendlyTxError(err));
    } finally {
      setConnecting(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">Connect a wallet</DialogTitle>
          <DialogDescription>Switch your wallet to devnet before you sign anything.</DialogDescription>
        </DialogHeader>

        {wallets.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No Solana wallet found in this browser. Install{" "}
            <a className="text-accent-foreground underline" href="https://phantom.com" target="_blank" rel="noreferrer">Phantom</a>,{" "}
            <a className="text-accent-foreground underline" href="https://solflare.com" target="_blank" rel="noreferrer">Solflare</a> or{" "}
            <a className="text-accent-foreground underline" href="https://backpack.app" target="_blank" rel="noreferrer">Backpack</a>, then reload.
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {wallets.map((wallet) => (
            <li key={wallet.name}>
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                size="lg"
                disabled={connecting !== null}
                onClick={() => pick(wallet)}
              >
                <Image src={wallet.icon} alt="" width={22} height={22} unoptimized />
                {wallet.name}
                {connecting === wallet.name && <Loader2 className="ml-auto animate-spin" />}
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
