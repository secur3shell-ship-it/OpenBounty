import type { Address } from '@solana/kit';
import { fetchSysvarClock } from '@solana/sysvars';
import { client } from '@/lib/client';

/** Network time in unix seconds. Use this, not Date.now(), for deadline checks. */
export async function networkNow(): Promise<bigint> {
  const clock = await fetchSysvarClock(client.rpc);
  return clock.unixTimestamp;
}

/** Wallet balance in lamports. */
export async function getBalanceLamports(address: Address): Promise<bigint> {
  const { value } = await client.rpc.getBalance(address).send();
  return value;
}

/** Rent-exempt minimum for an account of `space` bytes (0 = an empty account). Always ask; never hard-code. */
export async function getRentMinimum(space: number): Promise<bigint> {
  return client.getMinimumBalance(space);
}
