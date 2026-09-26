import { BountyList } from "@/components/BountyList";

export default function Home() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Bounties</h1>
      <BountyList />
    </div>
  );
}
