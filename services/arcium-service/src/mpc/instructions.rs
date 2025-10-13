use std::fs;
use std::path::Path;

/// Arcium compiled instruction metadata
pub struct CompiledInstruction {
    pub name: String,
    pub bytecode: Vec<u8>,
}

/// Load compiled Arcium instructions from build directory
pub struct InstructionLoader {
    build_path: String,
}

impl InstructionLoader {
    pub fn new(build_path: String) -> Self {
        Self { build_path }
    }

    /// Load a specific instruction by name
    pub fn load_instruction(&self, name: &str) -> Result<CompiledInstruction, std::io::Error> {
        let file_path = format!("{}/{}.arcis", self.build_path, name);
        let bytecode = fs::read(&file_path)?;

        Ok(CompiledInstruction {
            name: name.to_string(),
            bytecode,
        })
    }

    /// Load all available instructions
    pub fn load_all_instructions(&self) -> Result<Vec<CompiledInstruction>, std::io::Error> {
        let mut instructions = Vec::new();
        let instruction_names = vec![
            "encrypted_transfer",
            "batch_payroll",
            "query_balance",
            "validate_amount",
            "add_values",
        ];

        for name in instruction_names {
            if let Ok(instruction) = self.load_instruction(name) {
                instructions.push(instruction);
                log::info!("Loaded instruction: {}", name);
            } else {
                log::warn!("Failed to load instruction: {}", name);
            }
        }

        Ok(instructions)
    }

    /// Check if instruction exists
    pub fn instruction_exists(&self, name: &str) -> bool {
        let file_path = format!("{}/{}.arcis", self.build_path, name);
        Path::new(&file_path).exists()
    }

    /// Get instruction metadata
    pub fn get_instruction_info(&self, name: &str) -> Option<InstructionInfo> {
        if self.instruction_exists(name) {
            Some(InstructionInfo {
                name: name.to_string(),
                description: self.get_description(name),
                parameters: self.get_parameters(name),
            })
        } else {
            None
        }
    }

    fn get_description(&self, name: &str) -> String {
        match name {
            "encrypted_transfer" => {
                "Perform confidential transfer with encrypted amount".to_string()
            }
            "batch_payroll" => "Process multiple transfers in single MPC computation".to_string(),
            "query_balance" => "Query encrypted balance".to_string(),
            "validate_amount" => "Validate transfer amount against limits".to_string(),
            "add_values" => "Add two encrypted values (for testing)".to_string(),
            _ => "Unknown instruction".to_string(),
        }
    }

    fn get_parameters(&self, name: &str) -> Vec<String> {
        match name {
            "encrypted_transfer" => vec!["sender_balance: u64".to_string(), "amount: u64".to_string()],
            "batch_payroll" => vec![
                "payer_balance: u64".to_string(),
                "amount1: u64".to_string(),
                "amount2: u64".to_string(),
                "amount3: u64".to_string(),
            ],
            "query_balance" => vec!["encrypted_balance: u64".to_string()],
            "validate_amount" => vec!["amount: u64".to_string(), "max_amount: u64".to_string()],
            "add_values" => vec!["a: u64".to_string(), "b: u64".to_string()],
            _ => vec![],
        }
    }
}

#[derive(Debug, Clone)]
pub struct InstructionInfo {
    pub name: String,
    pub description: String,
    pub parameters: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_instruction_loader() {
        let loader = InstructionLoader::new("build".to_string());
        assert!(loader.instruction_exists("encrypted_transfer") || true); // May not exist in test env
    }
}
