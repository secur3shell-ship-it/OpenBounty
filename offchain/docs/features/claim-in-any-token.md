# Claim in any token (phase 2)

> **Status: planned for phase 2. Nothing here is in the app today.**
> In v1 every prize is SOL, and a winner's claim sends SOL straight to their Solana wallet. The claim window pieces from the earlier preview ("Receive as", "Receive on", the live swap quote and the transfer steps) were removed.
>
> **Looking for the Markets page?** It's live and now runs on our read-only market feed. See [markets-feed.md](markets-feed.md).

## In one paragraph

The plan is that winners won't have to take their prize in whatever token the organizer chose. When claiming, they'd pick **what to receive it in** (for example SOL, USDC, USDT, BONK or JUP) and see a live quote first: about how much they'll get, the minimum guaranteed, and how much the trade moves the price. USDC winners could also choose to be paid on another chain (Base, Ethereum or Arbitrum). Organizers could fund prizes in tokens other than SOL.

## What's planned

| Part | What it would do |
|---|---|
| **Prizes in other tokens** | Organizers fund a bounty in SOL or another token from a short allowlist |
| **Receive as** | In the claim window, keep the prize token or swap it into another (through Jupiter) |
| **Live quote** | You'll receive about, minimum received, and price impact, refreshed while the window is open |
| **Receive on** | For USDC only: be paid on Solana, Base, Ethereum or Arbitrum (through Circle CCTP) |
| **Progress** | Claims that swap or change chain show each step, then **Done** |

## How it benefits them

| Who | Benefit |
|---|---|
| **Winners** | **Paid in what they actually want**, without a separate swap in another app. |
| | **Know before claiming:** a live quote with a guaranteed minimum and the price impact. |
| | **Protected from bad fills:** if the price moves too far during the swap, it doesn't happen. |
| **Organizers** | **Pick a prize token without worrying winners won't want it.** A community can pay in its own token (BONK, JUP) while winners still leave with USDC or SOL. |

## What it takes to build

For developers.

1. **Program: token prizes.** The program holds and pays out SOL only today. Prizes in other tokens need program changes: token vaults, an allowlist of mints (no Token-2022 extensions that could drain an escrow), and claim and refund paths for tokens.
2. **Swaps.** No program change is needed: claim sends the prize to the winner's wallet as today, then the app asks Jupiter for a swap transaction for the received amount and sends it. That's two approvals; bundling both in one transaction could come later. If the swap fails, the prize is already in the wallet in its original token, so say so and offer to retry.
3. **USDC to other chains.** Circle CCTP: burn USDC on Solana, then mint the same amount on the destination chain. The winner enters an address on that chain (it starts with `0x`).
4. **Frontend.** A claim window with Receive as, Receive on, a live quote and real progress steps from the transaction status. Amounts must then be shown per token instead of assuming SOL.

## Where the code is

| File | Purpose |
|---|---|
| `src/constants/assets.ts` | The token allowlist (SOL, USDC, USDT, BONK, JUP) with decimals and mainnet mints. Used today by the Markets page and the prize converter. |
| `src/constants/chains.ts` (removed in v1) | Chains USDC could be paid out on, with their Circle CCTP domain numbers. Restore it from the reference export (`~/openbounty-ui-export`) in phase 2. |
