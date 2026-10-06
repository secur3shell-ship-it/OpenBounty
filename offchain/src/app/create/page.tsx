// Create a bounty: lock a prize pool and name the judges.

import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import CreateBountyForm from "@/components/create/CreateBountyForm";

export const metadata: Metadata = { title: "Create a bounty" };

export default function CreatePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <PageHeader
        title="Create a bounty"
        description="Lock a prize pool on-chain. Your judges vote on winners, and winners claim directly."
      />
      <CreateBountyForm />
    </div>
  );
}
