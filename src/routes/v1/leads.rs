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
pub struct ListLeadsQuery {
    pub page: Option<i32>,
    pub per_page: Option<i32>,
    pub status: Option<String>,
}

pub async fn list_leads_v1(
    State(db): State<Database>,
    user: AuthUser,
    Query(query): Query<ListLeadsQuery>,
) -> Result<Json<serde_json::Value>> {
    // TODO: Implement v1 leads API
    Err(AppError::NotImplemented("v1 leads listing".to_string()))
}

pub async fn create_lead_v1(
    State(db): State<Database>,
    user: AuthUser,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>> {
    // TODO: Implement v1 lead creation
    Err(AppError::NotImplemented("v1 lead creation".to_string()))
}