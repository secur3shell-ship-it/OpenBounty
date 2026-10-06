// Markets: live prices and charts for the tokens prizes can be claimed in.

import type { Metadata } from "next";
import MarketsView from "@/components/markets/MarketsView";

export const metadata: Metadata = { title: "Markets" };

export default function MarketsPage() {
  return <MarketsView />;
}
