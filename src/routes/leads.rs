use axum::{extract::{Path, Query, State}, Json};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::{
    auth::AuthUser,
    db::Database,
    error::{AppError, Result},
    models::lead::{CreateLeadRequest, Lead, LeadResponse, UpdateLeadRequest},
    models::PaginatedResponse,
};

#[derive(Debug, Deserialize)]
pub struct ListLeadsQuery {
    pub page: Option<i32>,
    pub per_page: Option<i32>,
    pub status: Option<String>,
    pub search: Option<String>,
}

pub async fn list_leads(
    State(db): State<Database>,
    user: AuthUser,
    Query(query): Query<ListLeadsQuery>,
) -> Result<Json<PaginatedResponse<LeadResponse>>> {
    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;

    // Get tenant_id from user
    let tenant_id = user.tenant_id
        .and_then(|t| Uuid::parse_str(&t).ok())
        .ok_or_else(|| AppError::Auth("Tenant not found".to_string()))?;

    // Build query based on filters
    let leads = sqlx::query_as!(
        Lead,
        r#"SELECT * FROM leads 
         WHERE tenant_id = $1 
         AND ($2::text IS NULL OR status = $2)
         AND ($3::text IS NULL OR 
              email ILIKE '%' || $3 || '%' OR 
              first_name ILIKE '%' || $3 || '%' OR 
              last_name ILIKE '%' || $3 || '%')
         ORDER BY created_at DESC
         LIMIT $4 OFFSET $5"#,
        tenant_id,
        query.status,
        query.search,
        per_page as i64,
        offset as i64
    )
    .fetch_all(db.pool())
    .await?;

    let total = sqlx::query_scalar!(
        r#"SELECT COUNT(*) FROM leads WHERE tenant_id = $1"#,
        tenant_id
    )
    .fetch_one(db.pool())
    .await?
    .unwrap_or(0);

    let total_pages = (total as f64 / per_page as f64).ceil() as i32;

    let responses: Vec<LeadResponse> = leads.into_iter().map(|lead| LeadResponse {
        id: lead.id,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        source: lead.source,
        score: lead.score,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
    }).collect();

    Ok(Json(PaginatedResponse {
        data: responses,
        total,
        page,
        per_page,
        total_pages,
    }))
}

pub async fn get_lead(
    State(db): State<Database>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<LeadResponse>> {
    let tenant_id = user.tenant_id
        .and_then(|t| Uuid::parse_str(&t).ok())
        .ok_or_else(|| AppError::Auth("Tenant not found".to_string()))?;

    let lead = sqlx::query_as!(
        Lead,
        r#"SELECT * FROM leads WHERE id = $1 AND tenant_id = $2"#,
        id,
        tenant_id
    )
    .fetch_optional(db.pool())
    .await?
    .ok_or_else(|| AppError::NotFound("Lead not found".to_string()))?;

    Ok(Json(LeadResponse {
        id: lead.id,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        source: lead.source,
        score: lead.score,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
    }))
}

pub async fn create_lead(
    State(db): State<Database>,
    user: AuthUser,
    Json(req): Json<CreateLeadRequest>,
) -> Result<Json<LeadResponse>> {
    let tenant_id = user.tenant_id
        .and_then(|t| Uuid::parse_str(&t).ok())
        .ok_or_else(|| AppError::Auth("Tenant not found".to_string()))?;

    let lead = sqlx::query_as!(
        Lead,
        r#"INSERT INTO leads (
            tenant_id, first_name, last_name, email, phone, company, 
            status, source, notes, assigned_to, score, custom_fields
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *"#,
        tenant_id,
        req.first_name,
        req.last_name,
        req.email,
        req.phone,
        req.company,
        req.status.unwrap_or_else(|| "new".to_string()),
        req.source,
        req.notes,
        req.assigned_to,
        req.score,
        req.custom_fields
    )
    .fetch_one(db.pool())
    .await?;

    Ok(Json(LeadResponse {
        id: lead.id,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        source: lead.source,
        score: lead.score,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
    }))
}

pub async fn update_lead(
    State(db): State<Database>,
    user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateLeadRequest>,
) -> Result<Json<LeadResponse>> {
    let tenant_id = user.tenant_id
        .and_then(|t| Uuid::parse_str(&t).ok())
        .ok_or_else(|| AppError::Auth("Tenant not found".to_string()))?;

    // First check if lead exists
    let existing = sqlx::query_as!(
        Lead,
        r#"SELECT * FROM leads WHERE id = $1 AND tenant_id = $2"#,
        id,
        tenant_id
    )
    .fetch_optional(db.pool())
    .await?
    .ok_or_else(|| AppError::NotFound("Lead not found".to_string()))?;

    let lead = sqlx::query_as!(
        Lead,
        r#"UPDATE leads SET
            first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            email = COALESCE($3, email),
            phone = COALESCE($4, phone),
            company = COALESCE($5, company),
            status = COALESCE($6, status),
            source = COALESCE($7, source),
            notes = COALESCE($8, notes),
            assigned_to = COALESCE($9, assigned_to),
            score = COALESCE($10, score),
            custom_fields = COALESCE($11, custom_fields),
            updated_at = NOW()
        WHERE id = $12 AND tenant_id = $13
        RETURNING *"#,
        req.first_name,
        req.last_name,
        req.email,
        req.phone,
        req.company,
        req.status,
        req.source,
        req.notes,
        req.assigned_to,
        req.score,
        req.custom_fields,
        id,
        tenant_id
    )
    .fetch_one(db.pool())
    .await?;

    Ok(Json(LeadResponse {
        id: lead.id,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        source: lead.source,
        score: lead.score,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
    }))
}

pub async fn delete_lead(
    State(db): State<Database>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let tenant_id = user.tenant_id
        .and_then(|t| Uuid::parse_str(&t).ok())
        .ok_or_else(|| AppError::Auth("Tenant not found".to_string()))?;

    sqlx::query!(
        r#"DELETE FROM leads WHERE id = $1 AND tenant_id = $2"#,
        id,
        tenant_id
    )
    .execute(db.pool())
    .await?;

    Ok(Json(json!({ "message": "Lead deleted successfully" })))
}