import { isAddress } from "@solana/kit";
import { notFound } from "next/navigation";
import { BountyDetail } from "@/components/BountyDetail";

export default async function BountyPage({ params }: { params: Promise<{ escrow: string }> }) {
  const { escrow } = await params;
  if (!isAddress(escrow)) notFound();
  return <BountyDetail escrowAddress={escrow} />;
}
