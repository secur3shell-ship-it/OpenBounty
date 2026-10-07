import * as anchor from "@anchor-lang/core";
import { BN, Program, web3 } from "@anchor-lang/core";
import assert from "node:assert/strict";

import idl from "../target/idl/openbounty_v2.json";
import { OpenbountyV2 } from "../target/types/openbounty_v2";
import { balance, chainNow, expectError, fundedKeypairs, warpTo } from "./helpers/chain";
import { findEscrowPda, findSubmissionPda, findVaultPda } from "./helpers/pda";

const SOL = web3.LAMPORTS_PER_SOL;
const HOUR = 60 * 60;
const DAY = 24 * HOUR;
const MIN_PRIZE = 1_000_000;

// The whole suite shares one network clock, which only moves forward. Tests
// run in order: everything before the entry deadline first, then the clock is
// moved past the entry deadline, the voting deadline and the claim window.
describe("openbounty_v2", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.openbountyV2 as Program<OpenbountyV2>;
  const programId = program.programId;
  const organizer = provider.wallet.publicKey;

  let judges: web3.Keypair[];
  let builders: web3.Keypair[];
  let outsider: web3.Keypair;
  let t0: number; // chain time when the shared bounties were created
  let nextNonce = 0;

  // Shared bounties, all with entries closing at t0+1h, voting at t0+2h and a
  // one-day claim window.
  let main: Bounty; // 3 judges, threshold 2, tiers [0.5, 0.2, 0.1] SOL
  let refundable: Bounty; // 1 judge, threshold 1, tiers [0.1, 0.1] SOL
  let timeTravel = true;

  // Repeating an identical transaction within one blockhash is dropped as
  // "already processed"; a varying compute limit keeps every send unique.
  let uniq = 0;
  const unique = () => web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 + uniq++ });

  interface Bounty {
    nonce: number;
    escrow: web3.PublicKey;
    vault: web3.PublicKey;
    judges: web3.Keypair[];
    createdAt: number;
  }

  function params(overrides: Partial<Record<string, unknown>> = {}) {
    const nonce = nextNonce++;
    return {
      nonce,
      title: "Build a Solana wallet tracker",
      metadataUri: "https://example.com/bounty.json",
      judges: judges.slice(0, 3).map((j) => j.publicKey),
      voteThreshold: 2,
      prizeAmounts: [new BN(0.5 * SOL)],
      submissionsDeadline: new BN(t0 + HOUR),
      deadline: new BN(t0 + 2 * HOUR),
      claimWindow: new BN(DAY),
      ...overrides,
    };
  }

  async function create(p: ReturnType<typeof params>, signer?: web3.Keypair): Promise<Bounty> {
    const org = signer?.publicKey ?? organizer;
    const builder = program.methods.initializeEscrow(p as never).accounts({ organizer: org }).preInstructions([unique()]);
    await (signer ? builder.signers([signer]) : builder).rpc();
    const escrow = findEscrowPda(programId, org, p.nonce)[0];
    return {
      nonce: p.nonce,
      escrow,
      vault: findVaultPda(programId, org, p.nonce)[0],
      judges: judges.filter((j) => (p.judges as web3.PublicKey[]).some((k) => k.equals(j.publicKey))),
      createdAt: (await program.account.escrow.fetch(escrow)).createdAt.toNumber(),
    };
  }

  function vote(b: Bounty, judge: web3.Keypair, tier: number, candidate: web3.PublicKey) {
    return program.methods
      .voteWinner(tier, candidate)
      .accountsPartial({ judge: judge.publicKey, escrow: b.escrow })
      .preInstructions([unique()])
      .signers([judge])
      .rpc();
  }

  function claim(b: Bounty, winner: web3.Keypair, tier: number) {
    return program.methods
      .claimPrize(tier)
      .accountsPartial({ winner: winner.publicKey, escrow: b.escrow, vault: b.vault, organizer })
      .preInstructions([unique()])
      .signers([winner])
      .rpc();
  }

  function refundIx(b: Bounty, tier: number) {
    return program.methods
      .refundUnclaimed(tier)
      .accountsPartial({ organizer, escrow: b.escrow, vault: b.vault })
      .instruction();
  }

  async function refund(b: Bounty, ...tiers: number[]) {
    const tx = new web3.Transaction().add(unique());
    for (const tier of tiers) tx.add(await refundIx(b, tier));
    return provider.sendAndConfirm(tx);
  }

  function submit(b: Bounty, builder: web3.Keypair, title = "Pocketwatch", url = "https://example.com/p", description = "") {
    return program.methods
      .submitEntry(title, url, description)
      .accountsPartial({ submitter: builder.publicKey, escrow: b.escrow })
      .preInstructions([unique()])
      .signers([builder])
      .rpc();
  }

  function closeEntry(b: Bounty, builder: web3.Keypair) {
    return program.methods
      .closeEntry()
      .accountsPartial({
        submitter: builder.publicKey,
        submission: findSubmissionPda(programId, b.escrow, b.createdAt, builder.publicKey)[0],
      })
      .preInstructions([unique()])
      .signers([builder])
      .rpc();
  }

  before(async () => {
    judges = await fundedKeypairs(provider, 5, 0.05 * SOL);
    builders = await fundedKeypairs(provider, 4, 0.1 * SOL);
    [outsider] = await fundedKeypairs(provider, 1, 0.05 * SOL);
    t0 = await chainNow(provider);
  });

  describe("IDL", () => {
    it("is deployed as an executable program", async () => {
      const info = await provider.connection.getAccountInfo(programId);
      assert.ok(info?.executable);
    });

    it("exposes the six instructions", () => {
      assert.equal(idl.metadata.name, "openbounty_v2");
      assert.equal(idl.address, programId.toBase58());
      assert.deepEqual(idl.instructions.map((ix) => ix.name).sort(), [
        "claim_prize",
        "close_entry",
        "initialize_escrow",
        "refund_unclaimed",
        "submit_entry",
        "vote_winner",
      ]);
    });

    it("resolves the same PDAs from IDL seed metadata", async () => {
      const p = params();
      const keys = await program.methods.initializeEscrow(p).accounts({ organizer }).pubkeys();
      assert.ok(keys.escrow?.equals(findEscrowPda(programId, organizer, p.nonce)[0]));
      assert.ok(keys.vault?.equals(findVaultPda(programId, organizer, p.nonce)[0]));
    });
  });

  describe("initialize_escrow", () => {
    it("creates the escrow and funds the whole prize pool atomically", async () => {
      const p = params({
        judges: judges.slice(0, 3).map((j) => j.publicKey),
        prizeAmounts: [new BN(0.5 * SOL), new BN(0.2 * SOL), new BN(0.1 * SOL)],
      });
      const before = await balance(provider, organizer);
      main = await create(p);

      const escrow = await program.account.escrow.fetch(main.escrow);
      assert.ok(escrow.organizer.equals(organizer));
      assert.equal(escrow.nonce, p.nonce);
      assert.equal(escrow.voteThreshold, 2);
      assert.equal(escrow.title, p.title);
      assert.equal(escrow.metadataUri, p.metadataUri);
      assert.equal(escrow.judges.length, 3);
      assert.equal(escrow.submissionsDeadline.toNumber(), t0 + HOUR);
      assert.equal(escrow.deadline.toNumber(), t0 + 2 * HOUR);
      assert.equal(escrow.claimDeadline.toNumber(), t0 + 2 * HOUR + DAY);
      assert.ok(escrow.createdAt.toNumber() >= t0);
      assert.equal(escrow.bump, findEscrowPda(programId, organizer, p.nonce)[1]);
      assert.equal(escrow.vaultBump, findVaultPda(programId, organizer, p.nonce)[1]);
      assert.deepEqual(
        escrow.prizeTiers.map((t) => [t.amount.toNumber(), t.winner, t.claimed, t.refunded, t.votes.length]),
        [
          [0.5 * SOL, null, false, false, 0],
          [0.2 * SOL, null, false, false, 0],
          [0.1 * SOL, null, false, false, 0],
        ]
      );

      assert.equal(await balance(provider, main.vault), 0.8 * SOL);
      const spent = before - (await balance(provider, organizer));
      assert.ok(spent >= 0.8 * SOL, "organizer paid the pool");
      main.judges = judges.slice(0, 3);
    });

    it("lets one organizer run several bounties (one per nonce)", async () => {
      refundable = await create(
        params({ judges: [judges[3].publicKey], voteThreshold: 1, prizeAmounts: [new BN(0.1 * SOL), new BN(0.1 * SOL)] })
      );
      refundable.judges = [judges[3]];
      assert.ok(!refundable.escrow.equals(main.escrow));
    });

    it("rejects a nonce that is already used", async () => {
      const p = { ...params(), nonce: main.nonce };
      await assert.rejects(program.methods.initializeEscrow(p).accounts({ organizer }).rpc(), /already in use/);
    });

    it("accepts a 50-byte title and rejects an empty or 51-byte one", async () => {
      await create(params({ title: "é".repeat(25) })); // 50 bytes
      await expectError(create(params({ title: "" })), "InvalidTitle");
      await expectError(create(params({ title: "é".repeat(25) + "a" })), "InvalidTitle");
    });

    it("accepts an empty metadata URI and rejects one over 100 bytes", async () => {
      await create(params({ metadataUri: "" }));
      await expectError(create(params({ metadataUri: "a".repeat(101) })), "InvalidMetadataUri");
    });

    it("checks the judge list", async () => {
      await expectError(create(params({ judges: [], voteThreshold: 1 })), "InvalidJudgeCount");
      const six = [...judges.map((j) => j.publicKey), outsider.publicKey];
      await expectError(create(params({ judges: six, voteThreshold: 4 })), "InvalidJudgeCount");
      const dup = [judges[0].publicKey, judges[0].publicKey, judges[1].publicKey];
      await expectError(create(params({ judges: dup })), "DuplicateJudge");
      await expectError(create(params({ judges: [organizer, judges[0].publicKey, judges[1].publicKey] })), "OrganizerCannotBeJudge");
    });

    it("requires a strict-majority threshold", async () => {
      const two = judges.slice(0, 2).map((j) => j.publicKey);
      await expectError(create(params({ judges: two, voteThreshold: 1 })), "InvalidVoteThreshold");
      await expectError(create(params({ voteThreshold: 0 })), "InvalidVoteThreshold");
      await expectError(create(params({ judges: judges.slice(0, 3).map((j) => j.publicKey), voteThreshold: 4 })), "InvalidVoteThreshold");
      await create(params({ judges: two, voteThreshold: 2 }));
    });

    it("checks prize tiers, the minimum prize and overflow", async () => {
      await expectError(create(params({ prizeAmounts: [] })), "InvalidPrizeTierCount");
      await expectError(create(params({ prizeAmounts: Array(5).fill(new BN(MIN_PRIZE)) })), "InvalidPrizeTierCount");
      await expectError(create(params({ prizeAmounts: [new BN(MIN_PRIZE - 1)] })), "InvalidPrizeAmount");
      await create(params({ prizeAmounts: [new BN(MIN_PRIZE)] }));
      const max = new BN("18446744073709551615");
      await expectError(create(params({ prizeAmounts: [max, new BN(MIN_PRIZE)] })), "PrizePoolOverflow");
    });

    it("checks the deadline (future, at most 365 days)", async () => {
      const now = await chainNow(provider);
      await expectError(create(params({ submissionsDeadline: new BN(now - 10), deadline: new BN(now - 10) })), "InvalidDeadline");
      const far = now + 366 * DAY;
      await expectError(create(params({ deadline: new BN(far) })), "InvalidDeadline");
    });

    it("checks the entry deadline (future, not after the deadline)", async () => {
      await expectError(create(params({ submissionsDeadline: new BN(t0 + 3 * HOUR) })), "InvalidSubmissionsDeadline");
      await expectError(create(params({ submissionsDeadline: new BN(t0 - 10) })), "InvalidSubmissionsDeadline");
      await create(params({ submissionsDeadline: new BN(t0 + 2 * HOUR) })); // equal to the deadline is fine
    });

    it("checks the claim window (1 to 90 days)", async () => {
      await expectError(create(params({ claimWindow: new BN(DAY - 1) })), "InvalidClaimWindow");
      await expectError(create(params({ claimWindow: new BN(90 * DAY + 1) })), "InvalidClaimWindow");
      await create(params({ claimWindow: new BN(90 * DAY) }));
    });

    it("fails atomically when the organizer can't pay", async () => {
      const [poor] = await fundedKeypairs(provider, 1, 0.01 * SOL);
      const p = params({ prizeAmounts: [new BN(SOL)] });
      await assert.rejects(create(p, poor));
      const [escrow] = findEscrowPda(programId, poor.publicKey, p.nonce);
      assert.equal(await provider.connection.getAccountInfo(escrow), null);
    });

    it("tolerates lamports sent to the vault before creation", async () => {
      const p = params({ prizeAmounts: [new BN(0.1 * SOL)] });
      const [vault] = findVaultPda(programId, organizer, p.nonce);
      await provider.sendAndConfirm(
        new web3.Transaction().add(web3.SystemProgram.transfer({ fromPubkey: organizer, toPubkey: vault, lamports: 0.01 * SOL }))
      );
      await create(p);
      assert.equal(await balance(provider, vault), 0.11 * SOL);
    });
  });

  describe("submit_entry (before the entry deadline)", () => {
    it("records an entry", async () => {
      await submit(main, builders[0], "Pocketwatch", "https://example.com/pocketwatch", "Tracks balances.");
      const [pda, bump] = findSubmissionPda(programId, main.escrow, main.createdAt, builders[0].publicKey);
      const entry = await program.account.submission.fetch(pda);
      assert.ok(entry.escrow.equals(main.escrow));
      assert.equal(entry.escrowCreatedAt.toNumber(), main.createdAt);
      assert.ok(entry.submitter.equals(builders[0].publicKey));
      assert.equal(entry.title, "Pocketwatch");
      assert.equal(entry.url, "https://example.com/pocketwatch");
      assert.equal(entry.description, "Tracks balances.");
      assert.equal(entry.closeAfter.toNumber(), t0 + 2 * HOUR);
      assert.equal(entry.bump, bump);
    });

    it("lists a bounty's entries with one memcmp filter", async () => {
      await submit(main, builders[1], "SolLens");
      const entries = await program.account.submission.all([
        { memcmp: { offset: 8, bytes: main.escrow.toBase58() } },
      ]);
      assert.equal(entries.length, 2);
    });

    it("allows one entry per wallet", async () => {
      await assert.rejects(submit(main, builders[0]), /already in use/);
    });

    it("rejects the organizer and judges", async () => {
      await expectError(
        program.methods.submitEntry("Mine", "https://x.io", "").accountsPartial({ submitter: organizer, escrow: main.escrow }).rpc(),
        "OrganizerCannotSubmit"
      );
      await expectError(submit(main, main.judges[0]), "JudgeCannotSubmit");
    });

    it("checks the entry fields", async () => {
      await expectError(submit(main, builders[2], ""), "InvalidEntryTitle");
      await expectError(submit(main, builders[2], "a".repeat(51)), "InvalidEntryTitle");
      await expectError(submit(main, builders[2], "Ok", ""), "InvalidEntryUrl");
      await expectError(submit(main, builders[2], "Ok", "h".repeat(101)), "InvalidEntryUrl");
      await expectError(submit(main, builders[2], "Ok", "https://x.io", "d".repeat(281)), "InvalidEntryDescription");
      await submit(main, builders[2], "a".repeat(50), "h".repeat(100), "d".repeat(280));
    });

    it("can't be closed before the deadline", async () => {
      await expectError(closeEntry(main, builders[0]), "EntryLocked");
    });
  });

  describe("vote_winner (before the deadline)", () => {
    it("rejects the organizer and non-judges", async () => {
      await expectError(
        program.methods.voteWinner(0, builders[0].publicKey).accountsPartial({ judge: organizer, escrow: main.escrow }).rpc(),
        "OrganizerCannotVote"
      );
      await expectError(vote(main, outsider, 0, builders[0].publicKey), "UnauthorizedJudge");
      await expectError(vote(main, judges[4], 0, builders[0].publicKey), "UnauthorizedJudge");
    });

    it("rejects an out-of-range tier", async () => {
      await expectError(vote(main, main.judges[0], 3, builders[0].publicKey), "InvalidTier");
    });

    it("rejects invalid candidates (Q5)", async () => {
      const j = main.judges[0];
      for (const bad of [organizer, main.judges[1].publicKey, web3.PublicKey.default, main.escrow, main.vault]) {
        await expectError(vote(main, j, 0, bad), "InvalidCandidate");
      }
    });

    it("records a vote without finalizing below the threshold", async () => {
      await vote(main, main.judges[0], 0, builders[0].publicKey);
      const tier = (await program.account.escrow.fetch(main.escrow)).prizeTiers[0];
      assert.equal(tier.votes.length, 1);
      assert.ok(tier.votes[0].judge.equals(main.judges[0].publicKey));
      assert.ok(tier.votes[0].candidate.equals(builders[0].publicKey));
      assert.equal(tier.winner, null);
    });

    it("makes votes final (Q1)", async () => {
      await expectError(vote(main, main.judges[0], 0, builders[1].publicKey), "DuplicateVote");
    });

    it("finalizes the tier when a candidate reaches the threshold", async () => {
      await vote(main, main.judges[1], 0, builders[0].publicKey);
      const tier = (await program.account.escrow.fetch(main.escrow)).prizeTiers[0];
      assert.ok(tier.winner?.equals(builders[0].publicKey));
    });

    it("rejects votes on a finalized tier", async () => {
      await expectError(vote(main, main.judges[2], 0, builders[1].publicKey), "TierAlreadyFinalized");
    });

    it("lets one candidate win several tiers (Q4), and any wallet be voted for", async () => {
      await vote(main, main.judges[0], 1, builders[0].publicKey);
      await vote(main, main.judges[2], 1, builders[0].publicKey);
      // tier 2: a wallet that never submitted an entry
      await vote(main, main.judges[0], 2, outsider.publicKey);
      await vote(main, main.judges[1], 2, outsider.publicKey);
      const tiers = (await program.account.escrow.fetch(main.escrow)).prizeTiers;
      assert.ok(tiers[1].winner?.equals(builders[0].publicKey));
      assert.ok(tiers[2].winner?.equals(outsider.publicKey));
    });

    it("picks a winner on the refundable bounty's first tier only", async () => {
      await vote(refundable, refundable.judges[0], 0, builders[3].publicKey);
    });
  });

  describe("claim_prize", () => {
    it("rejects claims on an undecided tier", async () => {
      await expectError(claim(refundable, builders[3], 1), "TierNotFinalized");
    });

    it("rejects anyone but the winner", async () => {
      await expectError(claim(main, builders[1], 0), "NotWinner");
    });

    it("pays the winner, before the deadline too", async () => {
      const before = await balance(provider, builders[0].publicKey);
      await claim(main, builders[0], 0);
      const after = await balance(provider, builders[0].publicKey);
      assert.ok(after - before > 0.5 * SOL - 10_000, "winner got the prize minus at most a fee");
      assert.equal(await balance(provider, main.vault), 0.3 * SOL);
      const tier = (await program.account.escrow.fetch(main.escrow)).prizeTiers[0];
      assert.equal(tier.claimed, true);
    });

    it("rejects a second claim", async () => {
      await expectError(claim(main, builders[0], 0), "PrizeAlreadyClaimed");
    });

    it("can't be blocked by the organizer handing their wallet to another program", async () => {
      // A wallet can reassign itself to any program. If claims required the
      // organizer to be system-owned, an organizer could do this to make every
      // claim fail, wait out the claim window and refund the prizes.
      const [rogue] = await fundedKeypairs(provider, 1, 0.1 * SOL);
      const b = await create(params({ judges: [judges[0].publicKey], voteThreshold: 1, prizeAmounts: [new BN(0.01 * SOL)] }), rogue);
      await vote(b, judges[0], 0, outsider.publicKey);
      const theirProgram = web3.Keypair.generate().publicKey;
      await provider.sendAndConfirm(
        new web3.Transaction().add(web3.SystemProgram.assign({ accountPubkey: rogue.publicKey, programId: theirProgram })),
        [rogue]
      );

      const escrowRent = await balance(provider, b.escrow);
      const before = await balance(provider, rogue.publicKey);
      await program.methods
        .claimPrize(0)
        .accountsPartial({ winner: outsider.publicKey, escrow: b.escrow, vault: b.vault, organizer: rogue.publicKey })
        .preInstructions([unique()])
        .signers([outsider])
        .rpc();
      assert.equal(await provider.connection.getAccountInfo(b.escrow), null);
      assert.equal((await balance(provider, rogue.publicKey)) - before, escrowRent, "escrow rent still goes to the organizer");
    });
  });

  describe("refund_unclaimed (before the deadline)", () => {
    it("is only for the organizer", async () => {
      await expectError(
        program.methods
          .refundUnclaimed(1)
          .accountsPartial({ organizer: outsider.publicKey, escrow: refundable.escrow, vault: refundable.vault })
          .signers([outsider])
          .rpc(),
        "UnauthorizedOrganizer"
      );
    });

    it("is never possible before the deadline (Q9)", async () => {
      await expectError(refund(refundable, 1), "DeadlineNotReached");
    });
  });

  describe("after the entry deadline", () => {
    before(async function () {
      timeTravel = await warpTo(provider, t0 + HOUR + 10);
      if (!timeTravel) this.skip();
    });

    it("closes entries", async () => {
      await expectError(submit(main, builders[3]), "SubmissionsClosed");
    });
  });

  describe("after the deadline", () => {
    before(async function () {
      if (!timeTravel || !(await warpTo(provider, t0 + 2 * HOUR + 10))) this.skip();
    });

    it("closes voting (Q2)", async () => {
      await expectError(vote(refundable, refundable.judges[0], 1, builders[2].publicKey), "VotingClosed");
    });

    it("lets winners still claim inside the claim window (Q3 revised)", async () => {
      await claim(main, builders[0], 1);
    });

    it("refunds a tier that never got a winner", async () => {
      const before = await balance(provider, organizer);
      await refund(refundable, 1);
      const after = await balance(provider, organizer);
      assert.ok(after - before > 0.1 * SOL - 10_000);
      const tier = (await program.account.escrow.fetch(refundable.escrow)).prizeTiers[1];
      assert.equal(tier.refunded, true);
    });

    it("rejects refunding the same tier twice", async () => {
      await expectError(refund(refundable, 1), "RefundNotEligible");
    });

    it("keeps an unclaimed winner's prize during the claim window", async () => {
      await expectError(refund(refundable, 0), "ClaimWindowOpen");
    });

    it("rejects refunding a claimed tier", async () => {
      await expectError(refund(main, 0), "RefundNotEligible");
    });

    it("lets builders close their entries and get the rent back", async () => {
      const [pda] = findSubmissionPda(programId, main.escrow, main.createdAt, builders[1].publicKey);
      const rent = await balance(provider, pda);
      const before = await balance(provider, builders[1].publicKey);
      await closeEntry(main, builders[1]);
      assert.equal(await provider.connection.getAccountInfo(pda), null);
      assert.ok((await balance(provider, builders[1].publicKey)) - before > rent - 10_000);
    });

    it("closes the escrow when the last tier is claimed, returning rent to the organizer", async () => {
      const escrowRent = await balance(provider, main.escrow);
      const before = await balance(provider, organizer);
      await claim(main, outsider, 2);
      assert.equal(await provider.connection.getAccountInfo(main.escrow), null);
      assert.equal(await balance(provider, main.vault), 0);
      const gained = (await balance(provider, organizer)) - before;
      assert.ok(gained <= escrowRent && gained > escrowRent - 20_000, "escrow rent minus the fee the organizer's wallet paid");
    });

    it("lets entries close after the escrow has closed", async () => {
      await closeEntry(main, builders[0]);
    });

    it("keeps old entries out of a new bounty at a reused address", async () => {
      // main is closed; builders[2] never closed their entry. Reuse main's nonce.
      const now = await chainNow(provider);
      const p = params({ submissionsDeadline: new BN(now + HOUR), deadline: new BN(now + 2 * HOUR) });
      const again = await create({ ...p, nonce: main.nonce });
      assert.ok(again.escrow.equals(main.escrow));
      assert.notEqual(again.createdAt, main.createdAt);

      await submit(again, builders[2], "Second try"); // not blocked by the old entry
      const byEscrow = [{ memcmp: { offset: 8, bytes: again.escrow.toBase58() } }];
      const createdAt = Buffer.alloc(8);
      createdAt.writeBigInt64LE(BigInt(again.createdAt));
      const current = await program.account.submission.all([
        ...byEscrow,
        { memcmp: { offset: 40, bytes: anchor.utils.bytes.bs58.encode(createdAt) } },
      ]);
      assert.equal((await program.account.submission.all(byEscrow)).length, 2);
      assert.equal(current.length, 1);
      assert.equal(current[0].account.title, "Second try");
    });
  });

  describe("after the claim window", () => {
    before(async function () {
      if (!timeTravel || !(await warpTo(provider, t0 + 2 * HOUR + DAY + 10))) this.skip();
    });

    it("stops late claims", async () => {
      await expectError(claim(refundable, builders[3], 0), "ClaimWindowClosed");
    });

    it("refunds the unclaimed winner's prize and closes the escrow", async () => {
      await refund(refundable, 0);
      assert.equal(await provider.connection.getAccountInfo(refundable.escrow), null);
      assert.equal(await balance(provider, refundable.vault), 0);
    });

    it("refunds every tier of an untouched bounty in one transaction, sweeping pre-funded lamports", async () => {
      const b = await create(
        params({
          submissionsDeadline: new BN((await chainNow(provider)) + 60),
          deadline: new BN((await chainNow(provider)) + 60),
          prizeAmounts: [new BN(0.01 * SOL), new BN(0.01 * SOL)],
        })
      );
      await provider.sendAndConfirm(
        new web3.Transaction().add(web3.SystemProgram.transfer({ fromPubkey: organizer, toPubkey: b.vault, lamports: 0.005 * SOL }))
      );
      await warpTo(provider, (await chainNow(provider)) + 120);
      await refund(b, 0, 1);
      assert.equal(await provider.connection.getAccountInfo(b.escrow), null);
      assert.equal(await balance(provider, b.vault), 0);
    });
  });
});
