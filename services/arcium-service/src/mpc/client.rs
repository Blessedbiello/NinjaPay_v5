use super::types::{
    ComputationRequest, ComputationResult, ComputationType,
    ComputationMetadata, ComputationStatus,
};
use super::simulator::MpcSimulator;
use super::encryption::EncryptionHelper;
use crate::utils::redis::RedisClient;
use std::error::Error;
use std::sync::Arc;

/// MPC Operation Mode
#[derive(Debug, Clone, PartialEq)]
pub enum MpcMode {
    /// Local simulation mode (for development without cluster access)
    Local,
    /// Real Arcium cluster mode (for production)
    Cluster,
}

/// MPC Client for interacting with Arcium MPC network
///
/// This client handles the three-step computation lifecycle:
/// 1. Initialization (one-time setup)
/// 2. Invocation (queue computation with encrypted inputs)
/// 3. Callback (receive results from MPC cluster)
///
/// Supports dual-mode operation:
/// - Local: Simulates MPC using .arcis bytecode interpreter
/// - Cluster: Connects to real Arcium MPC cluster
pub struct MpcClient {
    mode: MpcMode,
    cluster_address: Option<String>,
    program_id: Option<String>,
    simulator: Option<MpcSimulator>,
    redis: Arc<RedisClient>,
    encryption: EncryptionHelper,
}

impl MpcClient {
    /// Create a new MPC client in Local mode (for development)
    pub fn new_local(redis: Arc<RedisClient>, build_path: String) -> Result<Self, Box<dyn Error>> {
        // Load encryption master key from environment
        let master_key = if let Ok(key_hex) = std::env::var("ENCRYPTION_MASTER_KEY") {
            if key_hex.len() != 64 {
                return Err(format!("ENCRYPTION_MASTER_KEY must be 64 hex characters (got {})", key_hex.len()).into());
            }
            let mut key_bytes = [0u8; 32];
            for i in 0..32 {
                key_bytes[i] = u8::from_str_radix(&key_hex[i*2..i*2+2], 16)
                    .map_err(|e| format!("Invalid hex in ENCRYPTION_MASTER_KEY: {}", e))?;
            }
            key_bytes
        } else {
            log::warn!("⚠️  ENCRYPTION_MASTER_KEY not set, using default (NOT FOR PRODUCTION)");
            [42u8; 32]
        };

        // Create encryption helper with loaded key
        let encryption = Arc::new(EncryptionHelper::new_with_key(master_key));

        // Create simulator with encryption
        let simulator = MpcSimulator::new(build_path, encryption.clone())?;

        log::info!("🔧 MPC Client initialized in LOCAL mode");
        log::info!("   Available instructions: {:?}", simulator.list_instructions());

        Ok(Self {
            mode: MpcMode::Local,
            cluster_address: None,
            program_id: None,
            simulator: Some(simulator),
            redis,
            encryption: (*encryption).clone(),
        })
    }

    /// Create a new MPC client in Cluster mode (for production)
    pub fn new_cluster(
        redis: Arc<RedisClient>,
        cluster_address: String,
        program_id: String,
    ) -> Result<Self, Box<dyn Error>> {
        // Load encryption master key from environment
        let master_key = if let Ok(key_hex) = std::env::var("ENCRYPTION_MASTER_KEY") {
            if key_hex.len() != 64 {
                return Err(format!("ENCRYPTION_MASTER_KEY must be 64 hex characters (got {})", key_hex.len()).into());
            }
            let mut key_bytes = [0u8; 32];
            for i in 0..32 {
                key_bytes[i] = u8::from_str_radix(&key_hex[i*2..i*2+2], 16)
                    .map_err(|e| format!("Invalid hex in ENCRYPTION_MASTER_KEY: {}", e))?;
            }
            key_bytes
        } else {
            return Err("ENCRYPTION_MASTER_KEY must be set for cluster mode".into());
        };

        let encryption = EncryptionHelper::new_with_key(master_key);

        log::info!("🌐 MPC Client initialized in CLUSTER mode");
        log::info!("   Cluster: {}", cluster_address);
        log::info!("   Program: {}", program_id);

        Ok(Self {
            mode: MpcMode::Cluster,
            cluster_address: Some(cluster_address),
            program_id: Some(program_id),
            simulator: None,
            redis,
            encryption,
        })
    }

    /// Get current operation mode
    pub fn mode(&self) -> &MpcMode {
        &self.mode
    }

    /// Get reference to Redis client for health checks
    pub fn redis(&self) -> &Arc<RedisClient> {
        &self.redis
    }

    /// List available instructions in simulator
    pub fn list_instructions(&self) -> Vec<String> {
        match &self.simulator {
            Some(sim) => sim.list_instructions(),
            None => vec![],
        }
    }

