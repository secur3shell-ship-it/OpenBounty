'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { describeError } from '@/lib/errors';
import { formatSol, formatUnixTime, shortAddress } from '@/lib/format';
import { listAllEscrows, type EscrowRow } from '@/lib/queries';

type State = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; rows: EscrowRow[] };

/** Every bounty on devnet, read straight from the chain. */
export function BountyList() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let live = true;
    listAllEscrows()
      .then((rows) => {
        if (live) setState({ kind: 'ready', rows });
      })
      .catch((err: unknown) => {
        if (live) setState({ kind: 'error', message: describeError(err) });
      });
    return () => {
      live = false;
    };
  }, []);

  if (state.kind === 'loading') return <p>Loading bounties…</p>;
  if (state.kind === 'error') return <p>Couldn&apos;t load bounties: {state.message}</p>;
  if (state.rows.length === 0) return <p>No bounties yet.</p>;

  return (
    <ul className="flex flex-col gap-2">
      {state.rows.map(({ address, data }) => {
        const pool = data.prizeTiers.reduce((sum, tier) => sum + tier.amount, 0n);
        return (
          <li key={address} className="rounded border p-3">
            <Link href={`/bounty/${address}`} className="font-semibold underline">
              {data.title}
            </Link>
            <div className="text-sm text-zinc-500">
              {formatSol(pool)} in {data.prizeTiers.length} prize(s) · organizer{' '}
              <span className="font-mono">{shortAddress(data.organizer)}</span> · deadline {formatUnixTime(data.deadline)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
