use axum::{extract::{Path, State}, Json};
use serde_json::json;
use uuid::Uuid;

use crate::{
    auth::AuthUser,
    db::Database,
    error::{AppError, Result},
    models::settings::{SettingsResponse, UpdateSettingsRequest},
};

// Settings handlers
pub async fn get_settings(
    State(db): State<Database>,
    user: AuthUser,
) -> Result<Json<Vec<SettingsResponse>>> {
    // Check if user is admin
    if user.role != "admin" {
        return Err(AppError::Forbidden("Admin access required".to_string()));
    }

    // Fetch settings from database
    let settings = sqlx::query_as!(
        SettingsResponse,
        r#"SELECT key, value, description FROM site_settings WHERE is_public = true"#
    )
    .fetch_all(db.pool())
    .await?;

    Ok(Json(settings))
}

pub async fn update_settings(
    State(db): State<Database>,
    user: AuthUser,
    Json(req): Json<UpdateSettingsRequest>,
) -> Result<Json<SettingsResponse>> {
    if user.role != "admin" {
        return Err(AppError::Forbidden("Admin access required".to_string()));
    }

    Err(AppError::NotImplemented("Update settings".to_string()))
}

// User management handlers
pub async fn list_users(
    State(db): State<Database>,
    user: AuthUser,
) -> Result<Json<serde_json::Value>> {
    if user.role != "admin" {
        return Err(AppError::Forbidden("Admin access required".to_string()));
    }

    let users = sqlx::query_as!(
        crate::models::user::UserResponse,
        r#"SELECT 
            id, email, first_name, last_name, role, avatar_url, is_active, email_verified, created_at
         FROM users
         ORDER BY created_at DESC"#
    )
    .fetch_all(db.pool())
    .await?;

    Ok(Json(json!({
        "data": users,
        "total": users.len()
    })))
}

pub async fn get_user(
    State(db): State<Database>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<crate::models::user::UserResponse>> {
    if user.role != "admin" && user.id != id.to_string() {
        return Err(AppError::Forbidden("Access denied".to_string()));
    }

    let user_data = sqlx::query_as!(
        crate::models::user::UserResponse,
        r#"SELECT 
            id, email, first_name, last_name, role, avatar_url, is_active, email_verified, created_at
         FROM users
         WHERE id = $1"#,
        id
    )
    .fetch_optional(db.pool())
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(user_data))
}

pub async fn update_user(
    State(db): State<Database>,
    user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>> {
    if user.role != "admin" && user.id != id.to_string() {
        return Err(AppError::Forbidden("Access denied".to_string()));
    }

    Err(AppError::NotImplemented("Update user".to_string()))
}

pub async fn delete_user(
    State(db): State<Database>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    if user.role != "admin" {
        return Err(AppError::Forbidden("Admin access required".to_string()));
    }

    sqlx::query!("DELETE FROM users WHERE id = $1", id)
        .execute(db.pool())
        .await?;

    Ok(Json(json!({ "message": "User deleted successfully" })))
}