use actix_web::{get, web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use std::time::Instant;

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
async fn detailed_health() -> impl Responder {
    // TODO: Implement actual health checks for services
    let redis_status = check_redis_health().await;
    let solana_status = check_solana_health().await;
    let arcium_status = check_arcium_health().await;

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
async fn readiness() -> impl Responder {
    // Check if service is ready to accept requests
    let redis_ready = check_redis_health().await == "healthy";
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

async fn check_redis_health() -> String {
    // TODO: Implement actual Redis connection check
    "healthy".to_string()
}

async fn check_solana_health() -> String {
    // TODO: Implement actual Solana RPC health check
    "healthy".to_string()
}

async fn check_arcium_health() -> String {
    // TODO: Implement actual Arcium cluster health check
    "healthy".to_string()
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(health)
        .service(detailed_health)
        .service(readiness)
        .service(liveness);
}
