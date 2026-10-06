// "Your bounties": to-dos and the bounties you organize or judge.

import type { Metadata } from "next";
import MyBounties from "@/components/me/MyBounties";

export const metadata: Metadata = { title: "Your bounties" };

export default function MyBountiesPage() {
  return <MyBounties />;
}
