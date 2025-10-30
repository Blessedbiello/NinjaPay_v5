use chacha20poly1305::{
    aead::{Aead, KeyInit, OsRng},
    ChaCha20Poly1305, Nonce,
};
use hkdf::Hkdf;
use rand::RngCore;
use sha2::Sha256;
use std::{error::Error, sync::OnceLock};

#[derive(Clone, Copy, Debug)]
enum EncryptionMode {
    Dev,
    Rescue,
}

fn resolve_mode() -> EncryptionMode {
    match std::env::var("ARCIUM_ENCRYPTION_BACKEND")
        .unwrap_or_else(|_| "dev".to_string())
        .to_lowercase()
        .as_str()
    {
        "rescue" => EncryptionMode::Rescue,
        _ => EncryptionMode::Dev,
    }
}

fn log_rescue_placeholder() {
    static RESCUE_LOG_ONCE: OnceLock<()> = OnceLock::new();
    RESCUE_LOG_ONCE.get_or_init(|| {
        log::warn!(
            "🪄 Rescue encryption backend requested. Falling back to development cipher until \
            native Rescue bindings are linked."
        );
    });
}

/// Development-mode encryption helper for MPC computations
///
/// ⚠️ WARNING: This is a DEVELOPMENT-MODE encryption implementation
/// Production deployment MUST use RescueCipher from Arcium SDK
///
/// This module provides:
/// - ChaCha20-Poly1305 AEAD encryption
/// - HKDF-based key derivation per user
/// - Compatible interface with future RescueCipher integration
///
/// Security model:
/// - Master key derived from environment secret
/// - Per-user keys derived via HKDF(master_key, user_pubkey)
/// - Random nonces for each encryption operation
/// - Authenticated encryption prevents tampering
///
/// Data format: [nonce (12 bytes)] + [ciphertext] + [auth tag (16 bytes)]
#[derive(Clone)]
pub struct EncryptionHelper {
    master_key: [u8; 32],
    mode: EncryptionMode,
}

impl EncryptionHelper {
    /// Create new encryption helper with master key
    ///
    /// The master key should be a 32-byte secret from environment config
    pub fn new_with_key(master_key: [u8; 32]) -> Self {
        let mode = resolve_mode();
        log::debug!("🔐 Encryption helper initialized ({:?} mode)", mode);
        Self { master_key, mode }
    }

    /// Create with default key (for testing only)
    pub fn new() -> Self {
        log::warn!("⚠️  Using default encryption key - NOT FOR PRODUCTION");
        Self {
            master_key: [42u8; 32], // Deterministic for testing
            mode: EncryptionMode::Dev,
        }
    }

    /// Derive a user-specific encryption key using HKDF
    ///
    /// Derivation: HKDF-SHA256(master_key, salt=user_pubkey, info="ninjapay-dev-v1")
    fn derive_user_key(&self, user_pubkey: &str) -> Result<[u8; 32], Box<dyn Error>> {
        let hkdf = Hkdf::<Sha256>::new(Some(user_pubkey.as_bytes()), &self.master_key);
        let mut derived_key = [0u8; 32];
        hkdf.expand(b"ninjapay-dev-v1", &mut derived_key)
            .map_err(|e| format!("Key derivation failed: {}", e))?;
        Ok(derived_key)
    }

    /// Encrypt a u64 value (for simulator)
    ///
    /// Converts u64 to 8-byte little-endian, then encrypts
    /// Returns: [nonce (12)] + [ciphertext (8)] + [tag (16)] = 36 bytes total
    pub fn encrypt_u64(&self, value: u64, user_pubkey: &str) -> Result<Vec<u8>, Box<dyn Error>> {
        let plaintext = value.to_le_bytes();
        self.encrypt_bytes(&plaintext, user_pubkey)
    }

    /// Decrypt to u64 value (for simulator)
    ///
    /// Decrypts and converts 8-byte little-endian to u64
    pub fn decrypt_to_u64(
        &self,
        encrypted: &[u8],
        user_pubkey: &str,
    ) -> Result<u64, Box<dyn Error>> {
        let plaintext = self.decrypt_bytes(encrypted, user_pubkey)?;
        if plaintext.len() != 8 {
            return Err(format!(
                "Invalid u64 decryption: expected 8 bytes, got {}",
                plaintext.len()
            )
            .into());
        }
        let bytes: [u8; 8] = plaintext
            .try_into()
            .map_err(|_| "Failed to convert to u64")?;
        Ok(u64::from_le_bytes(bytes))
    }

