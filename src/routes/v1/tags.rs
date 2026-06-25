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
pub struct ListTagsQuery {
    pub page: Option<i32>,
    pub per_page: Option<i32>,
}

pub async fn list_tags(
    State(db): State<Database>,
    user: AuthUser,
    Query(query): Query<ListTagsQuery>,
) -> Result<Json<serde_json::Value>> {
    // TODO: Implement tags listing
    Err(AppError::NotImplemented("Tags listing".to_string()))
}

pub async fn create_tag(
    State(db): State<Database>,
    user: AuthUser,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>> {
    // TODO: Implement tag creation
    Err(AppError::NotImplemented("Tag creation".to_string()))
}