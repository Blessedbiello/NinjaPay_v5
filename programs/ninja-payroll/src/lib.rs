use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use ephemeral_rollups_sdk::anchor::{commit_accounts, commit_and_undelegate_accounts, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;

declare_id!("11111111111111111111111111111111");

/// NinjaPay Batch Payroll Program with MagicBlock Ephemeral Rollups
///
/// Enables confidential, high-speed batch payments for 100+ recipients
/// - Delegates accounts to ephemeral rollup for fast processing
/// - Executes payments at 10-50ms latency with zero fees
/// - Settles final state to Solana for permanent record
/// - Predictable costs (~$0.02 vs ~$1.00 for traditional approach)
#[ephemeral]
#[program]
pub mod ninja_payroll {
    use super::*;

    /// Initialize a new payroll batch
    pub fn initialize_batch(
        ctx: Context<InitializeBatch>,
        batch_id: u64,
        total_recipients: u16,
    ) -> Result<()> {
        let batch = &mut ctx.accounts.batch;
        batch.authority = ctx.accounts.authority.key();
        batch.batch_id = batch_id;
        batch.total_recipients = total_recipients;
        batch.processed_count = 0;
        batch.total_amount = 0;
        batch.status = BatchStatus::Initialized;
        batch.created_at = Clock::get()?.unix_timestamp;
        batch.bump = ctx.bumps.batch;

        msg!("Batch {} initialized for {} recipients", batch_id, total_recipients);
        Ok(())
    }

    /// Delegate batch account to ephemeral rollup
    pub fn delegate_batch(ctx: Context<DelegateBatch>) -> Result<()> {
        let batch = &mut ctx.accounts.batch;
        require!(
            batch.status == BatchStatus::Initialized,
            PayrollError::InvalidBatchStatus
        );

        // Delegate the batch PDA to ephemeral rollup
        ctx.accounts.delegate_pda(
            &ctx.accounts.payer,
            &[
                b"payroll_batch",
                &batch.batch_id.to_le_bytes(),
                &[batch.bump],
            ],
            DelegateConfig {
                validator: ctx.remaining_accounts.first().map(|acc| acc.key()),
                ..Default::default()
            },
        )?;

        batch.status = BatchStatus::Delegated;
        msg!("Batch {} delegated to ephemeral rollup", batch.batch_id);
        Ok(())
    }

    /// Process a single payment in the batch (executed in ephemeral rollup)
    pub fn process_payment(
        ctx: Context<ProcessPayment>,
        amount: u64,
        recipient_index: u16,
    ) -> Result<()> {
        let batch = &mut ctx.accounts.batch;

        require!(
            batch.status == BatchStatus::Delegated || batch.status == BatchStatus::Processing,
            PayrollError::InvalidBatchStatus
        );

        require!(
            recipient_index < batch.total_recipients,
            PayrollError::InvalidRecipientIndex
        );

        // Execute SPL token transfer at high speed in ephemeral rollup
        let cpi_accounts = Transfer {
            from: ctx.accounts.source_token.to_account_info(),
            to: ctx.accounts.recipient_token.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer(cpi_ctx, amount)?;

        // Update batch metadata
        batch.processed_count += 1;
        batch.total_amount += amount;
        batch.status = BatchStatus::Processing;

        msg!(
            "Payment {} of {}: {} tokens to recipient index {}",
            batch.processed_count,
            batch.total_recipients,
            amount,
            recipient_index
        );

        Ok(())
    }

    /// Commit intermediate state (optional during long batches)
    pub fn commit_batch(ctx: Context<CommitBatch>) -> Result<()> {
        let batch = &ctx.accounts.batch;

        require!(
            batch.status == BatchStatus::Processing,
            PayrollError::InvalidBatchStatus
        );

        // Commit current state to Solana while keeping delegation
        commit_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.batch.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;

        msg!(
            "Batch {} committed: {}/{} payments processed",
            batch.batch_id,
            batch.processed_count,
            batch.total_recipients
        );
        Ok(())
    }

    /// Finalize batch and settle to Solana
    pub fn finalize_batch(ctx: Context<FinalizeBatch>) -> Result<()> {
        let batch = &mut ctx.accounts.batch;

        require!(
            batch.processed_count == batch.total_recipients,
            PayrollError::IncompletePayments
        );

        batch.status = BatchStatus::Finalized;
        batch.finalized_at = Some(Clock::get()?.unix_timestamp);

        // Commit final state and undelegate
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.batch.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;

        msg!(
            "Batch {} finalized: {} payments totaling {} tokens",
            batch.batch_id,
            batch.processed_count,
            batch.total_amount
        );
        Ok(())
    }

    /// Cancel batch and undelegate (emergency use)
    pub fn cancel_batch(ctx: Context<CancelBatch>) -> Result<()> {
        let batch = &mut ctx.accounts.batch;
        batch.status = BatchStatus::Cancelled;

        // Commit and undelegate
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.batch.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;

        msg!("Batch {} cancelled and undelegated", batch.batch_id);
        Ok(())
    }
}

// Account Contexts

#[derive(Accounts)]
#[instruction(batch_id: u64)]
pub struct InitializeBatch<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + PayrollBatch::LEN,
        seeds = [b"payroll_batch", &batch_id.to_le_bytes()],
        bump
    )]
    pub batch: Account<'info, PayrollBatch>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DelegateBatch<'info> {
    #[account(
        mut,
        seeds = [b"payroll_batch", &batch.batch_id.to_le_bytes()],
        bump = batch.bump,
        has_one = authority
    )]
    pub batch: Account<'info, PayrollBatch>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ProcessPayment<'info> {
    #[account(
        mut,
        seeds = [b"payroll_batch", &batch.batch_id.to_le_bytes()],
        bump = batch.bump,
        has_one = authority
    )]
    pub batch: Account<'info, PayrollBatch>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub source_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CommitBatch<'info> {
    #[account(
        mut,
        seeds = [b"payroll_batch", &batch.batch_id.to_le_bytes()],
        bump = batch.bump
    )]
    pub batch: Account<'info, PayrollBatch>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: MagicBlock context account
    pub magic_context: AccountInfo<'info>,

    /// CHECK: MagicBlock program
    pub magic_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct FinalizeBatch<'info> {
    #[account(
        mut,
        seeds = [b"payroll_batch", &batch.batch_id.to_le_bytes()],
        bump = batch.bump,
        has_one = authority
    )]
    pub batch: Account<'info, PayrollBatch>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: MagicBlock context account
    pub magic_context: AccountInfo<'info>,

    /// CHECK: MagicBlock program
    pub magic_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CancelBatch<'info> {
    #[account(
        mut,
        seeds = [b"payroll_batch", &batch.batch_id.to_le_bytes()],
        bump = batch.bump,
        has_one = authority
    )]
    pub batch: Account<'info, PayrollBatch>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: MagicBlock context account
    pub magic_context: AccountInfo<'info>,

    /// CHECK: MagicBlock program
    pub magic_program: AccountInfo<'info>,
}

