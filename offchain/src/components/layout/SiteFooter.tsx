// Footer on every page.

export default function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>OpenBounty · trustless bounties on Solana</p>
        <p>Running on devnet</p>
      </div>
    </footer>
  );
}
