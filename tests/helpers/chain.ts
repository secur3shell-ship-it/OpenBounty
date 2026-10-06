import * as anchor from "@anchor-lang/core";
import { AnchorProvider, web3 } from "@anchor-lang/core";
import assert from "node:assert/strict";

/** The network's clock (Clock sysvar `unix_timestamp`), in seconds. */
export async function chainNow(provider: AnchorProvider): Promise<number> {
  const info = await provider.connection.getAccountInfo(web3.SYSVAR_CLOCK_PUBKEY);
  assert.ok(info, "clock sysvar missing");
  // slot u64, epoch_start_timestamp i64, epoch u64, leader_schedule_epoch u64, unix_timestamp i64
  return Number(info.data.readBigInt64LE(32));
}

/**
 * Moves the network clock forward to `unixSeconds` with Surfpool's
 * `surfnet_timeTravel` cheatcode. Returns false on a validator without the
 * cheatcode (the legacy solana-test-validator), so callers can skip.
 */
export async function warpTo(provider: AnchorProvider, unixSeconds: number): Promise<boolean> {
  const endpoint = provider.connection.rpcEndpoint;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "surfnet_timeTravel",
      params: [{ absoluteTimestamp: unixSeconds * 1000 }],
    }),
  });
  const body = (await res.json()) as { error?: unknown };
  if (body.error) return false;

  // Wait until the clock sysvar reflects the jump.
  for (let i = 0; i < 50; i++) {
    if ((await chainNow(provider)) >= unixSeconds) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`clock did not reach ${unixSeconds}; now ${await chainNow(provider)}`);
}

/** Funds fresh keypairs from the provider wallet. */
export async function fundedKeypairs(
  provider: AnchorProvider,
  count: number,
  lamports = web3.LAMPORTS_PER_SOL
): Promise<web3.Keypair[]> {
  const keys = Array.from({ length: count }, () => web3.Keypair.generate());
  const tx = new web3.Transaction();
  for (const key of keys) {
    tx.add(
      web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: key.publicKey,
        lamports,
      })
    );
  }
  await provider.sendAndConfirm(tx);
  return keys;
}

/** Asserts that `promise` fails with the program error named `code`. */
export async function expectError(promise: Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(promise, (err: unknown) => {
    if (err instanceof anchor.AnchorError) {
      assert.equal(err.error.errorCode.code, code);
      return true;
    }
    const logs = (err as { logs?: string[] }).logs ?? [];
    const text = `${String(err)}\n${logs.join("\n")}`;
    assert.ok(text.includes(code), `expected ${code}, got: ${text}`);
    return true;
  });
}

export async function balance(provider: AnchorProvider, key: web3.PublicKey): Promise<number> {
  return provider.connection.getBalance(key);
}
