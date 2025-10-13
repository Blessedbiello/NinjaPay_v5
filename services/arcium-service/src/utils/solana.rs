use solana_sdk::{
    pubkey::Pubkey,
    signature::{Keypair, Signature},
};
use std::error::Error;
use std::str::FromStr;

/// Solana client for blockchain interactions
pub struct SolanaClient {
    rpc_url: String,
}

impl SolanaClient {
    pub fn new(rpc_url: String) -> Self {
        Self { rpc_url }
    }

    /// Validate a Solana public key
    pub fn validate_pubkey(pubkey_str: &str) -> Result<Pubkey, Box<dyn Error>> {
        let pubkey = Pubkey::from_str(pubkey_str)?;
        Ok(pubkey)
    }

    /// Check if a public key is valid
    pub fn is_valid_pubkey(pubkey_str: &str) -> bool {
        Pubkey::from_str(pubkey_str).is_ok()
    }

    /// Parse a transaction signature
    pub fn parse_signature(sig_str: &str) -> Result<Signature, Box<dyn Error>> {
        let signature = Signature::from_str(sig_str)?;
        Ok(signature)
    }

    /// Derive a program derived address (PDA)
    pub fn derive_pda(
        seeds: &[&[u8]],
        program_id: &Pubkey,
    ) -> Result<(Pubkey, u8), Box<dyn Error>> {
        let (pda, bump) = Pubkey::find_program_address(seeds, program_id);
        Ok((pda, bump))
    }

    /// Generate a new keypair (for testing only)
    #[cfg(test)]
    pub fn generate_keypair() -> Keypair {
        Keypair::new()
    }

    /// Get RPC URL
    pub fn rpc_url(&self) -> &str {
        &self.rpc_url
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_valid_pubkey() {
        let pubkey_str = "11111111111111111111111111111111";
        assert!(SolanaClient::is_valid_pubkey(pubkey_str));
    }

    #[test]
    fn test_validate_invalid_pubkey() {
        let pubkey_str = "invalid_pubkey";
        assert!(!SolanaClient::is_valid_pubkey(pubkey_str));
    }

    #[test]
    fn test_derive_pda() {
        let program_id = Pubkey::new_unique();
        let seeds = &[b"test"];
        let result = SolanaClient::derive_pda(seeds, &program_id);
        assert!(result.is_ok());
    }
}
