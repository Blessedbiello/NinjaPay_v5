use anchor_lang::prelude::*;
use arcium_anchor::{derive_cluster_pda, queue_computation};

declare_id!("26gA8vfbazMA8SWXg71VsJ89XCs949XCni4fPPYFA5nz");

#[program]
pub mod ninjapay_vault {
    use super::*;

    /// Initialize the vault for a user
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.user.key();
        vault.encrypted_balance = vec![0u8; 32]; // Placeholder for encrypted balance
        vault.bump = ctx.bumps.vault;
        vault.is_initialized = true;

        msg!("Vault initialized for user: {}", vault.owner);
        Ok(())
    }

    /// Queue a confidential transfer computation
    pub fn confidential_transfer(
        ctx: Context<ConfidentialTransfer>,
        encrypted_amount: Vec<u8>,
        recipient: Pubkey,
    ) -> Result<()> {
        msg!("Queueing confidential transfer to {}", recipient);

        // Queue the computation to Arcium MPC cluster
        // The actual transfer logic is in the encrypted module below
        queue_computation(&ctx.accounts.cluster, &ctx.accounts.user, &encrypted_amount)?;

        Ok(())
    }

    /// Process callback from MPC computation
    pub fn process_callback(
        ctx: Context<ProcessCallback>,
        computation_result: Vec<u8>,
    ) -> Result<()> {
        msg!("Processing MPC computation callback");

        let vault = &mut ctx.accounts.vault;
        vault.encrypted_balance = computation_result;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Vault::LEN,
        seeds = [b"vault", user.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfidentialTransfer<'info> {
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: Arcium MPC cluster account
    pub cluster: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ProcessCallback<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    /// CHECK: MPC cluster authority
    pub mpc_authority: AccountInfo<'info>,
}

#[account]
pub struct Vault {
    pub owner: Pubkey,
    pub encrypted_balance: Vec<u8>,
    pub bump: u8,
    pub is_initialized: bool,
}

impl Vault {
    pub const LEN: usize = 32 + 4 + 256 + 1 + 1; // pubkey + vec len + vec data + bump + bool
}

// Encrypted computation module - runs in MPC
#[encrypted]
pub mod encrypted_instructions {
    use arcis_imports::*;

    /// Encrypted transfer instruction
    /// This code runs inside the Arcium MPC network
    #[instruction]
    pub fn encrypted_transfer(
        sender_balance: Cipher<u64>,
        amount: Cipher<u64>,
    ) -> Result<Cipher<u64>, Error> {
        // Decrypt inside MPC (never exposed)
        let balance = sender_balance.decrypt()?;
        let transfer_amount = amount.decrypt()?;

        // Validate sufficient balance
        if balance < transfer_amount {
            return Err(Error::InsufficientFunds);
        }

        // Calculate new balance
        let new_balance = balance - transfer_amount;

        // Re-encrypt result
        Ok(Cipher::encrypt(new_balance)?)
    }

    /// Batch payroll computation
    /// Process multiple transfers in single MPC computation
    #[instruction]
    pub fn batch_payroll(
        payer_balance: Cipher<u64>,
        amounts: Vec<Cipher<u64>>,
    ) -> Result<(Cipher<u64>, Vec<Cipher<u64>>), Error> {
        let mut balance = payer_balance.decrypt()?;
        let mut results = Vec::new();

        // Calculate total amount needed
        let mut total = 0u64;
        for amount_cipher in &amounts {
            let amount = amount_cipher.decrypt()?;
            total += amount;
        }

        // Validate sufficient balance for all transfers
        if balance < total {
            return Err(Error::InsufficientFunds);
        }

        // Process each transfer
        for amount_cipher in amounts {
            let amount = amount_cipher.decrypt()?;
            balance -= amount;
            results.push(Cipher::encrypt(amount)?);
        }

        Ok((Cipher::encrypt(balance)?, results))
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient funds for transfer")]
    InsufficientFunds,
    #[msg("Invalid computation result")]
    InvalidComputationResult,
    #[msg("Vault not initialized")]
    VaultNotInitialized,
}
