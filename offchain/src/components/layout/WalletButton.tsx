"use client";

// Header wallet control: "Connect wallet" when logged out; when connected, a menu
// with the address, balance, copy, explorer link, change wallet and disconnect.

import Image from "next/image";
import { Copy, ExternalLink, LogOut, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWalletModal } from "@/components/wallet/WalletModal";
import { useBalance } from "@/hooks/useBalance";
import { useWallet } from "@/hooks/useWallet";
import { formatSol, truncateAddress } from "@/utils/format";
import { explorerAddressUrl } from "@/constants/program";

export default function WalletButton() {
  const { address, walletName, walletIcon, connecting, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const balance = useBalance();

  if (connecting) {
    return <Button variant="outline" disabled>Connecting...</Button>;
  }

  if (!address) {
    return (
      <Button variant="outline" onClick={() => setVisible(true)}>
        <Wallet /> Connect wallet
      </Button>
    );
  }

  const balanceText = balance === null ? "Balance unavailable" : formatSol(balance);

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied");
    } catch {
      toast.error("Couldn't copy the address.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label="Wallet menu">
          {walletIcon && <Image src={walletIcon} alt="" width={18} height={18} unoptimized />}
          <span className="font-mono">{truncateAddress(address)}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-xs font-normal text-muted-foreground">
            {walletName ?? "Wallet"} · devnet
          </span>
          <span className="tabular-nums">{balanceText}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={copyAddress}>
          <Copy /> Copy address
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={explorerAddressUrl(address)} target="_blank" rel="noreferrer">
            <ExternalLink /> View on explorer
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setVisible(true)}>
          <RefreshCw /> Change wallet
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => disconnect()}>
          <LogOut /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
