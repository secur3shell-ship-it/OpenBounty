use anchor_lang::prelude::*;

use crate::constants::*;

/// A funded bounty. PDA: `["escrow", organizer, nonce]`.
///
/// An `Escrow` only ever exists fully funded: it is created in the same
/// instruction that moves the whole prize pool into the vault.
///
/// There are no stored role flags. Roles are derived from this account at
/// instruction time: the organizer is `organizer`, a judge is any key in
/// `judges`, and a winner is `prize_tiers[i].winner` for a finalized tier.
///
/// Layout: fixed-size fields come first so `organizer` sits at a stable
/// offset (8, right after the discriminator) for `getProgramAccounts` filters.
#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub organizer: Pubkey,
    /// Lets one organizer run several concurrent escrows.
    pub nonce: u8,
    pub bump: u8,
    pub vault_bump: u8,
    /// Votes for the same candidate on a tier needed to finalize it.
    pub vote_threshold: u8,
    /// Unix timestamp (seconds) after which the organizer may reclaim
    /// eligible unclaimed prizes.
    pub deadline: i64,
    #[max_len(MAX_TITLE_LENGTH)]
    pub title: String,
    #[max_len(MAX_METADATA_URI_LENGTH)]
    pub metadata_uri: String,
    #[max_len(MAX_JUDGES)]
    pub judges: Vec<Pubkey>,
    #[max_len(MAX_PRIZE_TIERS)]
    pub prize_tiers: Vec<PrizeTier>,
}

impl Escrow {
    /// Full account size, including the 8-byte discriminator.
    pub const SPACE: usize = Escrow::DISCRIMINATOR.len() + Escrow::INIT_SPACE;

    pub fn is_judge(&self, key: &Pubkey) -> bool {
        self.judges.contains(key)
    }
}

// `init` allocates through a system program CPI, which is capped at 10 KiB.
// Raising a protocol limit past that breaks the build instead of escrow
// creation.
const _: () = assert!(Escrow::SPACE <= 10_240);

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq, InitSpace)]
pub struct PrizeTier {
    /// Lamports paid to this tier's winner.
    pub amount: u64,
    /// Set by the program when a candidate reaches `vote_threshold`.
    pub winner: Option<Pubkey>,
    pub claimed: bool,
    /// Set when the organizer reclaims this tier's amount after the deadline.
    pub refunded: bool,
    #[max_len(MAX_JUDGES)]
    pub votes: Vec<Vote>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq, InitSpace)]
pub struct Vote {
    pub judge: Pubkey,
    pub candidate: Pubkey,
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Account size is fixed at creation (no realloc), so it must hold the
    /// worst case for every protocol limit.
    #[test]
    fn escrow_space_covers_protocol_limits() {
        let vote = 32 + 32;
        let tier = 8 + (1 + 32) + 1 + 1 + (4 + MAX_JUDGES * vote);
        let expected = 32 // organizer
            + 1 + 1 + 1 + 1 // nonce, bump, vault_bump, vote_threshold
            + 8 // deadline
            + (4 + MAX_TITLE_LENGTH)
            + (4 + MAX_METADATA_URI_LENGTH)
            + (4 + MAX_JUDGES * 32)
            + (4 + MAX_PRIZE_TIERS * tier);

        assert_eq!(Vote::INIT_SPACE, vote);
        assert_eq!(PrizeTier::INIT_SPACE, tier);
        assert_eq!(Escrow::INIT_SPACE, expected);
        assert_eq!(Escrow::SPACE, 8 + expected);
    }

    #[test]
    fn worst_case_escrow_serializes_within_space() {
        let key = Pubkey::new_unique;
        let escrow = Escrow {
            organizer: key(),
            nonce: u8::MAX,
            bump: u8::MAX,
            vault_bump: u8::MAX,
            vote_threshold: MAX_JUDGES as u8,
            deadline: i64::MAX,
            title: "t".repeat(MAX_TITLE_LENGTH),
            metadata_uri: "u".repeat(MAX_METADATA_URI_LENGTH),
            judges: (0..MAX_JUDGES).map(|_| key()).collect(),
            prize_tiers: (0..MAX_PRIZE_TIERS)
                .map(|_| PrizeTier {
                    amount: u64::MAX,
                    winner: Some(key()),
                    claimed: true,
                    refunded: false,
                    votes: (0..MAX_JUDGES)
                        .map(|_| Vote {
                            judge: key(),
                            candidate: key(),
                        })
                        .collect(),
                })
                .collect(),
        };

        let mut bytes = Vec::new();
        escrow.serialize(&mut bytes).unwrap();
        assert_eq!(bytes.len(), Escrow::INIT_SPACE);
    }
}
