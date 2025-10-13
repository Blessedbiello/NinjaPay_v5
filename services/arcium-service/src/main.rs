mod api;
mod mpc;
mod utils;

use actix_cors::Cors;
use actix_web::{middleware::Logger, web, App, HttpServer};
use env_logger::Env;
use std::io;

#[actix_web::main]
async fn main() -> io::Result<()> {
    // Initialize logger
    env_logger::init_from_env(Env::default().default_filter_or("info"));

    log::info!("🚀 Starting Arcium Service...");

    let port = std::env::var("ARCIUM_SERVICE_PORT")
        .unwrap_or_else(|_| "8001".to_string())
        .parse::<u16>()
        .expect("Invalid port");

    log::info!("🔧 Arcium Service listening on http://0.0.0.0:{}", port);

    HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();

        App::new()
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
