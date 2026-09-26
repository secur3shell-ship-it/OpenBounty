'use client';

import { useEffect, useState } from 'react';
import { address as toAddress, type Address } from '@solana/kit';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { rolesFor } from '@/domain/roles';
import { tierStatus, tierWinner, voteCounts } from '@/domain/tier';
import { client } from '@/lib/client';
import { describeError } from '@/lib/errors';
import { explorerAddressUrl, formatSol, formatUnixTime, shortAddress } from '@/lib/format';
import { fetchEscrowOrNull, type EscrowRow } from '@/lib/queries';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'missing' }
  | { kind: 'ready'; row: EscrowRow };

/**
 * One bounty, read from the chain. A starting point: the action panels
 * (vote / claim / refund) come next, using src/lib/instructions.ts and the
 * checks in src/domain/validation.ts.
 */
export function BountyDetail({ escrowAddress }: { escrowAddress: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const connected = useConnectedWallet(client);
  const wallet = connected ? (connected.account.address as Address) : null;

  useEffect(() => {
    let live = true;
    fetchEscrowOrNull(toAddress(escrowAddress))
      .then((row) => {
        if (live) setState(row ? { kind: 'ready', row } : { kind: 'missing' });
      })
      .catch((err: unknown) => {
        if (live) setState({ kind: 'error', message: describeError(err) });
      });
    return () => {
      live = false;
    };
  }, [escrowAddress]);

  if (state.kind === 'loading') return <p>Loading bounty…</p>;
  if (state.kind === 'error') return <p>Couldn&apos;t load this bounty: {state.message}</p>;
  if (state.kind === 'missing') {
    return <p>No bounty at this address. It may never have existed, or it was closed after every prize was settled.</p>;
  }

  const { data } = state.row;
  const roles = rolesFor(data, wallet);

  return (
    <article className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{data.title}</h1>
        <p className="text-sm text-zinc-500">
          Organizer <span className="font-mono">{shortAddress(data.organizer)}</span> · deadline{' '}
          {formatUnixTime(data.deadline)} · {data.voteThreshold} of {data.judges.length} judge votes decide a prize ·{' '}
          <a className="underline" href={explorerAddressUrl(escrowAddress)} target="_blank" rel="noreferrer">
            view on explorer
          </a>
        </p>
        {data.metadataUri && (
          <p className="text-sm">
            Details (off-chain, unverified):{' '}
            {/^https:\/\//i.test(data.metadataUri) ? (
              <a className="underline" href={data.metadataUri} target="_blank" rel="noreferrer noopener">
                {data.metadataUri}
              </a>
            ) : (
              // Anything that isn't a plain https link is shown as text, never as a link.
              <span className="font-mono">{data.metadataUri}</span>
            )}
          </p>
        )}
        {wallet && (
          <p className="text-sm">
            You: {roles.isOrganizer ? 'organizer' : roles.isJudge ? 'judge' : 'visitor'}
            {roles.wonTiers.length > 0 && ` · winner of prize ${roles.wonTiers.map((i) => i + 1).join(', ')}`}
          </p>
        )}
      </header>

      <section>
        <h2 className="font-semibold">Prizes</h2>
        <ul className="flex flex-col gap-2">
          {data.prizeTiers.map((tier, index) => {
            const winner = tierWinner(tier);
            return (
              <li key={index} className="rounded border p-3 text-sm">
                <div className="font-semibold">
                  Prize {index + 1}: {formatSol(tier.amount)} · {tierStatus(tier)}
                </div>
                {winner && (
                  <div>
                    Winner: <span className="font-mono">{shortAddress(winner)}</span>
                  </div>
                )}
                {[...voteCounts(tier)].map(([candidate, count]) => (
                  <div key={candidate}>
                    <span className="font-mono">{shortAddress(candidate)}</span>: {count} of {data.voteThreshold} votes
                  </div>
                ))}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold">Judges</h2>
        <ul className="font-mono text-sm">
          {data.judges.map((judge) => (
            <li key={judge}>{judge}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
