use actix_web::{post, get, web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use crate::mpc::{InstructionLoader, InstructionInfo, ComputationRequest as MpcRequest, ComputationType};
use crate::AppState;

#[derive(Deserialize)]
pub struct InvokeComputationRequest {
    pub computation_type: String,
    pub encrypted_inputs: Vec<String>, // Base64 or hex encoded
    pub user_pubkey: String,
    pub callback_url: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Serialize)]
pub struct InvokeComputationResponse {
    pub computation_id: String,
    pub status: String,
    pub message: String,
}

#[derive(Deserialize)]
pub struct ComputationStatusQuery {
    pub computation_id: String,
}

#[derive(Serialize)]
pub struct ComputationStatusResponse {
    pub computation_id: String,
    pub status: String,
    pub result: Option<String>, // Base64 encoded
    pub error: Option<String>,
    pub created_at: u64,
    pub completed_at: Option<u64>,
}

#[derive(Deserialize)]
pub struct ComputationCallbackRequest {
    pub computation_id: String,
    pub result: String, // Base64 encoded
    pub signature: String,
}

/// Invoke a new MPC computation
///
/// This endpoint accepts encrypted inputs and queues them for execution
/// in the Arcium MPC cluster or local simulator.
#[post("/computation/invoke")]
async fn invoke_computation(
    app_state: web::Data<AppState>,
    req: web::Json<InvokeComputationRequest>,
) -> impl Responder {
    log::info!(
        "📥 Received computation request: {} for user: {}",
        req.computation_type,
        req.user_pubkey
    );

    // Parse computation type
    let computation_type = match req.computation_type.as_str() {
        "confidential_transfer" | "encrypted_transfer" => ComputationType::ConfidentialTransfer,
        "batch_payroll" => ComputationType::BatchPayroll,
        "balance_query" | "query_balance" => ComputationType::BalanceQuery,
        custom => ComputationType::Custom(custom.to_string()),
    };

    // Decode encrypted inputs from base64/hex
    let encrypted_inputs: Result<Vec<Vec<u8>>, _> = req
        .encrypted_inputs
        .iter()
        .map(|input| {
            // Try base64 first, then hex
            base64::decode(input)
                .or_else(|_| hex::decode(input))
                .map_err(|e| format!("Invalid input encoding: {}", e))
        })
        .collect();

    let encrypted_inputs = match encrypted_inputs {
        Ok(inputs) => inputs,
        Err(e) => {
            log::error!("❌ Failed to decode inputs: {}", e);
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "invalid_input",
                "message": e
            }));
        }
    };

    // Create MPC request
    let mpc_request = MpcRequest {
        computation_type,
        encrypted_inputs,
        user_pubkey: req.user_pubkey.clone(),
        metadata: req.metadata.clone().unwrap_or(serde_json::json!({})),
    };

    // Invoke computation
    match app_state.mpc_client.invoke_computation(mpc_request).await {
        Ok(computation_id) => {
            log::info!("✅ Computation queued: {}", computation_id);

            HttpResponse::Ok().json(InvokeComputationResponse {
                computation_id: computation_id.clone(),
                status: "queued".to_string(),
                message: format!("Computation {} queued successfully", computation_id),
            })
        }
        Err(e) => {
            log::error!("❌ Failed to invoke computation: {}", e);

            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "computation_failed",
                "message": format!("Failed to invoke computation: {}", e)
            }))
        }
    }
}