    /// Initialize the MPC computation environment
    ///
    /// This is a one-time setup that prepares the cluster for computations
    pub async fn initialize(&self) -> Result<String, Box<dyn Error>> {
        match self.mode {
            MpcMode::Local => {
                log::info!("📦 Initializing Local MPC environment");
                // In local mode, initialization is a no-op
                Ok("local_init_success".to_string())
            }
            MpcMode::Cluster => {
                log::info!("🌐 Initializing Arcium MPC cluster: {:?}", self.cluster_address);

                // TODO: Implement using arcium-anchor
                // 1. Call initialization instruction
                // 2. Set up cluster PDA using derive_cluster_pda!()
                // 3. Return initialization transaction signature

                // For now, return placeholder
                Ok("cluster_init_placeholder".to_string())
            }
        }
    }

    /// Queue a computation for MPC execution
    ///
    /// Submits encrypted inputs to the Arcium MPC cluster or local simulator
    pub async fn invoke_computation(
        &self,
        request: ComputationRequest,
    ) -> Result<String, Box<dyn Error>> {
        log::info!(
            "🚀 Invoking computation: {:?} for user: {}",
            request.computation_type,
            request.user_pubkey
        );

        // Generate computation ID
        let computation_id = format!("comp_{}", chrono::Utc::now().timestamp_millis());

        // Validate encrypted inputs
        for (i, input) in request.encrypted_inputs.iter().enumerate() {
            if !self.encryption.validate_encrypted_input(input)? {
                return Err(format!("Invalid encrypted input at index {}", i).into());
            }
        }

        // Create metadata
        let metadata = ComputationMetadata {
            computation_id: computation_id.clone(),
            user_pubkey: request.user_pubkey.clone(),
            computation_type: request.computation_type.clone(),
            status: ComputationStatus::Queued,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)?
                .as_secs(),
            completed_at: None,
            callback_url: None,
        };

        // Store metadata in Redis
        self.redis.store_computation_metadata(&metadata).await?;

        // Execute based on mode
        match self.mode {
            MpcMode::Local => {
                self.execute_local_computation(&computation_id, request).await?;
            }
            MpcMode::Cluster => {
                self.queue_cluster_computation(&computation_id, request).await?;
            }
        }

