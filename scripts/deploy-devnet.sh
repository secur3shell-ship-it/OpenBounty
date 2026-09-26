#!/usr/bin/env bash
# Deploys openbounty_v2 to devnet, or upgrades it in place if it's already
# there, signed by the OpenBounty deployer (the upgrade authority).
#
# The RPC URL comes from ~/.config/openbounty/solana-cli.yml, a private devnet
# endpoint kept outside the repo so its API key is never committed. Without
# that file it falls back to the public https://api.devnet.solana.com.
#
# Usage: yarn deploy:devnet [extra `anchor program deploy` args]
set -euo pipefail

cd "$(dirname "$0")/.."

config="${OPENBOUNTY_SOLANA_CONFIG:-$HOME/.config/openbounty/solana-cli.yml}"
wallet="${OPENBOUNTY_WALLET:-$HOME/.config/openbounty/keys/deployer.json}"

rpc_url="https://api.devnet.solana.com"
if [[ -f "$config" ]]; then
  rpc_url="$(awk '/^json_rpc_url:/ {print $2}' "$config")"
fi

# Guard against deploying anywhere but devnet by mistake.
case "$rpc_url" in
  *devnet*) ;;
  *)
    echo "error: $config points at ${rpc_url%%\?*}, which isn't a devnet endpoint" >&2
    exit 1
    ;;
esac

if [[ ! -f "$wallet" ]]; then
  echo "error: OpenBounty wallet not found at $wallet (see README \"Keys and wallets\")" >&2
  exit 1
fi

# Print the endpoint without its API key.
echo "Devnet RPC: ${rpc_url%%\?*}"
echo "Upgrade authority: $(solana-keygen pubkey "$wallet")"

anchor program deploy --provider.cluster "$rpc_url" --provider.wallet "$wallet" "$@"
