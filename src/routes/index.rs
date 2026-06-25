use axum::Json;
use serde_json::json;

pub async fn handler() -> Json<serde_json::Value> {
    Json(json!({
        "name": "FunnelSwift API",
        "version": env!("CARGO_PKG_VERSION"),
        "description": "Lightweight CRM & Funnel Management API",
        "documentation": "/api/docs",
        "health": "/api/health"
    }))
}