    /// Encrypt arbitrary bytes
    ///
    /// Format: [nonce (12 bytes)] + [ciphertext] + [tag (16 bytes)]
    pub fn encrypt_bytes(&self, data: &[u8], user_pubkey: &str) -> Result<Vec<u8>, Box<dyn Error>> {
        match self.mode {
            EncryptionMode::Dev => self.encrypt_bytes_dev(data, user_pubkey),
            EncryptionMode::Rescue => {
                log_rescue_placeholder();
                self.encrypt_bytes_dev(data, user_pubkey)
            }
        }
    }

    /// Decrypt arbitrary bytes
    ///
    /// Expects format: [nonce (12 bytes)] + [ciphertext] + [tag (16 bytes)]
    pub fn decrypt_bytes(
        &self,
        encrypted: &[u8],
        user_pubkey: &str,
    ) -> Result<Vec<u8>, Box<dyn Error>> {
        match self.mode {
            EncryptionMode::Dev => self.decrypt_bytes_dev(encrypted, user_pubkey),
            EncryptionMode::Rescue => {
                log_rescue_placeholder();
                self.decrypt_bytes_dev(encrypted, user_pubkey)
            }
        }
    }

    /// Validate encrypted input format
    ///
    /// Checks:
    /// 1. Not empty
    /// 2. Minimum length (nonce + tag = 28 bytes)
    /// 3. Proper structure
    pub fn validate_encrypted_input(&self, encrypted_data: &[u8]) -> Result<bool, Box<dyn Error>> {
        if encrypted_data.is_empty() {
            log::warn!("Validation failed: empty input");
            return Ok(false);
        }

        // Minimum: nonce (12) + minimal plaintext (0) + tag (16) = 28 bytes
        if encrypted_data.len() < 28 {
            log::warn!(
                "Validation failed: too short ({} bytes, need at least 28)",
                encrypted_data.len()
            );
            return Ok(false);
        }

        // For u64 encrypted values, expect exactly 36 bytes
        // nonce (12) + plaintext (8) + tag (16) = 36
        if encrypted_data.len() == 36 {
            log::debug!("✅ Valid u64 encrypted format");
            return Ok(true);
        }

        // Other lengths are valid as long as >= 28
        log::debug!("✅ Valid encrypted format ({} bytes)", encrypted_data.len());
        Ok(true)
    }

    /// Prepare encrypted inputs for batching
    ///
    /// Format: [count (4 bytes)] + [len1 (4)] + [data1] + [len2 (4)] + [data2] + ...
    pub fn prepare_batch_inputs(
        &self,
        encrypted_values: Vec<Vec<u8>>,
    ) -> Result<Vec<u8>, Box<dyn Error>> {
        // Validate all inputs first
        for (i, value) in encrypted_values.iter().enumerate() {
            if !self.validate_encrypted_input(value)? {
                return Err(format!("Invalid encrypted input at index {}", i).into());
            }
        }

        // Calculate total size
        let count = encrypted_values.len() as u32;
        let total_size: usize = 4 + // count
            encrypted_values.iter().map(|v| 4 + v.len()).sum::<usize>(); // len + data per item

        let mut result = Vec::with_capacity(total_size);

        // Write count
        result.extend_from_slice(&count.to_le_bytes());

        // Write each value with length prefix
        for value in encrypted_values {
            let len = value.len() as u32;
            result.extend_from_slice(&len.to_le_bytes());
            result.extend_from_slice(&value);
        }

        log::info!(
            "✅ Prepared batch of {} encrypted inputs ({} bytes)",
            count,
            result.len()
        );
        Ok(result)
    }

    fn encrypt_bytes_dev(&self, data: &[u8], user_pubkey: &str) -> Result<Vec<u8>, Box<dyn Error>> {
        let user_key = self.derive_user_key(user_pubkey)?;
        let cipher = ChaCha20Poly1305::new(&user_key.into());

        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher
            .encrypt(nonce, data)
            .map_err(|e| format!("Encryption failed: {}", e))?;

        let mut result = Vec::with_capacity(12 + ciphertext.len());
        result.extend_from_slice(&nonce_bytes);
        result.extend_from_slice(&ciphertext);

        log::debug!("✅ Encrypted {} bytes → {} bytes", data.len(), result.len());
        Ok(result)
    }

