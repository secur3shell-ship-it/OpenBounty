//! Protocol constants. Every protocol limit and PDA seed lives here so it can
//! be changed in one place.
//!
//! The size limits are `usize` because `#[max_len]` account sizing needs them
//! in `usize` arithmetic. `#[constant]` can't export `usize` to the IDL, so
//! only the seeds and the `u64`/`i64` limits appear there.

use anchor_lang::prelude::*;

/// Escrow PDA seed prefix: `["escrow", organizer, nonce]`.
#[constant]
pub const ESCROW_SEED: &[u8] = b"escrow";

/// Vault PDA seed prefix: `["vault", organizer, nonce]`.
#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

/// Submission PDA seed prefix: `["submission", escrow, escrow.created_at, submitter]`.
#[constant]
pub const SUBMISSION_SEED: &[u8] = b"submission";

/// Maximum number of judges per escrow.
pub const MAX_JUDGES: usize = 5;

/// Maximum number of prize tiers per escrow.
pub const MAX_PRIZE_TIERS: usize = 4;

/// Maximum title length, in bytes (UTF-8).
pub const MAX_TITLE_LENGTH: usize = 50;

/// Maximum metadata URI length, in bytes (UTF-8).
pub const MAX_METADATA_URI_LENGTH: usize = 100;

/// Maximum entry project name length, in bytes (UTF-8).
pub const MAX_ENTRY_TITLE_LENGTH: usize = 50;

/// Maximum entry link length, in bytes (UTF-8).
pub const MAX_ENTRY_URL_LENGTH: usize = 100;

/// Maximum entry description length, in bytes (UTF-8).
pub const MAX_ENTRY_DESCRIPTION_LENGTH: usize = 280;

/// Minimum prize per tier, in lamports (0.001 SOL). Tiers must also be at
/// least the rent-exempt minimum for a data-less account, so a payout can
/// never fail because the recipient would be left below rent exemption.
#[constant]
pub const MIN_PRIZE_AMOUNT: u64 = 1_000_000;

/// The deadline may be at most this far in the future (Q14), in seconds.
#[constant]
pub const MAX_DEADLINE_AHEAD: i64 = 365 * 24 * 60 * 60;

/// Shortest claim window the organizer may set, in seconds (1 day).
#[constant]
pub const MIN_CLAIM_WINDOW: i64 = 24 * 60 * 60;

/// Longest claim window the organizer may set, in seconds (90 days).
#[constant]
pub const MAX_CLAIM_WINDOW: i64 = 90 * 24 * 60 * 60;
