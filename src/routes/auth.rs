use axum::{extract::State, Json};
use serde_json::json;

use crate::{
    auth::AuthUser,
    db::Database,
    error::{AppError, Result},
    models::user::{LoginRequest, LoginResponse, UserResponse},
};

pub async fn client_login(
    State(db): State<Database>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>> {
    // Validate client credentials against Supabase
    // Client role = "client"
    Err(AppError::NotImplemented("Client auth via Supabase".to_string()))
}

pub async fn client_signup(
    State(db): State<Database>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>> {
    // Create new client account
    // Auto-assign tenant_id for their data isolation
    Err(AppError::NotImplemented("Client signup via Supabase".to_string()))
}

pub async fn admin_login(
    State(db): State<Database>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>> {
    // Validate admin credentials
    // Admin role = "admin" or "superadmin"
    // Can access all tenants' data
    Err(AppError::NotImplemented("Admin auth via Supabase".to_string()))
}

pub async fn logout() -> Result<Json<serde_json::Value>> {
    Ok(Json(json!({ "message": "Logged out successfully" })))
}

pub async fn refresh_token(
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>> {
    Err(AppError::NotImplemented("Token refresh".to_string()))
}