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
pub struct ListEventsQuery {
    pub page: Option<i32>,
    pub per_page: Option<i32>,
    pub event_type: Option<String>,
}

pub async fn list_events(
    State(db): State<Database>,
    user: AuthUser,
    Query(query): Query<ListEventsQuery>,
) -> Result<Json<serde_json::Value>> {
    // TODO: Implement event listing
    Err(AppError::NotImplemented("Events listing".to_string()))
}

pub async fn create_event(
    State(db): State<Database>,
    user: AuthUser,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>> {
    // TODO: Implement event creation
    Err(AppError::NotImplemented("Event creation".to_string()))
}