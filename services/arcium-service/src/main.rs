mod api;
mod mpc;
mod utils;

use actix_cors::Cors;
use actix_web::{middleware::Logger, web, App, HttpServer};
use env_logger::Env;
use std::io;
use std::sync::Arc;

use mpc::{MpcClient, MpcMode};
use utils::RedisClient;

/// Application state shared across all requests
pub struct AppState {
    pub mpc_client: Arc<MpcClient>,
}

#[actix_web::main]
async fn main() -> io::Result<()> {
    // Load .env file
    dotenv::dotenv().ok();

    // Initialize logger
    env_logger::init_from_env(Env::default().default_filter_or("info"));

    log::info!("🚀 Starting Arcium Service...");

    // Load configuration from environment
    let port = std::env::var("ARCIUM_SERVICE_PORT")
        .unwrap_or_else(|_| "8002".to_string())
        .parse::<u16>()
        .expect("Invalid port");

    let redis_url =
        std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());

    let mpc_mode = std::env::var("MPC_MODE").unwrap_or_else(|_| "local".to_string());

    // Initialize Redis client
    log::info!("📦 Connecting to Redis: {}", redis_url);
    let redis_client = Arc::new(RedisClient::new(&redis_url).map_err(|e| {
        io::Error::new(
            io::ErrorKind::Other,
            format!("Redis connection failed: {}", e),
        )
    })?);

    // Initialize MPC client based on mode
    let mpc_client = if mpc_mode.to_lowercase() == "cluster" {
        let cluster_address = std::env::var("ARCIUM_CLUSTER_ADDRESS").map_err(|_| {
            io::Error::new(
                io::ErrorKind::Other,
                "ARCIUM_CLUSTER_ADDRESS not set for cluster mode",
            )
        })?;
        let program_id = std::env::var("ARCIUM_PROGRAM_ID").map_err(|_| {
            io::Error::new(
                io::ErrorKind::Other,
                "ARCIUM_PROGRAM_ID not set for cluster mode",
            )
        })?;

        MpcClient::new_cluster(redis_client, cluster_address, program_id).map_err(|e| {
            io::Error::new(
                io::ErrorKind::Other,
                format!("Failed to initialize MPC client: {}", e),
            )
        })?
    } else {
        let build_path = std::env::var("ARCIUM_BUILD_PATH").unwrap_or_else(|_| "build".to_string());

        MpcClient::new_local(redis_client, build_path).map_err(|e| {
            io::Error::new(
                io::ErrorKind::Other,
                format!("Failed to initialize MPC client: {}", e),
            )
        })?
    };

    let mpc_client = Arc::new(mpc_client);

    log::info!("✅ MPC Client initialized in {:?} mode", mpc_client.mode());
    log::info!("🔧 Arcium Service listening on http://0.0.0.0:{}", port);

    // Create application state
    let app_state = web::Data::new(AppState {
        mpc_client: mpc_client.clone(),
    });

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();

        App::new()
            .app_data(app_state.clone())
            .wrap(Logger::default())
            .wrap(cors)
            .service(
                web::scope("/api")
                    .configure(api::health::configure)
                    .configure(api::computation::configure)
                    .configure(api::account::configure),
            )
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
