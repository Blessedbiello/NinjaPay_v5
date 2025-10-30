use super::encryption::EncryptionHelper;
use super::simulator::MpcSimulator;
use super::types::{
    ComputationMetadata, ComputationRequest, ComputationResult, ComputationStatus, ComputationType,
};
use crate::utils::{hmac_sha256_hex, load_master_key_from_env, load_secret_string, RedisClient};
use borsh::BorshSerialize;
use reqwest::Client;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    instruction::{AccountMeta, Instruction},
    message::Message,
    pubkey::Pubkey,
    signature::{Keypair, Signature},
    signer::Signer,
    transaction::Transaction,
};
use solana_transaction_status::UiTransactionEncoding;
use std::error::Error;
use std::str::FromStr;
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
    program_id: Option<Pubkey>,
    simulator: Option<MpcSimulator>,
    redis: Arc<RedisClient>,
    encryption: EncryptionHelper,
    rpc_client: Option<Arc<RpcClient>>,
    payer_keypair: Option<Arc<Keypair>>,
}

const CLUSTER_SEED: &[u8] = b"Cluster";
const ARCIUM_FEE_POOL_ACCOUNT: Pubkey = Pubkey::new_from_array([
    94, 87, 49, 175, 232, 200, 92, 37, 140, 243, 194, 109, 249, 141, 31, 66, 59, 91, 113, 165, 232,
    167, 54, 30, 164, 219, 3, 225, 61, 227, 94, 8,
]);
const ARCIUM_CLOCK_ACCOUNT: Pubkey = Pubkey::new_from_array([
    212, 85, 34, 0, 53, 147, 95, 180, 158, 156, 108, 40, 138, 177, 241, 37, 193, 113, 49, 48, 98,
    57, 195, 10, 201, 244, 92, 111, 3, 191, 25, 130,
]);

#[derive(BorshSerialize)]
struct InitClusterArgs {
    max_size: u32,
    cluster_id: u32,
    cu_price: u64,
}

struct ClusterConfig {
    program_id: Pubkey,
    cluster_offset: u32,
    authority: Pubkey,
    max_size: u32,
    cu_price: u64,
}

impl ClusterConfig {
    fn from_env(default_authority: &Pubkey, program_id: Pubkey) -> Result<Self, Box<dyn Error>> {
        let cluster_offset = std::env::var("ARCIUM_CLUSTER_OFFSET")
            .map(|val| val.parse::<u32>())
            .unwrap_or(Ok(0))
            .map_err(|e| format!("Invalid ARCIUM_CLUSTER_OFFSET: {e}"))?;

        let authority = if let Ok(authority_str) = std::env::var("ARCIUM_CLUSTER_AUTHORITY") {
            authority_str
                .parse::<Pubkey>()
                .map_err(|e| format!("Invalid ARCIUM_CLUSTER_AUTHORITY: {e}"))?
        } else {
            *default_authority
        };

        let max_size = std::env::var("ARCIUM_CLUSTER_MAX_SIZE")
            .map(|val| val.parse::<u32>())
            .unwrap_or(Ok(32))
            .map_err(|e| format!("Invalid ARCIUM_CLUSTER_MAX_SIZE: {e}"))?;

        let cu_price = std::env::var("ARCIUM_CLUSTER_CU_PRICE")
            .map(|val| val.parse::<u64>())
            .unwrap_or(Ok(1))
            .map_err(|e| format!("Invalid ARCIUM_CLUSTER_CU_PRICE: {e}"))?;

        Ok(Self {
            program_id,
            cluster_offset,
            authority,
            max_size,
            cu_price,
        })
    }

    fn cluster_account(&self) -> Pubkey {
        Pubkey::find_program_address(
            &[CLUSTER_SEED, &self.cluster_offset.to_le_bytes()],
            &self.program_id,
        )
        .0
    }
}

