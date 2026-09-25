#!/usr/bin/env bash
# Runs `anchor test` on a local Surfpool network that funds only the
# OpenBounty wallet.
#
# Plain `anchor test` starts Surfpool with its default airdrop keypair,
# ~/.config/solana/id.json, which belongs to another project, and makes that
# key the program's local upgrade authority. Anchor 1.2.0 has no setting to
# change this, so this script starts Surfpool itself with the OpenBounty wallet
# and lets Anchor deploy with that same wallet.
#
# Usage: yarn test [extra `anchor test` args]
set -euo pipefail

cd "$(dirname "$0")/.."

wallet="${OPENBOUNTY_WALLET:-$HOME/.config/openbounty/keys/deployer.json}"
rpc_url="http://127.0.0.1:8899"

if [[ ! -f "$wallet" ]]; then
  echo "error: OpenBounty wallet not found at $wallet (see README \"Keys and wallets\")" >&2
  exit 1
fi

rpc_healthy() {
  curl -sf -X POST -H 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' "$rpc_url" | grep -q '"ok"'
}

if rpc_healthy; then
  echo "error: a validator is already running on $rpc_url; stop it first" >&2
  exit 1
fi

log="$(mktemp)"
surfpool start --offline --no-deploy --no-tui --no-studio --log-level none \
  --airdrop-keypair-path "$wallet" >"$log" 2>&1 &
surfpool_pid=$!
trap 'kill "$surfpool_pid" 2>/dev/null || true; rm -f "$log"' EXIT

for _ in $(seq 1 60); do
  rpc_healthy && break
  if ! kill -0 "$surfpool_pid" 2>/dev/null; then
    echo "error: surfpool exited during startup:" >&2
    cat "$log" >&2
    exit 1
  fi
  sleep 0.5
done
if ! rpc_healthy; then
  echo "error: surfpool did not become healthy on $rpc_url" >&2
  cat "$log" >&2
  exit 1
fi

OPENBOUNTY_TEST_ISOLATED=1 anchor test --skip-local-validator --provider.wallet "$wallet" "$@"
