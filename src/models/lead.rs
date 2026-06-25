use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Lead {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub company: Option<String>,
    pub status: String,
    pub source: Option<String>,
    pub notes: Option<String>,
    pub assigned_to: Option<Uuid>,
    pub score: Option<i32>,
    pub custom_fields: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateLeadRequest {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    #[validate(email(message = "Invalid email format"))]
    pub email: Option<String>,
    pub phone: Option<String>,
    pub company: Option<String>,
    pub status: Option<String>,
    pub source: Option<String>,
    pub notes: Option<String>,
    pub assigned_to: Option<Uuid>,
    pub score: Option<i32>,
    pub custom_fields: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateLeadRequest {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    #[validate(email(message = "Invalid email format"))]
    pub email: Option<String>,
    pub phone: Option<String>,
    pub company: Option<String>,
    pub status: Option<String>,
    pub source: Option<String>,
    pub notes: Option<String>,
    pub assigned_to: Option<Uuid>,
    pub score: Option<i32>,
    pub custom_fields: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct LeadResponse {
    pub id: Uuid,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub company: Option<String>,
    pub status: String,
    pub source: Option<String>,
    pub score: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}