        Ok(computation_id)
    }

    /// Execute computation locally using simulator
    async fn execute_local_computation(
        &self,
        computation_id: &str,
        request: ComputationRequest,
    ) -> Result<(), Box<dyn Error>> {
        log::debug!("💻 Executing computation locally: {}", computation_id);

        // Update status to Processing
        self.redis.update_computation_status(computation_id, ComputationStatus::Processing).await?;

        // Get instruction name
        let instruction_name = match request.computation_type {
            ComputationType::ConfidentialTransfer => "encrypted_transfer",
            ComputationType::BatchPayroll => "batch_payroll",
            ComputationType::BalanceQuery => "query_balance",
            ComputationType::Custom(ref name) => name,
        };

        // Execute using simulator
        let simulator = self.simulator.as_ref()
            .ok_or("Simulator not initialized in Local mode")?;

        let result = simulator.execute_instruction(
            instruction_name,
            request.encrypted_inputs,
            &request.user_pubkey,
        )?;

        // Store result in Redis
        self.redis.store_result(computation_id, &result, 3600).await?;

        // Update status to Completed
        self.redis.update_computation_status(computation_id, ComputationStatus::Completed).await?;

        log::info!("✅ Local computation completed: {}", computation_id);

        Ok(())
    }

    /// Queue computation to Arcium cluster
    async fn queue_cluster_computation(
        &self,
        computation_id: &str,
        request: ComputationRequest,
    ) -> Result<(), Box<dyn Error>> {
        log::debug!("☁️  Queuing computation to cluster: {}", computation_id);

        // Update status to Processing
        self.redis.update_computation_status(computation_id, ComputationStatus::Processing).await?;

        // TODO: Implement using arcium-anchor::queue_computation()
        // 1. Load compiled .arcis instruction
        // 2. Build Solana transaction
        // 3. Submit to Arcium cluster
        // 4. Wait for callback

        // For now, mark as queued
        log::warn!("⚠️  Cluster mode not fully implemented yet");

        Ok(())
    }

    /// Poll for computation results
    ///
    /// Check if a computation has completed and retrieve results
    pub async fn get_computation_result(
        &self,
        computation_id: &str,
    ) -> Result<Option<ComputationResult>, Box<dyn Error>> {
        log::debug!("🔍 Polling computation result: {}", computation_id);

        // Check Redis for metadata
        let metadata = self.redis.get_computation_metadata(computation_id).await?;

        match metadata {
            Some(meta) => {
                match meta.status {
                    ComputationStatus::Completed => {
                        // Get result from Redis
                        let result = self.redis.get_result(computation_id).await?
                            .unwrap_or_default();

                        Ok(Some(ComputationResult {
                            computation_id: computation_id.to_string(),
                            status: "completed".to_string(),
                            result,
                            error: None,
                        }))
                    }
                    ComputationStatus::Failed => {
                        Ok(Some(ComputationResult {
                            computation_id: computation_id.to_string(),
                            status: "failed".to_string(),
                            result: vec![],
                            error: Some("Computation failed".to_string()),
                        }))
                    }
                    _ => {
                        // Still processing
                        Ok(None)
                    }
                }
            }
            None => Ok(None),
        }
    }

    /// Handle computation callback from MPC cluster
    ///
    /// Process results when the MPC cluster completes computation
    pub async fn handle_callback(
        &self,
        computation_id: String,
        encrypted_result: Vec<u8>,
        signature: String,
    ) -> Result<ComputationResult, Box<dyn Error>> {
        log::info!("📥 Handling callback for computation: {}", computation_id);

        // Verify signature from Arcium cluster
        if self.mode == MpcMode::Cluster {
            let cluster_pubkey = self.cluster_address.as_ref()
                .ok_or("Cluster address not set")?;

            let is_valid = self.encryption.verify_computation_signature(
                &encrypted_result,
                &signature,
                cluster_pubkey,
            )?;

            if !is_valid {
                log::error!("❌ Invalid signature from MPC cluster");
                return Err("Invalid signature from MPC cluster".into());
            }
        }

        // Store result in Redis
        self.redis.store_result(&computation_id, &encrypted_result, 3600).await?;

        // Update status to Completed
        self.redis.update_computation_status(&computation_id, ComputationStatus::Completed).await?;

        log::info!("✅ Callback processed successfully: {}", computation_id);

        Ok(ComputationResult {
            computation_id,
            status: "completed".to_string(),
            result: encrypted_result,
            error: None,
        })
    }

    /// Execute a confidential transfer
    ///
    /// Specialized method for encrypted token transfers
    pub async fn confidential_transfer(
        &self,
        from_pubkey: &str,
        to_pubkey: &str,
        encrypted_amount: Vec<u8>,
    ) -> Result<String, Box<dyn Error>> {
        log::info!(
            "💸 Initiating confidential transfer from {} to {}",
            from_pubkey,
            to_pubkey
        );

        let request = ComputationRequest {
            computation_type: ComputationType::ConfidentialTransfer,
            encrypted_inputs: vec![encrypted_amount],
            user_pubkey: from_pubkey.to_string(),
            metadata: serde_json::json!({
                "recipient": to_pubkey
            }),
        };

        self.invoke_computation(request).await
    }

    /// Execute a batch computation for payroll
    ///
    /// Process multiple transfers in a single MPC computation
    pub async fn batch_payroll(
        &self,
        payer_pubkey: &str,
        recipients: Vec<(String, Vec<u8>)>, // (recipient_pubkey, encrypted_amount)
    ) -> Result<String, Box<dyn Error>> {
        log::info!(
            "💼 Initiating batch payroll for {} recipients",
            recipients.len()
        );

        // Combine all encrypted amounts into single computation
        let encrypted_inputs: Vec<Vec<u8>> = recipients
            .iter()
            .map(|(_, amount)| amount.clone())
            .collect();

        let recipient_pubkeys: Vec<String> = recipients
            .iter()
            .map(|(pubkey, _)| pubkey.clone())
            .collect();

        let request = ComputationRequest {
            computation_type: ComputationType::BatchPayroll,
            encrypted_inputs,
            user_pubkey: payer_pubkey.to_string(),
            metadata: serde_json::json!({
                "recipients": recipient_pubkeys
            }),
        };

        self.invoke_computation(request).await
    }

    /// List all computations for a user
    pub async fn list_user_computations(
        &self,
        user_pubkey: &str,
        limit: usize,
    ) -> Result<Vec<ComputationMetadata>, Box<dyn Error>> {
        self.redis.list_user_computations(user_pubkey, limit).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore] // Requires Redis
    async fn test_mpc_client_local_mode() {
        let redis_url = "redis://127.0.0.1:6379";
        let redis = Arc::new(RedisClient::new(redis_url).unwrap());

        let client = MpcClient::new_local(redis, "build".to_string()).unwrap();
        assert_eq!(client.mode(), &MpcMode::Local);
    }

    #[tokio::test]
    #[ignore] // Requires Redis
    async fn test_mpc_client_cluster_mode() {
        let redis_url = "redis://127.0.0.1:6379";
        let redis = Arc::new(RedisClient::new(redis_url).unwrap());

        let client = MpcClient::new_cluster(
            redis,
            "cluster_address".to_string(),
            "program_id".to_string(),
        ).unwrap();
        assert_eq!(client.mode(), &MpcMode::Cluster);
    }
}
