use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ComputationType {
    ConfidentialTransfer,
    BatchPayroll,
    BalanceQuery,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComputationRequest {
    pub computation_type: ComputationType,
    pub encrypted_inputs: Vec<Vec<u8>>,
    pub user_pubkey: String,
    pub metadata: serde_json::Value,
    pub callback_url: Option<String>,
    pub entity_type: Option<String>,
    pub reference_id: Option<String>,
    #[serde(default)]
    pub user_signature: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComputationResult {
    pub computation_id: String,
    pub status: String,
    pub result: Vec<u8>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusterInfo {
    pub cluster_address: String,
    pub program_id: String,
    pub is_initialized: bool,
    pub computation_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedTransferParams {
    pub from_pubkey: String,
    pub to_pubkey: String,
    pub encrypted_amount: Vec<u8>,
    pub memo: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchPayrollParams {
    pub payer_pubkey: String,
    pub recipients: Vec<PayrollRecipient>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PayrollRecipient {
    pub recipient_pubkey: String,
    pub encrypted_amount: Vec<u8>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComputationMetadata {
    pub computation_id: String,
    pub user_pubkey: String,
    pub computation_type: ComputationType,
    pub status: ComputationStatus,
    pub created_at: u64,
    pub completed_at: Option<u64>,
    #[serde(default)]
    pub callback_url: Option<String>,
    #[serde(default)]
    pub entity_type: Option<String>,
    #[serde(default)]
    pub reference_id: Option<String>,
    #[serde(default)]
    pub metadata: serde_json::Value,
    #[serde(default)]
    pub cluster_tx_signature: Option<String>,
    #[serde(default)]
    pub attestation: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ComputationStatus {
    Queued,
    Processing,
    Completed,
    Failed,
    Cancelled,
}

impl std::fmt::Display for ComputationStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ComputationStatus::Queued => write!(f, "queued"),
            ComputationStatus::Processing => write!(f, "processing"),
            ComputationStatus::Completed => write!(f, "completed"),
            ComputationStatus::Failed => write!(f, "failed"),
            ComputationStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}