    fn decrypt_bytes_dev(
        &self,
        encrypted: &[u8],
        user_pubkey: &str,
    ) -> Result<Vec<u8>, Box<dyn Error>> {
        if encrypted.len() < 12 + 16 {
            return Err(format!(
                "Invalid encrypted data: too short (got {} bytes, need at least 28)",
                encrypted.len()
            )
            .into());
        }

        let (nonce_bytes, ciphertext) = encrypted.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);

        let user_key = self.derive_user_key(user_pubkey)?;
        let cipher = ChaCha20Poly1305::new(&user_key.into());

        let plaintext = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| format!("Decryption failed: {}", e))?;

        log::debug!(
            "✅ Decrypted {} bytes → {} bytes",
            encrypted.len(),
            plaintext.len()
        );
        Ok(plaintext)
    }

    /// Extract individual results from batch computation
    ///
    /// Expects format: [count (4 bytes)] + [len1 (4)] + [data1] + [len2 (4)] + [data2] + ...
    pub fn extract_batch_results(
        &self,
        batch_result: Vec<u8>,
        expected_count: usize,
    ) -> Result<Vec<Vec<u8>>, Box<dyn Error>> {
        if batch_result.len() < 4 {
            return Err("Batch result too short: missing count".into());
        }

        // Read count
        let count_bytes: [u8; 4] = batch_result[0..4]
            .try_into()
            .map_err(|_| "Failed to read count")?;
        let count = u32::from_le_bytes(count_bytes) as usize;

        if count != expected_count {
            return Err(format!(
                "Batch count mismatch: expected {}, got {}",
                expected_count, count
            )
            .into());
        }

        let mut results = Vec::with_capacity(count);
        let mut offset = 4;

        // Read each value
        for i in 0..count {
            if offset + 4 > batch_result.len() {
                return Err(format!("Batch result truncated at item {}", i).into());
            }

            // Read length
            let len_bytes: [u8; 4] = batch_result[offset..offset + 4]
                .try_into()
                .map_err(|_| format!("Failed to read length at item {}", i))?;
            let len = u32::from_le_bytes(len_bytes) as usize;
            offset += 4;

            // Read data
            if offset + len > batch_result.len() {
                return Err(format!("Batch result truncated: item {} data incomplete", i).into());
            }

            let data = batch_result[offset..offset + len].to_vec();
            results.push(data);
            offset += len;
        }

        log::info!("✅ Extracted {} results from batch", results.len());
        Ok(results)
    }

    /// Verify computation signature (placeholder for cluster mode)
    ///
    /// In development mode, this is a no-op
    /// In cluster mode, this verifies Arcium MPC cluster signatures
    pub fn verify_computation_signature(
        &self,
        _result: &[u8],
        _signature: &str,
        cluster_pubkey: &str,
    ) -> Result<bool, Box<dyn Error>> {
        log::debug!(
            "⚠️  Signature verification skipped (dev mode) for cluster: {}",
            cluster_pubkey
        );
        Ok(true)
    }
}

impl Default for EncryptionHelper {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_u64() {
        let helper = EncryptionHelper::new();
        let user = "test_user_pubkey";
        let value = 42u64;

        let encrypted = helper.encrypt_u64(value, user).unwrap();
        assert_eq!(encrypted.len(), 36); // nonce (12) + data (8) + tag (16)

        let decrypted = helper.decrypt_to_u64(&encrypted, user).unwrap();
        assert_eq!(decrypted, value);
    }

    #[test]
    fn test_encrypt_decrypt_bytes() {
        let helper = EncryptionHelper::new();
        let user = "test_user_pubkey";
        let data = b"Hello, NinjaPay!";

        let encrypted = helper.encrypt_bytes(data, user).unwrap();
        assert!(encrypted.len() > data.len()); // Should be longer (nonce + tag)

        let decrypted = helper.decrypt_bytes(&encrypted, user).unwrap();
        assert_eq!(decrypted, data);
    }

    #[test]
    fn test_different_users_different_ciphertexts() {
        let helper = EncryptionHelper::new();
        let value = 100u64;

        let encrypted1 = helper.encrypt_u64(value, "user1").unwrap();
        let encrypted2 = helper.encrypt_u64(value, "user2").unwrap();

        // Different users should produce different ciphertexts
        assert_ne!(encrypted1, encrypted2);

        // But decrypt to same value
        assert_eq!(helper.decrypt_to_u64(&encrypted1, "user1").unwrap(), value);
        assert_eq!(helper.decrypt_to_u64(&encrypted2, "user2").unwrap(), value);
    }

