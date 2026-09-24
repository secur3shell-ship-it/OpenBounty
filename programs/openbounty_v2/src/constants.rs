//! Protocol constants. Every protocol limit and PDA seed lives here so it can
//! be changed in one place.
//!
//! The limits are `usize` because `#[max_len]` account sizing needs them in
//! `usize` arithmetic. `#[constant]` can't export `usize` to the IDL, so only
//! the seeds appear there.

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
