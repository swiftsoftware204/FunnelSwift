use axum::{extract::{Path, Query, State}, Json};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::{
    auth::AuthUser,
    db::Database,
    error::{AppError, Result},
};

#[derive(Debug, Deserialize)]
pub struct ListPayoutsQuery {
    pub page: Option<i32>,
    pub per_page: Option<i32>,
    pub status: Option<String>,
}

pub async fn list_payouts(
    State(db): State<Database>,
    user: AuthUser,
    Query(query): Query<ListPayoutsQuery>,
) -> Result<Json<serde_json::Value>> {
    // TODO: Implement payout listing
    Err(AppError::NotImplemented("Payouts listing".to_string()))
}

pub async fn request_payout(
    State(db): State<Database>,
    user: AuthUser,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>> {
    // TODO: Implement payout request
    Err(AppError::NotImplemented("Payout request".to_string()))
}