    #[test]
    fn test_wrong_user_cannot_decrypt() {
        let helper = EncryptionHelper::new();
        let encrypted = helper.encrypt_u64(42, "alice").unwrap();

        // Bob cannot decrypt Alice's data (will fail auth tag check)
        let result = helper.decrypt_to_u64(&encrypted, "bob");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_encrypted_input() {
        let helper = EncryptionHelper::new();

        // Empty input
        assert!(!helper.validate_encrypted_input(&[]).unwrap());

        // Too short
        assert!(!helper.validate_encrypted_input(&[1, 2, 3]).unwrap());

        // Valid encrypted u64
        let encrypted = helper.encrypt_u64(42, "test").unwrap();
        assert!(helper.validate_encrypted_input(&encrypted).unwrap());

        // Valid encrypted bytes
        let encrypted = helper.encrypt_bytes(b"test data", "test").unwrap();
        assert!(helper.validate_encrypted_input(&encrypted).unwrap());
    }

    #[test]
    fn test_tampering_detection() {
        let helper = EncryptionHelper::new();
        let mut encrypted = helper.encrypt_u64(42, "test").unwrap();

        // Tamper with ciphertext
        encrypted[20] ^= 0xFF;

        // Should fail decryption (auth tag verification)
        let result = helper.decrypt_to_u64(&encrypted, "test");
        assert!(result.is_err());
    }

    #[test]
    fn test_batch_prepare_extract() {
        let helper = EncryptionHelper::new();
        let user = "test";

        // Create batch of encrypted values
        let values = vec![
            helper.encrypt_u64(10, user).unwrap(),
            helper.encrypt_u64(20, user).unwrap(),
            helper.encrypt_u64(30, user).unwrap(),
        ];

        // Prepare batch
        let batched = helper.prepare_batch_inputs(values.clone()).unwrap();

        // Extract batch
        let extracted = helper.extract_batch_results(batched, 3).unwrap();

        // Should match original
        assert_eq!(extracted.len(), values.len());
        for (i, (original, extracted)) in values.iter().zip(extracted.iter()).enumerate() {
            assert_eq!(original, extracted, "Mismatch at index {}", i);
        }
    }

    #[test]
    fn test_batch_count_mismatch() {
        let helper = EncryptionHelper::new();
        let values = vec![
            helper.encrypt_u64(10, "test").unwrap(),
            helper.encrypt_u64(20, "test").unwrap(),
        ];

        let batched = helper.prepare_batch_inputs(values).unwrap();

        // Request wrong count
        let result = helper.extract_batch_results(batched, 3);
        assert!(result.is_err());
    }

    #[test]
    fn test_key_derivation_deterministic() {
        let helper = EncryptionHelper::new();

        // Same user should derive same key
        let key1 = helper.derive_user_key("alice").unwrap();
        let key2 = helper.derive_user_key("alice").unwrap();
        assert_eq!(key1, key2);

        // Different users should derive different keys
        let key_bob = helper.derive_user_key("bob").unwrap();
        assert_ne!(key1, key_bob);
    }

    #[test]
    fn test_nonce_randomness() {
        let helper = EncryptionHelper::new();

        // Same value encrypted twice should produce different ciphertexts (random nonces)
        let enc1 = helper.encrypt_u64(42, "test").unwrap();
        let enc2 = helper.encrypt_u64(42, "test").unwrap();
        assert_ne!(enc1, enc2);

        // But both should decrypt to same value
        assert_eq!(helper.decrypt_to_u64(&enc1, "test").unwrap(), 42);
        assert_eq!(helper.decrypt_to_u64(&enc2, "test").unwrap(), 42);
    }

    #[test]
    fn test_large_batch() {
        let helper = EncryptionHelper::new();
        let user = "test";

        // Create large batch (simulate payroll)
        let mut values = Vec::new();
        for i in 0..100 {
            values.push(helper.encrypt_u64(1000 + i, user).unwrap());
        }

        let batched = helper.prepare_batch_inputs(values.clone()).unwrap();
        let extracted = helper.extract_batch_results(batched, 100).unwrap();

        assert_eq!(extracted.len(), 100);
        for (i, (original, extracted)) in values.iter().zip(extracted.iter()).enumerate() {
            assert_eq!(original, extracted, "Mismatch at index {}", i);
        }
    }
}
