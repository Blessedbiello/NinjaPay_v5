use actix_web::{post, get, web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct InvokeComputationRequest {
    pub computation_type: String,
    pub encrypted_inputs: Vec<String>,
    pub user_pubkey: String,
    pub callback_url: Option<String>,
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
    pub result: Option<String>,
    pub error: Option<String>,
    pub created_at: u64,
    pub completed_at: Option<u64>,
}

#[derive(Deserialize)]
pub struct ComputationCallbackRequest {
    pub computation_id: String,
    pub result: String,
    pub signature: String,
}

/// Invoke a new MPC computation
///
/// This endpoint accepts encrypted inputs and queues them for execution
/// in the Arcium MPC cluster.
#[post("/computation/invoke")]
async fn invoke_computation(
    req: web::Json<InvokeComputationRequest>,
) -> impl Responder {
    log::info!(
        "Invoking computation type: {} for user: {}",
        req.computation_type,
        req.user_pubkey
    );

    // TODO: Implement actual Arcium computation invocation
    // 1. Validate encrypted inputs
    // 2. Queue computation using arcium-anchor::queue_computation()
    // 3. Store computation metadata in Redis
    // 4. Return computation ID

    let computation_id = generate_computation_id();

    HttpResponse::Ok().json(InvokeComputationResponse {
        computation_id: computation_id.clone(),
        status: "queued".to_string(),
        message: format!("Computation {} queued successfully", computation_id),
    })
}

/// Get computation status
///
/// Check the status of a previously invoked computation
#[get("/computation/status")]
async fn get_computation_status(
    query: web::Query<ComputationStatusQuery>,
) -> impl Responder {
    log::info!("Getting status for computation: {}", query.computation_id);

    // TODO: Implement actual status lookup from Redis
    // 1. Query Redis for computation metadata
    // 2. Check Arcium cluster for current status
    // 3. Return status and results if available

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

/// Receive computation callback
///
/// This endpoint receives results from the Arcium MPC cluster
/// when computations complete
#[post("/computation/callback")]
async fn computation_callback(
    req: web::Json<ComputationCallbackRequest>,
) -> impl Responder {
    log::info!("Received callback for computation: {}", req.computation_id);

    // TODO: Implement callback handling
    // 1. Verify callback signature from Arcium
    // 2. Store results in Redis
    // 3. Trigger user notification if callback_url was provided
    // 4. Update computation status

    HttpResponse::Ok().json(serde_json::json!({
        "status": "received",
        "computation_id": req.computation_id
    }))
}

/// List recent computations for a user
#[get("/computation/list/{user_pubkey}")]
async fn list_user_computations(
    path: web::Path<String>,
) -> impl Responder {
    let user_pubkey = path.into_inner();
    log::info!("Listing computations for user: {}", user_pubkey);

    // TODO: Implement computation listing from Redis
    // Query all computations for this user

    HttpResponse::Ok().json(serde_json::json!({
        "computations": []
    }))
}

fn generate_computation_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    format!("comp_{}", timestamp)
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(invoke_computation)
        .service(get_computation_status)
        .service(computation_callback)
        .service(list_user_computations);
}
