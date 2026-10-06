// Bounty detail page. The URL holds the escrow account address.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BountyDetail from "@/components/bounty/BountyDetail";
import { parseAddress } from "@/utils/address";

export const metadata: Metadata = { title: "Bounty details" };

interface Props {
  params: Promise<{ address: string }>;
}

export default async function BountyPage({ params }: Props) {
  const { address } = await params;
  // Not an address at all: a real 404 instead of an empty page
  if (!parseAddress(address)) notFound();
  return <BountyDetail address={address} />;
}