impl MpcClient {
    /// Create a new MPC client in Local mode (for development)
    pub fn new_local(redis: Arc<RedisClient>, build_path: String) -> Result<Self, Box<dyn Error>> {
        // Load encryption master key from environment
        let master_key = load_master_key_from_env("ENCRYPTION_MASTER_KEY")?;

        // Create encryption helper with loaded key
        let encryption = Arc::new(EncryptionHelper::new_with_key(master_key));

        // Create simulator with encryption
        let simulator = MpcSimulator::new(build_path, encryption.clone())?;

        log::info!("🔧 MPC Client initialized in LOCAL mode");
        log::info!(
            "   Available instructions: {:?}",
            simulator.list_instructions()
        );

        Ok(Self {
            mode: MpcMode::Local,
            cluster_address: None,
            program_id: None,
            simulator: Some(simulator),
            redis,
            encryption: (*encryption).clone(),
            rpc_client: None,
            payer_keypair: None,
        })
    }

    /// Create a new MPC client in Cluster mode (for production)
    pub fn new_cluster(
        redis: Arc<RedisClient>,
        cluster_address: String,
        program_id: String,
    ) -> Result<Self, Box<dyn Error>> {
        // Load encryption master key from environment
        let master_key = load_master_key_from_env("ENCRYPTION_MASTER_KEY")?;

        let encryption = EncryptionHelper::new_with_key(master_key);

        // Parse program ID
        let program_pubkey = program_id
            .parse::<Pubkey>()
            .map_err(|e| format!("Invalid program ID: {}", e))?;

        // Create RPC client
        let rpc_url = std::env::var("SOLANA_RPC_URL")
            .unwrap_or_else(|_| "https://api.devnet.solana.com".to_string());
        let rpc_client = Arc::new(RpcClient::new_with_commitment(
            rpc_url.clone(),
            CommitmentConfig::confirmed(),
        ));

        // Load payer keypair
        let keypair_path = std::env::var("SOLANA_KEYPAIR_PATH").unwrap_or_else(|_| {
            format!(
                "{}/.config/solana/id.json",
                std::env::var("HOME").unwrap_or_else(|_| ".".to_string())
            )
        });

        let payer_keypair = Arc::new(
            solana_sdk::signature::read_keypair_file(&keypair_path)
                .map_err(|e| format!("Failed to load keypair from {}: {}", keypair_path, e))?,
        );

        log::info!("🌐 MPC Client initialized in CLUSTER mode");
        log::info!("   Cluster: {}", cluster_address);
        log::info!("   Program: {}", program_pubkey);
        log::info!("   RPC URL: {}", rpc_url);
        log::info!("   Payer: {}", payer_keypair.pubkey());

        Ok(Self {
            mode: MpcMode::Cluster,
            cluster_address: Some(cluster_address),
            program_id: Some(program_pubkey),
            simulator: None,
            redis,
            encryption,
            rpc_client: Some(rpc_client),
            payer_keypair: Some(payer_keypair),
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
                log::info!(
                    "🌐 Initializing Arcium MPC cluster: {:?}",
                    self.cluster_address
                );

                let rpc_client = self
                    .rpc_client
                    .as_ref()
                    .ok_or("RPC client not initialized")?;
                let payer = self
                    .payer_keypair
                    .as_ref()
                    .ok_or("Payer keypair not initialized")?;
                let program_id = self.program_id.as_ref().ok_or("Program ID not set")?;

                let cluster_config = ClusterConfig::from_env(&payer.pubkey(), *program_id)?;
                let cluster_pda = cluster_config.cluster_account();

                log::info!("   Cluster PDA: {}", cluster_pda);

                // Check if already initialized
                match rpc_client.get_account(&cluster_pda) {
                    Ok(_) => {
                        log::info!("   Cluster already initialized");
                        return Ok(format!("already_initialized_{}", cluster_pda));
                    }
                    Err(_) => {
                        log::info!(
                            "   Cluster not yet initialized, creating (offset={}, authority={}, max_size={}, cu_price={})...",
                            cluster_config.cluster_offset,
                            cluster_config.authority,
                            cluster_config.max_size,
                            cluster_config.cu_price
                        );
                    }
                }

                let args = InitClusterArgs {
                    max_size: cluster_config.max_size,
                    cluster_id: cluster_config.cluster_offset,
                    cu_price: cluster_config.cu_price,
                };

                let mut instruction_data =
                    super::discriminators::anchor_discriminator("init_cluster").to_vec();
                instruction_data.extend_from_slice(&args.try_to_vec()?);

                let instruction = Instruction {
                    program_id: *program_id,
                    accounts: vec![
                        AccountMeta::new(payer.pubkey(), true),
                        AccountMeta::new(cluster_pda, false),
                        AccountMeta::new_readonly(cluster_config.authority, false),
                        AccountMeta::new_readonly(ARCIUM_FEE_POOL_ACCOUNT, false),
                        AccountMeta::new_readonly(solana_sdk::system_program::id(), false),
                        AccountMeta::new_readonly(ARCIUM_CLOCK_ACCOUNT, false),
                    ],
                    data: instruction_data,
                };

                let recent_blockhash = rpc_client.get_latest_blockhash()?;
                let message = Message::new(&[instruction], Some(&payer.pubkey()));
                let mut transaction = Transaction::new_unsigned(message);
                transaction
                    .try_sign(&[payer.as_ref()], recent_blockhash)
                    .map_err(|e| {
                        format!("Failed to sign cluster initialization transaction: {}", e)
                    })?;

                let signature = rpc_client.send_and_confirm_transaction(&transaction)?;

                log::info!("✅ Cluster initialized: {}", signature);
                Ok(signature.to_string())
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
            callback_url: request.callback_url.clone(),
            entity_type: request.entity_type.clone(),
            reference_id: request.reference_id.clone(),
            metadata: request.metadata.clone(),
            cluster_tx_signature: None,
            attestation: None,
        };

        // Store metadata in Redis
        self.redis.store_computation_metadata(&metadata).await?;

        // Execute based on mode
        match self.mode {
            MpcMode::Local => {
                self.execute_local_computation(&computation_id, request)
                    .await?;
            }
            MpcMode::Cluster => {
                self.queue_cluster_computation(&computation_id, request)
                    .await?;
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
        self.redis
            .update_computation_status(computation_id, ComputationStatus::Processing)
            .await?;

        // Get instruction name
        let instruction_name = match request.computation_type {
            ComputationType::ConfidentialTransfer => "encrypted_transfer",
            ComputationType::BatchPayroll => "batch_payroll",
            ComputationType::BalanceQuery => "query_balance",
            ComputationType::Custom(ref name) => name,
        };

        // Execute using simulator
        let simulator = self
            .simulator
            .as_ref()
            .ok_or("Simulator not initialized in Local mode")?;

        let result = simulator.execute_instruction(
            instruction_name,
            request.encrypted_inputs,
            &request.user_pubkey,
        )?;

        // Store result in Redis
        self.redis
            .store_result(computation_id, &result, 3600)
            .await?;

        // Update status to Completed
        self.redis
            .update_computation_status(computation_id, ComputationStatus::Completed)
            .await?;

        // Store attestation metadata for simulator execution
        if let Some(mut metadata) = self.redis.get_computation_metadata(computation_id).await? {
            metadata.attestation = Some(serde_json::json!({
                "mode": "local-simulator",
                "instruction": instruction_name,
                "completed_at": chrono::Utc::now().to_rfc3339(),
            }));
            self.redis.store_computation_metadata(&metadata).await?;
        }

        self.notify_callback(
            computation_id,
            ComputationStatus::Completed,
            Some(&result),
            None,
        )
        .await?;

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
        self.redis
            .update_computation_status(computation_id, ComputationStatus::Processing)
            .await?;

        let rpc_client = self
            .rpc_client
            .as_ref()
            .ok_or("RPC client not initialized")?;
        let payer = self
            .payer_keypair
            .as_ref()
            .ok_or("Payer keypair not initialized")?;
        let program_id = self.program_id.as_ref().ok_or("Program ID not set")?;

        // Parse user pubkey
        let user_pubkey = request
            .user_pubkey
            .parse::<Pubkey>()
            .map_err(|e| format!("Invalid user pubkey: {}", e))?;

        // Derive vault PDA for user
        let (vault_pda, _bump) =
            Pubkey::find_program_address(&[b"vault", user_pubkey.as_ref()], program_id);

        let cluster_config = ClusterConfig::from_env(&payer.pubkey(), *program_id)?;
        let cluster_pda = cluster_config.cluster_account();

        log::info!("   User vault PDA: {}", vault_pda);
        log::info!("   Cluster PDA: {}", cluster_pda);

        // Get instruction name
        let instruction_name = match request.computation_type {
            ComputationType::ConfidentialTransfer => "confidential_transfer",
            ComputationType::BatchPayroll => "batch_payroll",
            ComputationType::BalanceQuery => "query_balance",
            ComputationType::Custom(ref name) => name,
        };

        // Build instruction data with proper Anchor discriminator
        // Anchor uses: SHA256("global:{instruction_name}")[..8]
        let discriminator = match request.computation_type {
            ComputationType::ConfidentialTransfer => {
                super::discriminators::ninjapay_vault::confidential_transfer()
            }
            ComputationType::BatchPayroll => {
                super::discriminators::anchor_discriminator("batch_payroll")
            }
            ComputationType::BalanceQuery => {
                super::discriminators::anchor_discriminator("query_balance")
            }
            ComputationType::Custom(ref name) => super::discriminators::anchor_discriminator(name),
        };

        log::debug!("Using discriminator: {:02x?}", discriminator);
        let mut ix_data = discriminator.to_vec();

        // Serialize encrypted inputs (simple length-prefixed format)
        for input in &request.encrypted_inputs {
            let len_bytes = (input.len() as u32).to_le_bytes();
            ix_data.extend_from_slice(&len_bytes);
            ix_data.extend_from_slice(input);
        }

        // Get recipient from metadata if available
        let recipient_pubkey = if let Some(recipient_str) = request.metadata.get("recipient") {
            recipient_str
                .as_str()
                .and_then(|s| s.parse::<Pubkey>().ok())
                .unwrap_or(user_pubkey)
        } else {
            user_pubkey
        };

        // Build instruction accounts
        let accounts = vec![
            AccountMeta::new(vault_pda, false),
            AccountMeta::new(user_pubkey, true), // User must sign
            AccountMeta::new_readonly(cluster_pda, false),
            AccountMeta::new(recipient_pubkey, false),
        ];

        let instruction = Instruction::new_with_bytes(*program_id, &ix_data, accounts);

        let recent_blockhash = rpc_client.get_latest_blockhash()?;
        let message = Message::new(&[instruction], Some(&payer.pubkey()));
        let mut transaction = Transaction::new_unsigned(message);
        transaction.partial_sign(&[payer.as_ref()], recent_blockhash);

        let message_bytes = transaction.message_data();

        if user_pubkey != payer.pubkey() {
            let signature_str = request.user_signature.as_ref().ok_or_else(|| {
                "User signature required for cluster computations when fee payer differs"
                    .to_string()
            })?;
            let user_signature = Signature::from_str(signature_str)
                .map_err(|e| format!("Invalid user signature: {}", e))?;

            let signer_index = transaction
                .message
                .account_keys
                .iter()
                .position(|key| key == &user_pubkey)
                .ok_or("User account not present in transaction account keys")?;

            if signer_index >= transaction.message.header.num_required_signatures as usize {
                return Err(
                    "User account is not flagged as a signer in the transaction header".into(),
                );
            }

            if !user_signature.verify(user_pubkey.as_ref(), &message_bytes) {
                return Err(
                    "Provided user signature does not verify against the transaction message"
                        .into(),
                );
            }

            transaction.signatures[signer_index] = user_signature;
        }

        // Send transaction
        let signature = rpc_client.send_transaction(&transaction)?;

        log::info!(
            "✅ Computation queued to cluster: {} (tx: {})",
            computation_id,
            signature
        );

        // Store transaction signature in metadata
        let mut metadata = self
            .redis
            .get_computation_metadata(computation_id)
            .await?
            .ok_or("Computation metadata not found")?;
        metadata.cluster_tx_signature = Some(signature.to_string());
        metadata.attestation = Some(serde_json::json!({
            "mode": "cluster",
            "cluster_pda": cluster_pda.to_string(),
            "cluster_offset": cluster_config.cluster_offset,
            "submitted_at": chrono::Utc::now().to_rfc3339(),
            "tx_signature": signature.to_string(),
            "recipient": recipient_pubkey.to_string(),
        }));
        self.redis.store_computation_metadata(&metadata).await?;

        // In cluster mode, we wait for callback from the MPC network
        // The callback will update the status to Completed and store the result
        log::info!(
            "⏳ Waiting for MPC cluster callback for: {}",
            computation_id
        );

        Ok(())
    }

    async fn notify_callback(
        &self,
        computation_id: &str,
        status: ComputationStatus,
        result: Option<&[u8]>,
        error: Option<&str>,
    ) -> Result<(), Box<dyn Error>> {
        let metadata = match self.redis.get_computation_metadata(computation_id).await? {
            Some(meta) => meta,
            None => return Ok(()),
        };

        let callback_url = metadata
            .callback_url
            .clone()
            .filter(|url| !url.starts_with("tx:"));

        let Some(callback_url) = callback_url else {
            return Ok(());
        };

        let status_str = match status {
            ComputationStatus::Queued => "QUEUED",
            ComputationStatus::Processing => "RUNNING",
            ComputationStatus::Completed => "SUCCEEDED",
            ComputationStatus::Failed => "FAILED",
            ComputationStatus::Cancelled => "CANCELLED",
        };

        let mut payload = serde_json::json!({
            "computation_id": computation_id,
            "status": status_str,
        });

        if let Some(entity) = metadata.entity_type.clone() {
            payload["entity_type"] = serde_json::Value::String(entity);
        }

        if let Some(reference) = metadata.reference_id.clone() {
            payload["reference_id"] = serde_json::Value::String(reference);
        }

        if metadata.metadata != serde_json::Value::Null {
            payload["metadata"] = metadata.metadata.clone();
        }

        if let Some(tx_sig) = metadata.cluster_tx_signature.clone() {
            payload["tx_signature"] = serde_json::Value::String(tx_sig);
        }

        if let Some(err_msg) = error {
            payload["error"] = serde_json::Value::String(err_msg.to_string());
        }

        if let Some(bytes) = result {
            let mut result_obj = serde_json::Map::new();
            result_obj.insert(
                "ciphertext".to_string(),
                serde_json::Value::String(base64::encode(bytes)),
            );

            if bytes.len() >= 12 {
                result_obj.insert(
                    "nonce".to_string(),
                    serde_json::Value::String(base64::encode(&bytes[..12])),
                );
            }

            payload["result"] = serde_json::Value::Object(result_obj);
        }

        let secret_hex = load_secret_string("ARCIUM_CALLBACK_SECRET")?;
        let secret_bytes = hex::decode(secret_hex.trim())
            .map_err(|e| format!("ARCIUM_CALLBACK_SECRET must be hex-encoded: {e}"))?;

        if payload.get("attestation").is_none() {
            payload["attestation"] = metadata
                .attestation
                .clone()
                .unwrap_or(serde_json::Value::Null);
        }

        let payload_bytes = serde_json::to_vec(&payload)?;
        let signature = hmac_sha256_hex(&secret_bytes, &payload_bytes)?;

        let client = Client::new();
        match client
            .post(&callback_url)
            .header("X-Arcium-Signature", signature)
            .header(
                "X-Arcium-Timestamp",
                chrono::Utc::now().timestamp().to_string(),
            )
            .json(&payload)
            .send()
            .await
        {
            Ok(response) => {
                if !response.status().is_success() {
                    log::warn!(
                        "⚠️  Callback responded with status {} for computation {}",
                        response.status(),
                        computation_id
                    );
                } else {
                    log::info!(
                        "📬 Callback delivered to {} for computation {}",
                        callback_url,
                        computation_id
                    );
                }
            }
            Err(err) => {
                log::error!("❌ Failed to deliver callback to {}: {}", callback_url, err);
            }
        }

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
                        let result = self
                            .redis
                            .get_result(computation_id)
                            .await?
                            .unwrap_or_default();

                        Ok(Some(ComputationResult {
                            computation_id: computation_id.to_string(),
                            status: "completed".to_string(),
                            result,
                            error: None,
                        }))
                    }
                    ComputationStatus::Failed => Ok(Some(ComputationResult {
                        computation_id: computation_id.to_string(),
                        status: "failed".to_string(),
                        result: vec![],
                        error: Some("Computation failed".to_string()),
                    })),
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
            let program_id = self.program_id.as_ref().ok_or("Program ID not set")?;

            // Parse signature string as Solana transaction signature
            let tx_signature = match signature.parse::<Signature>() {
                Ok(sig) => sig,
                Err(e) => {
                    let msg = format!("Invalid signature format: {}", e);
                    self.redis
                        .update_computation_status(&computation_id, ComputationStatus::Failed)
                        .await?;
                    self.notify_callback(
                        &computation_id,
                        ComputationStatus::Failed,
                        None,
                        Some(&msg),
                    )
                    .await?;
                    return Err(msg.into());
                }
            };

            // Verify the transaction exists and is confirmed on-chain
            if let Some(rpc_client) = &self.rpc_client {
                match rpc_client.get_transaction(&tx_signature, UiTransactionEncoding::Json) {
                    Ok(confirmed_tx) => {
                        log::info!("✅ Transaction verified on-chain: {}", tx_signature);

                        // Additional validation: Check that the transaction invoked our program
                        let tx_meta = confirmed_tx
                            .transaction
                            .meta
                            .ok_or("Transaction metadata not available")?;

                        if tx_meta.err.is_some() {
                            let msg = "Transaction failed on-chain".to_string();
                            log::error!("❌ {}", msg);
                            self.redis
                                .update_computation_status(
                                    &computation_id,
                                    ComputationStatus::Failed,
                                )
                                .await?;
                            self.notify_callback(
                                &computation_id,
                                ComputationStatus::Failed,
                                None,
                                Some(&msg),
                            )
                            .await?;
                            return Err(msg.into());
                        }

                        log::info!("✅ Transaction successful");
                    }
                    Err(e) => {
                        let msg = format!("Failed to verify transaction: {}", e);
                        log::error!("❌ {}", msg);
                        self.redis
                            .update_computation_status(&computation_id, ComputationStatus::Failed)
                            .await?;
                        self.notify_callback(
                            &computation_id,
                            ComputationStatus::Failed,
                            None,
                            Some(&msg),
                        )
                        .await?;
                        return Err(msg.into());
                    }
                }
            } else {
                log::warn!("⚠️  RPC client not available, skipping on-chain verification");
            }
        }

        // Store result in Redis
        self.redis
            .store_result(&computation_id, &encrypted_result, 3600)
            .await?;

        // Update status to Completed
        self.redis
            .update_computation_status(&computation_id, ComputationStatus::Completed)
            .await?;

        self.notify_callback(
            &computation_id,
            ComputationStatus::Completed,
            Some(&encrypted_result),
            None,
        )
        .await?;

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
            callback_url: None,
            entity_type: None,
            reference_id: None,
            user_signature: None,
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
            callback_url: None,
            entity_type: None,
            reference_id: None,
            user_signature: None,
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
        std::env::set_var(
            "ENCRYPTION_MASTER_KEY",
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        );

        let redis_url = "redis://127.0.0.1:6379";
        let redis = Arc::new(RedisClient::new(redis_url).unwrap());

        let client = MpcClient::new_local(redis, "build".to_string()).unwrap();
        assert_eq!(client.mode(), &MpcMode::Local);
    }

    #[tokio::test]
    #[ignore] // Requires Redis
    async fn test_mpc_client_cluster_mode() {
        std::env::set_var(
            "ENCRYPTION_MASTER_KEY",
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        );

        let redis_url = "redis://127.0.0.1:6379";
        let redis = Arc::new(RedisClient::new(redis_url).unwrap());

        let client = MpcClient::new_cluster(
            redis,
            "cluster_address".to_string(),
            "program_id".to_string(),
        )
        .unwrap();
        assert_eq!(client.mode(), &MpcMode::Cluster);
    }
}
