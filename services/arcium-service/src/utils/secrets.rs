use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::{error::Error, fmt::Debug};

const UNSAFE_MASTER_KEYS: [&str; 2] = [
    "0000000000000000000000000000000000000000000000000000000000000000",
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
];

/// Load a 32-byte encryption master key from the environment.
///
/// Fails fast if the variable is missing, malformed, or matches any known
/// development placeholder so we do not boot the service with insecure crypto.
pub fn load_master_key_from_env(var_name: &str) -> Result<[u8; 32], Box<dyn Error>> {
    let key_hex = std::env::var(var_name).map_err(|_| {
        format!("{var_name} must be provided via your secret manager before starting the service")
    })?;

    if key_hex.len() != 64 {
        return Err(format!(
            "{var_name} must be a 64 character hex string (found length {})",
            key_hex.len()
        )
        .into());
    }

    let normalized = key_hex.to_ascii_lowercase();
    if UNSAFE_MASTER_KEYS.contains(&normalized.as_str()) {
        return Err(format!("{var_name} is using a known placeholder value; configure a unique secret before deployment").into());
    }

    let mut key_bytes = [0u8; 32];
    for i in 0..32 {
        let byte_str = &normalized[i * 2..i * 2 + 2];
        key_bytes[i] = u8::from_str_radix(byte_str, 16)
            .map_err(|e| format!("Invalid hex in {var_name}: {e}"))?;
    }

    Ok(key_bytes)
}

/// Resolve a generic secret string with basic validation.
pub fn load_secret_string(var_name: &str) -> Result<String, Box<dyn Error>> {
    let value = std::env::var(var_name).map_err(|_| {
        format!("{var_name} must be provided via your secret manager before starting the service")
    })?;

    if value.trim().is_empty() {
        return Err(format!(
            "{var_name} is set but empty; configure a non-empty value in your secret manager"
        )
        .into());
    }

    Ok(value)
}

/// Compute hex-encoded HMAC-SHA256 using the provided key.
pub fn hmac_sha256_hex<T: AsRef<[u8]> + Debug>(
    key: &[u8],
    message: T,
) -> Result<String, Box<dyn Error>> {
    let mut mac = Hmac::<Sha256>::new_from_slice(key)
        .map_err(|e| format!("Failed to create HMAC context: {e}"))?;
    mac.update(message.as_ref());
    Ok(hex::encode(mac.finalize().into_bytes()))
}
