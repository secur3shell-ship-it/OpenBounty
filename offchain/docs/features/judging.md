# Entries, judging board and scorecards

> **Status: live on devnet.**
> - **Entries** are real on-chain accounts (`submit_entry`, `close_entry`).
> - **Votes** use the program's `vote_winner` instruction, from the Prizes tab or the judging board.
> - **Scorecards** are stored in the judge's browser, never on-chain.

## In one paragraph

Builders **submit an entry** (project name, link, short description) to a bounty, and everyone can browse the entries. Judges get a **judging board**: they privately **score** each entry on three criteria, compare their scores side by side, then drag an entry onto a prize to vote. The winner is picked automatically once enough judges agree. After judging ends, builders can close their entry to get back the small rent they paid for it.

## The bounty timeline

Every bounty has three dates, set by the organizer when creating it:

| Date | What happens |
|---|---|
| **Entries close** | Builders can submit entries until then. |
| **Judging ends** | Judges can vote until then. Prizes that never got a winner can be refunded after it. |
| **Claim window ends** | Winners have this many days after judging ends to claim (the organizer picks 1 to 90 days, 14 by default). After it, unclaimed prizes can be refunded. |

The bounty's status shows where it is: **Open**, **Ending soon** (entries close within 24 hours), **Judging** (entries closed, judges voting) or **Ended**.

## What was built

