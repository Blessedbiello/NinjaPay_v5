use sha2::{Digest, Sha256};

/// Calculate Anchor instruction discriminator
///
/// Anchor uses: SHA256("global:{instruction_name}")[..8]
///
/// Example:
/// ```
/// let disc = anchor_discriminator("confidential_transfer");
/// // Returns first 8 bytes of SHA256("global:confidential_transfer")
/// ```
pub fn anchor_discriminator(instruction_name: &str) -> [u8; 8] {
    let preimage = format!("global:{}", instruction_name);
    let hash = Sha256::digest(preimage.as_bytes());
    let mut discriminator = [0u8; 8];
    discriminator.copy_from_slice(&hash[..8]);
    discriminator
}

/// Get discriminator for ninjapay-vault instructions
pub mod ninjapay_vault {
    use super::*;

    pub fn confidential_transfer() -> [u8; 8] {
        anchor_discriminator("confidential_transfer")
    }

    pub fn initialize_vault() -> [u8; 8] {
        anchor_discriminator("initialize_vault")
    }

    pub fn process_callback() -> [u8; 8] {
        anchor_discriminator("process_callback")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_discriminator_calculation() {
        // Test with known instruction
        let disc = anchor_discriminator("initialize");
        assert_eq!(disc.len(), 8);

        // Test consistency
        let disc1 = anchor_discriminator("test_instruction");
        let disc2 = anchor_discriminator("test_instruction");
        assert_eq!(disc1, disc2);

        // Test different instructions produce different discriminators
        let disc_a = anchor_discriminator("instruction_a");
        let disc_b = anchor_discriminator("instruction_b");
        assert_ne!(disc_a, disc_b);
    }

    #[test]
    fn test_ninjapay_vault_discriminators() {
        let disc = ninjapay_vault::confidential_transfer();
        assert_eq!(disc.len(), 8);

        // Should be deterministic
        let disc2 = ninjapay_vault::confidential_transfer();
        assert_eq!(disc, disc2);
    }
}
