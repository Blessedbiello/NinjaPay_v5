use anchor_lang::prelude::*;

declare_id!("FKsek5byvQ7fMTD9atN55gAxytrWecci57chsjuYNFPP");

/// Lightweight NinjaPay Vault for encrypted payment data
///
/// This program stores encrypted payment balances and metadata.
/// Actual MPC computations are handled off-chain by the Arcium service.
/// This keeps the on-chain program simple and avoids dependency conflicts.
#[program]
pub mod ninjapay_vault_lite {
    use super::*;

    /// Initialize a vault for a merchant
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.owner.key();
        vault.encrypted_balance = Vec::new();
        vault.last_updated = Clock::get()?.unix_timestamp;
        vault.bump = ctx.bumps.vault;

        msg!("Vault initialized for {}", vault.owner);
        Ok(())
    }

    /// Update encrypted balance (called by Arcium service after MPC computation)
    pub fn update_balance(
        ctx: Context<UpdateBalance>,
        encrypted_balance: Vec<u8>,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        require!(
            encrypted_balance.len() <= MAX_ENCRYPTED_SIZE,
            VaultError::DataTooLarge
        );

        vault.encrypted_balance = encrypted_balance;
        vault.last_updated = Clock::get()?.unix_timestamp;

        msg!("Balance updated for {}", vault.owner);
        Ok(())
    }

    /// Record a payment intent (for audit trail)
    pub fn record_payment(
        ctx: Context<RecordPayment>,
        payment_id: String,
        encrypted_amount: Vec<u8>,
        recipient: Pubkey,
    ) -> Result<()> {
        let payment = &mut ctx.accounts.payment;

        require!(
            payment_id.len() <= MAX_ID_LENGTH,
            VaultError::IdTooLong
        );

        require!(
            encrypted_amount.len() <= MAX_ENCRYPTED_SIZE,
            VaultError::DataTooLarge
        );

        payment.vault = ctx.accounts.vault.key();
        payment.payment_id = payment_id;
        payment.encrypted_amount = encrypted_amount;
        payment.recipient = recipient;
        payment.timestamp = Clock::get()?.unix_timestamp;
        payment.status = PaymentStatus::Pending;
        payment.bump = ctx.bumps.payment;

        msg!("Payment recorded: {}", payment.payment_id);
        Ok(())
    }

    /// Finalize a payment (called after MPC computation completes)
    pub fn finalize_payment(
        ctx: Context<FinalizePayment>,
        success: bool,
    ) -> Result<()> {
        let payment = &mut ctx.accounts.payment;

        payment.status = if success {
            PaymentStatus::Completed
        } else {
            PaymentStatus::Failed
        };

        msg!(
            "Payment {} finalized: {}",
            payment.payment_id,
            if success { "success" } else { "failed" }
        );
        Ok(())
    }
}

// Account Structures

#[account]
pub struct Vault {
    /// Vault owner (merchant)
    pub owner: Pubkey,
    /// Encrypted balance (encrypted with user-specific key)
    pub encrypted_balance: Vec<u8>,
    /// Last update timestamp
    pub last_updated: i64,
    /// PDA bump
    pub bump: u8,
}

impl Vault {
    pub const MAX_SIZE: usize = 8 + 32 + 4 + 256 + 8 + 1;
}

#[account]
pub struct PaymentRecord {
    /// Associated vault
    pub vault: Pubkey,
    /// Payment intent ID (from database)
    pub payment_id: String,
    /// Encrypted amount
    pub encrypted_amount: Vec<u8>,
    /// Recipient address
    pub recipient: Pubkey,
    /// Creation timestamp
    pub timestamp: i64,
    /// Payment status
    pub status: PaymentStatus,
    /// PDA bump
    pub bump: u8,
}

impl PaymentRecord {
    pub const MAX_SIZE: usize = 8 + 32 + 4 + 64 + 4 + 128 + 32 + 8 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PaymentStatus {
    Pending,
    Completed,
    Failed,
}

// Context Definitions

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = payer,
        space = Vault::MAX_SIZE,
        seeds = [b"vault", owner.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    pub owner: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateBalance<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner
    )]
    pub vault: Account<'info, Vault>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(payment_id: String)]
pub struct RecordPayment<'info> {
    #[account(
        seeds = [b"vault", vault.owner.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = payer,
        space = PaymentRecord::MAX_SIZE,
        seeds = [b"payment", vault.key().as_ref(), payment_id.as_bytes()],
        bump
    )]
    pub payment: Account<'info, PaymentRecord>,

    pub owner: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizePayment<'info> {
    #[account(
        seeds = [b"vault", vault.owner.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"payment", vault.key().as_ref(), payment.payment_id.as_bytes()],
        bump = payment.bump
    )]
    pub payment: Account<'info, PaymentRecord>,

    pub owner: Signer<'info>,
}

// Constants

const MAX_ENCRYPTED_SIZE: usize = 256;
const MAX_ID_LENGTH: usize = 64;

// Errors

#[error_code]
pub enum VaultError {
    #[msg("Encrypted data exceeds maximum size")]
    DataTooLarge,
    #[msg("Payment ID exceeds maximum length")]
    IdTooLong,
    #[msg("Unauthorized access")]
    Unauthorized,
}
