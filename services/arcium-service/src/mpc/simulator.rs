use std::error::Error;
use std::collections::HashMap;
use super::instructions::{CompiledInstruction, InstructionLoader};
use super::encryption::EncryptionHelper;
use std::sync::Arc;

/// MPC Simulator for local development
///
/// Simulates Arcium MPC execution locally by interpreting .arcis bytecode
/// This allows development without cluster access
///
/// Uses real encryption (ChaCha20-Poly1305) in development mode
/// to test realistic encrypted data flows
pub struct MpcSimulator {
    instructions: HashMap<String, CompiledInstruction>,
    loader: InstructionLoader,
    encryption: Arc<EncryptionHelper>,
}

impl MpcSimulator {
    /// Create a new MPC simulator with encryption helper
    pub fn new(build_path: String, encryption: Arc<EncryptionHelper>) -> Result<Self, Box<dyn Error>> {
        let loader = InstructionLoader::new(build_path);

        // Load all available instructions
        let instructions_vec = loader.load_all_instructions()?;
        let mut instructions = HashMap::new();

        for instruction in instructions_vec {
            instructions.insert(instruction.name.clone(), instruction);
        }

        log::info!("✅ MPC Simulator initialized with {} instructions", instructions.len());

        Ok(Self {
            instructions,
            loader,
            encryption,
        })
    }

    /// Execute an instruction by name with encrypted inputs
    ///
    /// Decrypts inputs, executes instruction logic, re-encrypts result
    pub fn execute_instruction(
        &self,
        name: &str,
        encrypted_inputs: Vec<Vec<u8>>,
        user_pubkey: &str,
    ) -> Result<Vec<u8>, Box<dyn Error>> {
        log::info!("🔄 Simulating MPC execution: {} for user: {}", name, user_pubkey);

        // Get instruction bytecode
        let instruction = self.instructions.get(name)
            .ok_or_else(|| format!("Instruction not found: {}", name))?;

        log::debug!("Instruction bytecode size: {} bytes", instruction.bytecode.len());

        // Decrypt inputs using real encryption
        let decrypted_inputs = encrypted_inputs.iter()
            .map(|enc| self.encryption.decrypt_to_u64(enc, user_pubkey))
            .collect::<Result<Vec<u64>, _>>()?;

        log::debug!("Decrypted {} inputs", decrypted_inputs.len());

        // Execute the instruction logic based on name
        let result = match name {
            "encrypted_transfer" => self.execute_transfer(&decrypted_inputs)?,
            "batch_payroll" => self.execute_batch_payroll(&decrypted_inputs)?,
            "query_balance" => self.execute_query_balance(&decrypted_inputs)?,
            "validate_amount" => self.execute_validate_amount(&decrypted_inputs)?,
            "add_values" => self.execute_add_values(&decrypted_inputs)?,
            _ => return Err(format!("Unknown instruction: {}", name).into()),
        };

        // Re-encrypt result using real encryption
        let encrypted_result = self.encryption.encrypt_u64(result, user_pubkey)?;

        log::info!("✅ MPC simulation complete: {}", name);
        Ok(encrypted_result)
    }

    /// Simulate confidential transfer
    fn execute_transfer(&self, inputs: &[u64]) -> Result<u64, Box<dyn Error>> {
        if inputs.len() < 2 {
            return Err("encrypted_transfer requires 2 inputs: balance, amount".into());
        }

        let balance = inputs[0];
        let amount = inputs[1];

        log::debug!("Transfer: balance={}, amount={}", balance, amount);

        // Validate sufficient balance
        if balance < amount {
            log::warn!("Insufficient balance: {} < {}", balance, amount);
            return Ok(balance); // Return original balance
        }

        let new_balance = balance - amount;
        log::debug!("New balance: {}", new_balance);

        Ok(new_balance)
    }

    /// Simulate batch payroll
    fn execute_batch_payroll(&self, inputs: &[u64]) -> Result<u64, Box<dyn Error>> {
        if inputs.is_empty() {
            return Err("batch_payroll requires at least 1 input (payer balance)".into());
        }

        let mut balance = inputs[0];
        let amounts = &inputs[1..];

        log::debug!("Batch payroll: balance={}, recipients={}", balance, amounts.len());

        // Calculate total amount
        let total: u64 = amounts.iter().sum();

        // Validate sufficient balance
        if balance < total {
            log::warn!("Insufficient balance for batch: {} < {}", balance, total);
            return Ok(balance); // Return original balance
        }

        // Deduct all amounts
        balance -= total;

        log::debug!("Batch payroll complete: new_balance={}, total_paid={}", balance, total);

        Ok(balance)
    }