// Data Structures

#[account]
pub struct PayrollBatch {
    /// Batch authority
    pub authority: Pubkey,
    /// Unique batch ID
    pub batch_id: u64,
    /// Total recipients in this batch
    pub total_recipients: u16,
    /// Number of payments processed
    pub processed_count: u16,
    /// Total amount paid out
    pub total_amount: u64,
    /// Batch status
    pub status: BatchStatus,
    /// Creation timestamp
    pub created_at: i64,
    /// Finalization timestamp
    pub finalized_at: Option<i64>,
    /// PDA bump
    pub bump: u8,
}

impl PayrollBatch {
    pub const LEN: usize = 32 + 8 + 2 + 2 + 8 + 1 + 8 + 9 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum BatchStatus {
    Initialized,
    Delegated,
    Processing,
    Finalized,
    Cancelled,
}

// Errors

#[error_code]
pub enum PayrollError {
    #[msg("Invalid batch status for this operation")]
    InvalidBatchStatus,
    #[msg("Recipient index out of bounds")]
    InvalidRecipientIndex,
    #[msg("Not all payments have been processed")]
    IncompletePayments,
    #[msg("Batch has already been finalized")]
    BatchAlreadyFinalized,
    #[msg("Unauthorized: caller is not batch authority")]
    Unauthorized,
}
