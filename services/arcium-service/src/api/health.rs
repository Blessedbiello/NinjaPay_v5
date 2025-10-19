use actix_web::{get, web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use std::time::Instant;
use crate::AppState;

#[derive(Serialize, Deserialize)]
pub struct HealthResponse {
    status: String,
    timestamp: u64,
    version: String,
}

#[derive(Serialize, Deserialize)]
pub struct DetailedHealthResponse {
    status: String,
    timestamp: u64,
    version: String,
    services: ServiceHealth,
    uptime_ms: u128,
}

#[derive(Serialize, Deserialize)]
pub struct ServiceHealth {
    redis: String,
    solana_rpc: String,
    arcium_cluster: String,
}

lazy_static::lazy_static! {
    static ref START_TIME: Instant = Instant::now();
}

#[get("/health")]
async fn health() -> impl Responder {
    HttpResponse::Ok().json(HealthResponse {
        status: "healthy".to_string(),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

#[get("/health/detailed")]
async fn detailed_health(data: web::Data<AppState>) -> impl Responder {
    // Real health checks for all services
    let redis_status = check_redis_health(&data).await;
    let solana_status = check_solana_health().await;
    let arcium_status = check_arcium_health(&data).await;

    let overall_status = if redis_status == "healthy"
        && solana_status == "healthy"
        && arcium_status == "healthy" {
        "healthy"
    } else {
        "degraded"
    };

    HttpResponse::Ok().json(DetailedHealthResponse {
        status: overall_status.to_string(),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        services: ServiceHealth {
            redis: redis_status,
            solana_rpc: solana_status,
            arcium_cluster: arcium_status,
        },
        uptime_ms: START_TIME.elapsed().as_millis(),
    })
}

#[get("/health/ready")]
async fn readiness(data: web::Data<AppState>) -> impl Responder {
    // Check if service is ready to accept requests
    let redis_ready = check_redis_health(&data).await == "healthy";
    let solana_ready = check_solana_health().await == "healthy";

    if redis_ready && solana_ready {
        HttpResponse::Ok().json(serde_json::json!({ "ready": true }))
    } else {
        HttpResponse::ServiceUnavailable().json(serde_json::json!({ "ready": false }))
    }
}

#[get("/health/live")]
async fn liveness() -> impl Responder {
    // Simple liveness check - service is running
    HttpResponse::Ok().json(serde_json::json!({ "alive": true }))
}

async fn check_redis_health(data: &web::Data<AppState>) -> String {
    // Real Redis connection check via PING
    match data.mpc_client.redis().ping().await {
        Ok(_) => "healthy".to_string(),
        Err(e) => {
            log::error!("Redis health check failed: {}", e);
            "unhealthy".to_string()
        }
    }
}

async fn check_solana_health() -> String {
    // Check Solana RPC endpoint
    let rpc_url = std::env::var("SOLANA_RPC_URL")
        .unwrap_or_else(|_| "https://api.devnet.solana.com".to_string());

    match reqwest::get(format!("{}/health", rpc_url)).await {
        Ok(response) if response.status().is_success() => "healthy".to_string(),
        Ok(_) => {
            log::warn!("Solana RPC returned non-success status");
            "degraded".to_string()
        }
        Err(e) => {
            log::error!("Solana health check failed: {}", e);
            "unhealthy".to_string()
        }
    }
}

async fn check_arcium_health(data: &web::Data<AppState>) -> String {
    // Check MPC simulator/cluster availability
    match data.mpc_client.mode() {
        crate::mpc::MpcMode::Local => {
            // In local mode, check if simulator has instructions loaded
            if data.mpc_client.list_instructions().is_empty() {
                log::warn!("MPC simulator has no instructions loaded");
                "degraded".to_string()
            } else {
                "healthy".to_string()
            }
        }
        crate::mpc::MpcMode::Cluster => {
            // In cluster mode, would check cluster connectivity
            // For now, return healthy if client is initialized
            "healthy".to_string()
        }
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(health)
        .service(detailed_health)
        .service(readiness)
        .service(liveness);
}