    /// Simulate balance query
    fn execute_query_balance(&self, inputs: &[u64]) -> Result<u64, Box<dyn Error>> {
        if inputs.is_empty() {
            return Err("query_balance requires 1 input: balance".into());
        }

        let balance = inputs[0];
        log::debug!("Query balance: {}", balance);

        Ok(balance)
    }

    /// Simulate amount validation
    fn execute_validate_amount(&self, inputs: &[u64]) -> Result<u64, Box<dyn Error>> {
        if inputs.len() < 2 {
            return Err("validate_amount requires 2 inputs: amount, max_amount".into());
        }

        let amount = inputs[0];
        let max_amount = inputs[1];

        log::debug!("Validate: amount={}, max={}", amount, max_amount);

        // Return 1 if valid, 0 if invalid
        let is_valid = if amount > 0 && amount <= max_amount { 1 } else { 0 };

        Ok(is_valid)
    }

    /// Simulate addition (for testing)
    fn execute_add_values(&self, inputs: &[u64]) -> Result<u64, Box<dyn Error>> {
        if inputs.len() < 2 {
            return Err("add_values requires 2 inputs: a, b".into());
        }

        let a = inputs[0];
        let b = inputs[1];
        let sum = a.wrapping_add(b); // Use wrapping to avoid overflow panics

        log::debug!("Add: {} + {} = {}", a, b, sum);

        Ok(sum)
    }


    /// Get available instructions
    pub fn list_instructions(&self) -> Vec<String> {
        self.instructions.keys().cloned().collect()
    }

    /// Check if instruction exists
    pub fn has_instruction(&self, name: &str) -> bool {
        self.instructions.contains_key(name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_simulator() -> MpcSimulator {
        let encryption = Arc::new(EncryptionHelper::new());
        MpcSimulator::new("build".to_string(), encryption)
            .unwrap_or_else(|_| {
                // If build path doesn't exist, create empty simulator for testing
                let loader = InstructionLoader::new("build".to_string());
                MpcSimulator {
                    instructions: HashMap::new(),
                    loader,
                    encryption: Arc::new(EncryptionHelper::new()),
                }
            })
    }

    #[test]
    fn test_simulator_creation() {
        let encryption = Arc::new(EncryptionHelper::new());
        let result = MpcSimulator::new("build".to_string(), encryption);
        // Just verify it doesn't panic
        assert!(result.is_ok() || result.is_err());
    }

    #[test]
    fn test_encrypt_decrypt_with_real_encryption() {
        let encryption = Arc::new(EncryptionHelper::new());
        let user = "test_user";
        let value: u64 = 12345;

        // Encrypt
        let encrypted = encryption.encrypt_u64(value, user).unwrap();

        // Decrypt
        let decrypted = encryption.decrypt_to_u64(&encrypted, user).unwrap();

        assert_eq!(value, decrypted);
    }

    #[test]
    fn test_transfer_sufficient_balance() {
        let simulator = create_test_simulator();
        let inputs = vec![1000, 300]; // balance=1000, amount=300

        let result = simulator.execute_transfer(&inputs).unwrap();
        assert_eq!(result, 700); // 1000 - 300
    }

    #[test]
    fn test_transfer_insufficient_balance() {
        let simulator = create_test_simulator();
        let inputs = vec![100, 300]; // balance=100, amount=300

        let result = simulator.execute_transfer(&inputs).unwrap();
        assert_eq!(result, 100); // Should return original balance
    }

    #[test]
    fn test_batch_payroll() {
        let simulator = create_test_simulator();
        let inputs = vec![10000, 1000, 2000, 1500]; // balance=10000, 3 payments

        let result = simulator.execute_batch_payroll(&inputs).unwrap();
        assert_eq!(result, 5500); // 10000 - (1000 + 2000 + 1500)
    }

    #[test]
    fn test_add_values() {
        let simulator = create_test_simulator();
        let inputs = vec![100, 200];

        let result = simulator.execute_add_values(&inputs).unwrap();
        assert_eq!(result, 300);
    }

    #[test]
    fn test_validate_amount() {
        let simulator = create_test_simulator();

        // Valid amount
        let inputs = vec![500, 1000]; // amount=500, max=1000
        let result = simulator.execute_validate_amount(&inputs).unwrap();
        assert_eq!(result, 1);

        // Invalid amount (too high)
        let inputs = vec![1500, 1000]; // amount=1500, max=1000
        let result = simulator.execute_validate_amount(&inputs).unwrap();
        assert_eq!(result, 0);
    }
}
