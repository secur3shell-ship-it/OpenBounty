// Home page: explore every bounty, then the latest news from around Solana.

import ExploreBounties from "@/components/explore/ExploreBounties";
import NewsFeed from "@/components/news/NewsFeed";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <ExploreBounties />
      <NewsFeed />
    </div>
  );
}
