use axum::{
    middleware,
    routing::{get, post, put, delete, patch},
    Router,
};
use std::net::SocketAddr;
use tower_http::{
    compression::CompressionLayer,
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod auth;
mod db;
mod error;
mod middleware as app_middleware;
mod models;
mod routes;

use crate::db::Database;
use crate::error::Result;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "funnelswift=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialize database
    let database = Database::new().await?;
    
    // Run migrations
    database.migrate().await?;

    // Build router
    let app = create_router(database);

    // Get port from environment or default to 8080
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .expect("PORT must be a valid u16");

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("FunnelSwift server starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

fn create_router(database: Database) -> Router {
    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any)
        .max_age(std::time::Duration::from_secs(86400));

    // API routes
    let api_routes = Router::new()
        // Health check
        .route("/health", get(routes::health::handler))
        
        // Client Auth routes
        .route("/auth/client/login", post(routes::auth::client_login))
        .route("/auth/client/signup", post(routes::auth::client_signup))
        .route("/auth/client/logout", post(routes::auth::logout))
        .route("/auth/client/refresh", post(routes::auth::refresh_token))
        
        // Admin Auth routes
        .route("/auth/admin/login", post(routes::auth::admin_login))
        
        // Admin routes (protected)
        .route("/admin/settings", get(routes::admin::get_settings).post(routes::admin::update_settings))
        .route("/admin/users", get(routes::admin::list_users))
        .route("/admin/users/:id", get(routes::admin::get_user).put(routes::admin::update_user).delete(routes::admin::delete_user))
        
        // Leads routes (protected)
        .route("/leads", get(routes::leads::list_leads).post(routes::leads::create_lead))
        .route("/leads/:id", get(routes::leads::get_lead).put(routes::leads::update_lead).delete(routes::leads::delete_lead))
        .route("/leads/:id/tags", get(routes::tags::get_contact_tags))
        
        // Tags routes (protected)
        .route("/tags", get(routes::tags::list_tags).post(routes::tags::create_tag))
        .route("/tags/assign", post(routes::tags::assign_tag))
        .route("/tags/contact/:contact_id/:tag_id", delete(routes::tags::remove_tag_from_contact))
        
        // Automation routes (protected)
        .route("/automation/workflows", get(routes::automation::list_workflows).post(routes::automation::create_workflow))
        .route("/automation/workflows/:id", get(routes::automation::get_workflow).put(routes::automation::update_workflow).delete(routes::automation::delete_workflow))
        .route("/automation/workflows/:id/execute", post(routes::automation::execute_workflow))
        
        // Webhooks
        .route("/webhooks/telnyx", post(routes::webhooks::telnyx_handler))
        .route("/webhooks/stripe", post(routes::webhooks::stripe_handler))
        
        // v1 API routes
        .nest("/v1", v1_routes());

    // Apply middleware
    let api_routes = api_routes
        .layer(middleware::from_fn(app_middleware::auth::auth_middleware))
        .layer(middleware::from_fn(app_middleware::security::security_headers));

    // Public routes (no auth required)
    let public_routes = Router::new()
        .route("/", get(routes::index::handler))
        .route("/api/health", get(routes::health::handler));

    // Combine routes
    Router::new()
        .merge(public_routes)
        .nest("/api", api_routes)
        .layer(cors)
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http())
        .with_state(database)
}

fn v1_routes() -> Router<Database> {
    Router::new()
        .route("/affiliate-marketplace", get(routes::v1::affiliate::list_products))
        .route("/affiliate-marketplace/:id", get(routes::v1::affiliate::get_product))
        .route("/events", get(routes::v1::events::list_events).post(routes::v1::events::create_event))
        .route("/leads", get(routes::v1::leads::list_leads_v1).post(routes::v1::leads::create_lead_v1))
        .route("/payouts", get(routes::v1::payouts::list_payouts).post(routes::v1::payouts::request_payout))
        .route("/register-plans", get(routes::v1::plans::list_plans))
        .route("/tags", get(routes::v1::tags::list_tags).post(routes::v1::tags::create_tag))
}