// DEPRECATED: These account endpoints are not used in Phase 1.
// Phase 2 will use Arcium cluster's native account management and Solana program instructions.
// All endpoints return 501 Not Implemented.

use actix_web::{get, post, web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct SetupAccountRequest {
    pub user_pubkey: String,
    pub account_type: String,
}

#[derive(Serialize)]
pub struct SetupAccountResponse {
    pub account_address: String,
    pub status: String,
    pub message: String,
}

#[derive(Deserialize)]
pub struct InitializeVaultRequest {
    pub user_pubkey: String,
    pub initial_deposit: Option<u64>,
}

#[derive(Serialize)]
pub struct InitializeVaultResponse {
    pub vault_address: String,
    pub encrypted_keypair: String,
    pub initialization_tx: String,
    pub status: String,
}

#[derive(Serialize)]
pub struct AccountInfoResponse {
    pub account_address: String,
    pub account_type: String,
    pub owner: String,
    pub encrypted_balance: Option<String>,
    pub is_initialized: bool,
    pub created_at: u64,
}

/// DEPRECATED: Use Arcium cluster native account management in Phase 2
#[post("/account/setup")]
async fn setup_account(_req: web::Json<SetupAccountRequest>) -> impl Responder {
    HttpResponse::NotImplemented().json(serde_json::json!({
        "error": "deprecated",
        "message": "This endpoint is deprecated. Use Arcium cluster native account management."
    }))
}

/// DEPRECATED: Use Solana program initialization directly
#[post("/account/vault/initialize")]
async fn initialize_vault(_req: web::Json<InitializeVaultRequest>) -> impl Responder {
    HttpResponse::NotImplemented().json(serde_json::json!({
        "error": "deprecated",
        "message": "This endpoint is deprecated. Initialize vaults via Solana program instructions."
    }))
}

/// DEPRECATED: Query Solana accounts directly
#[get("/account/info/{account_address}")]
async fn get_account_info(_path: web::Path<String>) -> impl Responder {
    HttpResponse::NotImplemented().json(serde_json::json!({
        "error": "deprecated",
        "message": "This endpoint is deprecated. Query Solana RPC directly for account data."
    }))
}

/// DEPRECATED: Query encrypted balances via Solana RPC
#[get("/account/balance/{account_address}")]
async fn get_encrypted_balance(_path: web::Path<String>) -> impl Responder {
    HttpResponse::NotImplemented().json(serde_json::json!({
        "error": "deprecated",
        "message": "This endpoint is deprecated. Query encrypted balances from Solana accounts."
    }))
}

/// DEPRECATED: Use Prisma database queries via Next.js API routes
#[get("/account/list/{user_pubkey}")]
async fn list_user_accounts(_path: web::Path<String>) -> impl Responder {
    HttpResponse::NotImplemented().json(serde_json::json!({
        "error": "deprecated",
        "message": "This endpoint is deprecated. Use Prisma database queries via Next.js API routes."
    }))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(setup_account)
        .service(initialize_vault)
        .service(get_account_info)
        .service(get_encrypted_balance)
        .service(list_user_accounts);
}
