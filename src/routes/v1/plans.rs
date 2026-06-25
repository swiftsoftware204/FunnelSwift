use axum::{extract::{Query, State}, Json};
use serde::Deserialize;
use serde_json::json;

use crate::{
    auth::AuthUser,
    db::Database,
    error::{AppError, Result},
};

#[derive(Debug, Deserialize)]
pub struct ListPlansQuery {
    pub page: Option<i32>,
    pub per_page: Option<i32>,
    pub is_active: Option<bool>,
}

pub async fn list_plans(
    State(db): State<Database>,
    user: AuthUser,
    Query(query): Query<ListPlansQuery>,
) -> Result<Json<serde_json::Value>> {
    // TODO: Implement registration plans listing
    Err(AppError::NotImplemented("Registration plans".to_string()))
}