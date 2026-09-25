//! Protocol constants. Every protocol limit and PDA seed lives here so it can
//! be changed in one place.
//!
//! The size limits are `usize` because `#[max_len]` account sizing needs them
//! in `usize` arithmetic. `#[constant]` can't export `usize` to the IDL, so
//! only the seeds and `MIN_PRIZE_AMOUNT` appear there.

use anchor_lang::prelude::*;

/// Escrow PDA seed prefix: `["escrow", organizer, nonce]`.
#[constant]
pub const ESCROW_SEED: &[u8] = b"escrow";

/// Vault PDA seed prefix: `["vault", organizer, nonce]`.
#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

/// Maximum number of judges per escrow.
pub const MAX_JUDGES: usize = 5;

/// Maximum number of prize tiers per escrow.
pub const MAX_PRIZE_TIERS: usize = 4;

/// Maximum title length, in bytes (UTF-8).
pub const MAX_TITLE_LENGTH: usize = 50;

/// Maximum metadata URI length, in bytes (UTF-8).
pub const MAX_METADATA_URI_LENGTH: usize = 100;

/// Minimum prize per tier, in lamports (0.001 SOL). Tiers must also be at
/// least the rent-exempt minimum for a data-less account, so a payout can
/// never fail because the recipient would be left below rent exemption.
#[constant]
pub const MIN_PRIZE_AMOUNT: u64 = 1_000_000;