/// Get computation status
///
/// Check the status of a previously invoked computation
#[get("/computation/status")]
async fn get_computation_status(
    app_state: web::Data<AppState>,
    query: web::Query<ComputationStatusQuery>,
) -> impl Responder {
    log::debug!("🔍 Status check for: {}", query.computation_id);

    match app_state.mpc_client.get_computation_result(&query.computation_id).await {
        Ok(Some(result)) => {
            log::debug!("✅ Found result for: {}", query.computation_id);

            // Encode result as base64
            let result_base64 = if !result.result.is_empty() {
                Some(base64::encode(&result.result))
            } else {
                None
            };

            HttpResponse::Ok().json(ComputationStatusResponse {
                computation_id: query.computation_id.clone(),
                status: result.status,
                result: result_base64,
                error: result.error,
                created_at: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                completed_at: Some(
                    std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                ),
            })
        }
        Ok(None) => {
            log::debug!("⏳ Computation still processing: {}", query.computation_id);

            HttpResponse::Ok().json(ComputationStatusResponse {
                computation_id: query.computation_id.clone(),
                status: "processing".to_string(),
                result: None,
                error: None,
                created_at: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                completed_at: None,
            })
        }
        Err(e) => {
            log::error!("❌ Failed to get computation status: {}", e);

            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "status_check_failed",
                "message": format!("Failed to check status: {}", e)
            }))
        }
    }
}

/// Receive computation callback
///
/// This endpoint receives results from the Arcium MPC cluster
/// when computations complete
#[post("/computation/callback")]
async fn computation_callback(
    app_state: web::Data<AppState>,
    req: web::Json<ComputationCallbackRequest>,
) -> impl Responder {
    log::info!("📥 Callback received for: {}", req.computation_id);

    // Decode result from base64
    let encrypted_result = match base64::decode(&req.result) {
        Ok(result) => result,
        Err(e) => {
            log::error!("❌ Invalid result encoding: {}", e);
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "invalid_encoding",
                "message": "Result must be base64 encoded"
            }));
        }
    };

    // Handle callback
    match app_state
        .mpc_client
        .handle_callback(
            req.computation_id.clone(),
            encrypted_result,
            req.signature.clone(),
        )
        .await
    {
        Ok(result) => {
            log::info!("✅ Callback processed: {}", req.computation_id);

            HttpResponse::Ok().json(serde_json::json!({
                "status": "success",
                "computation_id": result.computation_id
            }))
        }
        Err(e) => {
            log::error!("❌ Failed to process callback: {}", e);

            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "callback_failed",
                "message": format!("Failed to process callback: {}", e)
            }))
        }
    }
}

/// List recent computations for a user
#[get("/computation/list/{user_pubkey}")]
async fn list_user_computations(
    app_state: web::Data<AppState>,
    path: web::Path<String>,
) -> impl Responder {
    let user_pubkey = path.into_inner();
    log::debug!("📋 Listing computations for: {}", user_pubkey);

    match app_state
        .mpc_client
        .list_user_computations(&user_pubkey, 50)
        .await
    {
        Ok(computations) => {
            log::debug!("✅ Found {} computations", computations.len());

            HttpResponse::Ok().json(serde_json::json!({
                "computations": computations
            }))
        }
        Err(e) => {
            log::error!("❌ Failed to list computations: {}", e);

            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "list_failed",
                "message": format!("Failed to list computations: {}", e)
            }))
        }
    }
}

/// List available Arcium instructions
#[get("/computation/instructions")]
async fn list_instructions() -> impl Responder {
    let loader = InstructionLoader::new("build".to_string());

    let instructions: Vec<InstructionInfo> = vec![
        "encrypted_transfer",
        "batch_payroll",
        "query_balance",
        "validate_amount",
        "add_values",
    ]
    .iter()
    .filter_map(|name| loader.get_instruction_info(name))
    .collect();

    HttpResponse::Ok().json(serde_json::json!({
        "instructions": instructions
    }))
}

/// Get specific instruction details
#[get("/computation/instructions/{name}")]
async fn get_instruction_details(path: web::Path<String>) -> impl Responder {
    let name = path.into_inner();
    let loader = InstructionLoader::new("build".to_string());

    match loader.get_instruction_info(&name) {
        Some(info) => HttpResponse::Ok().json(info),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": "instruction_not_found",
            "message": format!("Instruction '{}' not found", name)
        })),
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(invoke_computation)
        .service(get_computation_status)
        .service(computation_callback)
        .service(list_user_computations)
        .service(list_instructions)
        .service(get_instruction_details);
}
