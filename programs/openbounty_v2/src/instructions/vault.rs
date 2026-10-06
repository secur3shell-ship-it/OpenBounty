//! Moving lamports out of the vault, and closing a settled escrow. Shared by
//! `claim_prize` and `refund_unclaimed`.

use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{constants::*, events::EscrowClosed, state::Escrow};

/// Transfers `amount` from the vault PDA, which the program signs for.
pub fn pay_from_vault<'info>(
    escrow: &Account<'info, Escrow>,
    vault: &SystemAccount<'info>,
    to: AccountInfo<'info>,
    system_program: &Program<'info, System>,
    amount: u64,
) -> Result<()> {
    let nonce = [escrow.nonce];
    let seeds: &[&[u8]] = &[VAULT_SEED, escrow.organizer.as_ref(), &nonce, &[escrow.vault_bump]];
    transfer(
        CpiContext::new_with_signer(
            system_program.key(),
            Transfer {
                from: vault.to_account_info(),
                to,
            },
            &[seeds],
        ),
        amount,
    )
}

/// Once every tier is claimed or refunded: sweeps whatever is left in the
/// vault (only lamports someone sent there on their own) to the organizer,
/// and closes the escrow, returning its rent to the organizer.
pub fn close_if_settled<'info>(
    escrow: &mut Account<'info, Escrow>,
    vault: &SystemAccount<'info>,
    organizer: AccountInfo<'info>,
    system_program: &Program<'info, System>,
) -> Result<()> {
    if !escrow.is_settled() {
        return Ok(());
    }

    let remainder = vault.lamports();
    if remainder > 0 {
        pay_from_vault(escrow, vault, organizer.clone(), system_program, remainder)?;
    }

    emit!(EscrowClosed { escrow: escrow.key() });
    escrow.close(organizer)
}