| Where | What it does |
|---|---|
| **Bounty page** | Tabs: **Prizes**, **Submissions (N)**, and **Judging** (visible only to that bounty's judges). The side panel shows all three dates. |
| **Submissions tab** | Every entry: name, who submitted it, when, description, a "View project" link, and badges such as "Won 1st prize" or "2 votes · 1st prize". It says when entries close. Builders who may enter see **Submit entry**; everyone else sees why they can't. |
| **Submit entry dialog** | Project name, link and an optional description with a character count, with clear error messages |
| **Close entry** | On your own entry, after judging ends: **Close entry, get rent back** |
| **Judging tab** | **Entries** on one side, **Prizes** on the other. Each prize shows its votes, "your vote", and a trophy for the winner. |
| **Scoring** | Rate an entry 1–5 for Innovation, Execution and Impact, with a note. The entry card shows "Your score 14/15". Sort entries by your score, or open **Compare scores** for a table of everything. |
| **Voting from the board** | Drag an entry onto a prize, or use **Vote as...** (works with a keyboard and on phones). A confirmation says whether your vote will pick the winner. |
| **Vote dialog on the Prizes tab** | Lists entries by project name, plus any wallet that already has votes, and an address field |

## User guide

Step-by-step instructions from the user's point of view. Wherever you're asked to "approve in your wallet", your wallet shows the transaction first. Everything runs on devnet, so switch your wallet to devnet and get free SOL from https://faucet.solana.com.

### For builders

**Submit an entry**
1. Connect your wallet (top right). Use the wallet that should receive the prize if you win.
2. Open the bounty from **Explore**, or from a link someone shared.
3. Select the **Submissions** tab.
4. Click **Submit entry**. If you don't see the button, a short note says why (see "Common questions").
5. Fill in the form:
   - **Project name:** what judges see first. Up to 50 characters.
   - **Link:** your demo, repo or write-up. It must start with `https://` or `ipfs://`. Up to 100 characters.
   - **Short description** (optional): one or two sentences, up to 280 characters.
6. Click **Submit entry** and approve in your wallet. You pay a small refundable rent for the entry. Your entry appears in the list, marked **you**.

Some characters, such as emoji or accented letters, count as more than one, because the program counts bytes.

**Follow how your entry is doing**
- On the **Submissions** tab, your entry's card shows its votes, like **2 votes · 1st prize**. Once judges pick it, the card shows **Won 1st prize**.
- **Your bounties** (in the top menu) lists any prize you've won under **Ready to claim**, with the date you must claim by.

**Claim a prize you won**
1. Open **Your bounties**, then **Ready to claim**, and click **Claim**. Or open the bounty and go to the **Prizes** tab.
2. Click **Claim X SOL** on your prize and approve in your wallet. The SOL goes straight to your wallet.
3. Claim before the claim window ends. After that, the organizer can take the prize back.

**Get your entry's rent back**
1. After judging ends, open the bounty and go to the **Submissions** tab.
2. On your own entry, click **Close entry, get rent back** and approve in your wallet. The entry is removed and its rent returns to your wallet.

The button is on the bounty page, so it's only there while the bounty is still up. Once every prize is claimed or refunded, the bounty closes and its page is gone. The program still lets you close the entry then, but the app has no button for it yet.

### For judges

**Find what needs your vote**
- Open **Your bounties**. **Needs your vote** lists every prize you still have to decide. Click **Vote** to open that bounty.

**Review and score entries**
1. On the bounty page, select the **Judging** tab. Only the bounty's judges see it, so connect the wallet you were added with.
2. Review each entry (its project link is on the **Submissions** tab), then click **Score** on its card.
3. Rate **Innovation**, **Execution** and **Impact** from 1 to 5, add a note if you like, and click **Save score**. The card then shows **Your score** (for example 14/15).
4. To rank your favourites, choose **Your score** above the entries. To see everything in one table, click **Compare scores**.

Your scores are private. They stay in your browser, and nobody else (not other judges, not the organizer) can see them.

**Cast your vote**
1. Drag an entry onto a prize in the **Prizes** column. Or click **Vote as...** on the entry and pick the prize; this works with a keyboard and on phones.
2. Read the confirmation. It tells you how many votes the entry will have, or that your vote picks the winner.
3. Click **Cast vote** and approve in your wallet. The prize column shows **your vote**.

You can also vote from the **Prizes** tab with **Vote for a winner**: pick an entry, or paste any wallet address.

You vote once per prize, and a vote can't be changed. You can vote until judging ends. When an entry reaches the required number of votes, it wins that prize automatically.

### For organizers

1. **Share** the bounty link so builders can find it.
2. Watch entries arrive on the **Submissions** tab. On the **Prizes** tab, each prize shows its votes and winner.
3. You can't enter or judge your own bounty, which keeps the result fair.
4. **Refunds:** the bounty page shows a refund card with a **Refund X SOL** button when something can be refunded:
   - a prize that never got a winner, once judging ends
   - a winner's prize they didn't claim, once the claim window ends

   One click refunds everything that can be refunded at that moment, in one transaction. If winners can still claim, the page says until when.
5. Once every prize is claimed or refunded, the bounty closes and disappears from the app.

### Common questions

- **Why can't I submit an entry?** The note next to the entry count says why:
  - entries have closed
  - you're the organizer or one of the judges
  - you've already entered

  If you see a **Connect wallet** card instead, connect your wallet first.
- **Can I edit my entry?** No, so check the link before submitting. After judging ends you can close it to get your rent back.
- **Can I change my vote?** No. Each judge votes once per prize, which is why the confirmation spells out what your vote will do.
- **Who can see my scores?** Only you, in the browser where you scored. They aren't stored on-chain and don't count as votes.
- **Can one entry win two prizes?** Yes, if judges vote for it on both.
- **Can judges vote for someone who didn't submit an entry?** Yes. A vote names a wallet, so a judge can paste any wallet except the organizer's or a judge's.
- **I'm a judge, but I don't see the Judging tab.** Connect the wallet the organizer added as a judge.
- **What happens if I don't claim in time?** After the claim window ends, the prize shows as **Unclaimed** and the organizer can refund it.

## Try it on devnet

For the team. There's no mock mode, so use real devnet wallets (two or three accounts in one wallet work).

1. Run `npm run dev` in `offchain/` and open http://localhost:3000.
2. **As an organizer:** create a bounty with short dates (entries closing in about 15 minutes, judging ending shortly after, a 1-day claim window) and add your other wallets as judges.
3. **As a builder:** switch to a wallet that is neither organizer nor judge, open the bounty, go to **Submissions** and click **Submit entry**.
4. **As a judge:** switch to a judge wallet and open the **Judging** tab. Score the entry, open **Compare scores**, then drag it onto **1st prize**.
5. **As the winner:** once enough judges have voted, switch to the builder wallet and claim from **Your bounties**. After judging ends, close the entry to get the rent back.

Sample bounties created with `yarn seed:devnet` (repo root) are another starting point.

## How it benefits them

| Who | Benefit |
|---|---|
| **Builders** | **A clear place to submit** that judges will see, instead of sending a wallet address around. |
| | **Visibility:** your project is listed on the bounty, with a link, for anyone to see. |
| | **Rent comes back:** close your entry after judging ends. |
| **Judges** | **Judge the work, not a wallet address:** every entry has a name, link and description. |
| | **A real process:** consistent criteria, private scores and a side-by-side comparison make fair decisions easier. |
| | **Fewer mistakes:** drag-and-drop or a menu instead of pasting addresses, and a confirmation that says exactly what your vote will do. |
| **Organizers** | **Credibility:** a transparent submission and judging process that builders can trust. |
| | **Everything in one place:** entries, votes, winners and refunds on the bounty page. |
| **Everyone** | **Transparency:** entries and vote progress are public, while judges' scores stay private. |

## Rules

**Who can enter** (checked by `submit_entry`):
- anyone with a connected wallet, until entries close
- except the organizer and the bounty's judges (conflict of interest)
- one entry per wallet per bounty
- name up to 50 bytes, link up to 100 bytes, description up to 280 bytes

**Voting** follows the program's `vote_winner` rules:
- only the bounty's judges, until judging ends
- once per judge per prize, no changes after voting
- the candidate can be any wallet except the organizer or a judge (an entry isn't required)
- the winner is picked automatically when a candidate reaches the votes needed, which is always more than half of the judges

The same wallet may win more than one prize.

**Claiming and refunds:**
- the winner claims until the claim window ends
- the organizer can refund a prize with no winner after judging ends, and an unclaimed winner's prize after the claim window
- the bounty closes once every prize is claimed or refunded

**Closing an entry** (`close_entry`): only by the builder who submitted it, after judging ends. The rent goes back to them.

**Scorecards** are private to the judge's browser and wallet. They're never sent anywhere and don't affect the vote by themselves.

## How it works on-chain

For developers.

- **Entry account:** `submit_entry` creates a `Submission` account at `["submission", escrow, escrow.createdAt (i64, little-endian), submitter]`. The bounty's creation time is in the address because a closed bounty's address can be reused; old entries never show up on a new bounty.
- **What it stores:** `title`, `url`, `description`, `submittedAt`, and `closeAfter` (the bounty's judging end, copied so the entry can still be closed after the bounty itself has closed). The submitter pays the rent.
- **Errors**, all mapped to plain English in `src/lib/errors.ts`: `SubmissionsClosed`, `OrganizerCannotSubmit`, `JudgeCannotSubmit`, `InvalidEntryTitle`, `InvalidEntryUrl`, `InvalidEntryDescription`, and `EntryLocked` (closing before judging ends). A second entry from the same wallet fails because the address is already in use.
- **Loading entries:** `listSubmissions` uses `getProgramAccounts`, filtered by the bounty's address and creation time.
- **Votes still name wallets, not entries.** The app maps votes onto entries by the submitter's wallet (`getVoteCandidates`, `votesPerTier`, `wonTiers`).

## Where the code is

| File | Purpose |
|---|---|
| `src/types/submission.ts`, `src/constants/submissions.ts` | Entry type and limits |
| `src/utils/submissions.ts` | Who may enter, validation, and mapping votes onto entries (`getVoteCandidates`, `votesPerTier`, `wonTiers`) |
| `src/utils/judging.ts` | Which prizes a judge can still vote on, and sorting entries |
| `src/utils/status.ts` | Bounty and prize statuses, and which prizes can be refunded now |
| `src/utils/scorecard.ts`, `src/hooks/useScorecard.ts` | Criteria, totals, and browser storage |
| `src/hooks/useSubmissions.ts` | Loading a bounty's entries |
| `src/hooks/useBountyActions.ts` | `vote`, `claim`, `refund`, `submitEntry`, `closeEntry` |
| `src/lib/queries.ts`, `src/lib/instructions.ts`, `src/lib/pda.ts` | `listSubmissions`, `buildSubmitEntry`, `buildCloseEntry`, `findSubmissionPda` |
| `src/components/submissions/` | Submissions tab, entry card, submit dialog |
| `src/components/judging/` | Judging board, board card, prize column, score, compare and confirm dialogs |
| `src/components/bounty/BountyTabs.tsx` | The Prizes, Submissions and Judging tabs |
