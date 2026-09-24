use anchor_lang::prelude::*;

use crate::{constants::*, error::OpenBountyError, state::Escrow};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct InitializeEscrowParams {
    pub nonce: u8,
    pub title: String,
    pub metadata_uri: String,
    pub judges: Vec<Pubkey>,
    pub vote_threshold: u8,
    /// One entry per prize tier, in lamports. The vault is funded with their
    /// sum in this same instruction.
    pub prize_amounts: Vec<u64>,
    /// Unix timestamp (seconds).
    pub deadline: i64,
}

#[derive(Accounts)]
#[instruction(params: InitializeEscrowParams)]
pub struct InitializeEscrow<'info> {
    /// Creates the escrow and funds the complete prize pool.
    #[account(mut)]
    pub organizer: Signer<'info>,

    #[account(
        init,
        payer = organizer,
        space = Escrow::SPACE,
        seeds = [ESCROW_SEED, organizer.key().as_ref(), params.nonce.to_le_bytes().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, Escrow>,

    /// Program-controlled, data-less system account holding the prize pool.
    #[account(
        mut,
        seeds = [VAULT_SEED, organizer.key().as_ref(), params.nonce.to_le_bytes().as_ref()],
        bump,
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_escrow(
    _ctx: Context<InitializeEscrow>,
    _params: InitializeEscrowParams,
) -> Result<()> {
    // TODO(initialize_escrow): implement. Initialization and funding are one
    // atomic step; there is no separate funding instruction.
    //  - Validate params against the protocol limits in `constants`: title
    //    and URI byte lengths, 1..=MAX_JUDGES unique judges excluding the
    //    organizer, 1 <= vote_threshold <= judges.len(), 1..=MAX_PRIZE_TIERS
    //    non-zero amounts with a checked sum, deadline > Clock::unix_timestamp.
    //  - Write escrow state, including both bumps.
    //  - Transfer the full prize pool from organizer to vault (system program
    //    CPI) and check that the vault balance grew by exactly that amount.
    //  - Vault rent: a system account can't be left holding 0 < lamports <
    //    rent-exempt minimum, so a partial payout could fail. Decide how
    //    the vault stays rent-exempt until final cleanup (e.g. the organizer
    //    also deposits the reserve and gets it back at cleanup).
    //  - Tolerate lamports sent to the vault address before initialization,
    //    so nobody can block a nonce by pre-funding it. Pay out by tier
    //    amounts, not by the raw vault balance.
    err!(OpenBountyError::NotImplemented)
}
