use arcis_imports::*;

#[encrypted]
pub mod ninjapay_instructions {
    /// Encrypted transfer instruction
    /// This code runs inside the Arcium MPC network
    #[instruction]
    pub fn encrypted_transfer(sender_balance: u64, amount: u64) -> u64 {
        // Validate sufficient balance - MPC network handles this
        let new_balance = if sender_balance >= amount {
            sender_balance - amount
        } else {
            sender_balance // Return original balance if insufficient
        };

        new_balance
    }

    /// Batch payroll computation
    /// Process multiple transfers in single MPC computation
    #[instruction]
    pub fn batch_payroll(payer_balance: u64, amount1: u64, amount2: u64, amount3: u64) -> u64 {
        let mut balance = payer_balance;
        let total = amount1 + amount2 + amount3;

        // Process transfers if sufficient balance
        if balance >= total {
            balance -= total;
        }

        balance
    }

    /// Balance query computation
    #[instruction]
    pub fn query_balance(encrypted_balance: u64) -> u64 {
        encrypted_balance
    }

    /// Validate transfer amount
    #[instruction]
    pub fn validate_amount(amount: u64, max_amount: u64) -> bool {
        amount > 0 && amount <= max_amount
    }

    /// Simple addition (for testing MPC)
    #[instruction]
    pub fn add_values(a: u64, b: u64) -> u64 {
        a + b
    }
}
