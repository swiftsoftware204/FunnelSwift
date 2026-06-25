use axum::{extract::{Path, Query, State}, Json};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::{
    auth::AuthUser,
    db::Database,
    error::{AppError, Result},
    models::workflow::{CreateWorkflowRequest, ExecuteWorkflowRequest, ExecuteWorkflowResponse, UpdateWorkflowRequest, Workflow, WorkflowResponse},
    models::PaginatedResponse,
};

#[derive(Debug, Deserialize)]
pub struct ListWorkflowsQuery {
    pub page: Option<i32>,
    pub per_page: Option<i32>,
    pub is_active: Option<bool>,
}

pub async fn list_workflows(
    State(db): State<Database>,
    user: AuthUser,
    Query(query): Query<ListWorkflowsQuery>,
) -> Result<Json<PaginatedResponse<WorkflowResponse>>> {
    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;

    let tenant_id = user.tenant_id
        .and_then(|t| Uuid::parse_str(&t).ok())
        .ok_or_else(|| AppError::Auth("Tenant not found".to_string()))?;

    let workflows = sqlx::query_as!(
        Workflow,
        r#"SELECT * FROM workflows 
         WHERE tenant_id = $1 
         AND ($2::bool IS NULL OR is_active = $2)
         ORDER BY created_at DESC
         LIMIT $3 OFFSET $4"#,
        tenant_id,
        query.is_active,
        per_page as i64,
        offset as i64
    )
    .fetch_all(db.pool())
    .await?;

    let total = sqlx::query_scalar!(
        r#"SELECT COUNT(*) FROM workflows WHERE tenant_id = $1"#,
        tenant_id
    )
    .fetch_one(db.pool())
    .await?
    .unwrap_or(0);

    let total_pages = (total as f64 / per_page as f64).ceil() as i32;

    let responses: Vec<WorkflowResponse> = workflows.into_iter().map(|w| WorkflowResponse {
        id: w.id,
        name: w.name,
        description: w.description,
        trigger_type: w.trigger_type,
        trigger_config: w.trigger_config,
        actions: w.actions,
        is_active: w.is_active,
        last_run_at: w.last_run_at,
        run_count: w.run_count,
        created_at: w.created_at,
        updated_at: w.updated_at,
    }).collect();

    Ok(Json(PaginatedResponse {
        data: responses,
        total,
        page,
        per_page,
        total_pages,
    }))
}

pub async fn get_workflow(
    State(db): State<Database>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<WorkflowResponse>> {
    let tenant_id = user.tenant_id
        .and_then(|t| Uuid::parse_str(&t).ok())
        .ok_or_else(|| AppError::Auth("Tenant not found".to_string()))?;

    let workflow = sqlx::query_as!(
        Workflow,
        r#"SELECT * FROM workflows WHERE id = $1 AND tenant_id = $2"#,
        id,
        tenant_id
    )
    .fetch_optional(db.pool())
    .await?
    .ok_or_else(|| AppError::NotFound("Workflow not found".to_string()))?;

    Ok(Json(WorkflowResponse {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        trigger_type: workflow.trigger_type,
        trigger_config: workflow.trigger_config,
        actions: workflow.actions,
        is_active: workflow.is_active,
        last_run_at: workflow.last_run_at,
        run_count: workflow.run_count,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
    }))
}

pub async fn create_workflow(
    State(db): State<Database>,
    user: AuthUser,
    Json(req): Json<CreateWorkflowRequest>,
) -> Result<Json<WorkflowResponse>> {
    let tenant_id = user.tenant_id
        .and_then(|t| Uuid::parse_str(&t).ok())
        .ok_or_else(|| AppError::Auth("Tenant not found".to_string()))?;

    let user_id = Uuid::parse_str(&user.id)
        .map_err(|_| AppError::Auth("Invalid user ID".to_string()))?;

    let workflow = sqlx::query_as!(
        Workflow,
        r#"INSERT INTO workflows (
            tenant_id, name, description, trigger_type, trigger_config,
            actions, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *"#,
        tenant_id,
        req.name,
        req.description,
        req.trigger_type,
        req.trigger_config,
        req.actions,
        req.is_active.unwrap_or(true),
        user_id
    )
    .fetch_one(db.pool())
    .await?;

    Ok(Json(WorkflowResponse {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        trigger_type: workflow.trigger_type,
        trigger_config: workflow.trigger_config,
        actions: workflow.actions,
        is_active: workflow.is_active,
        last_run_at: workflow.last_run_at,
        run_count: workflow.run_count,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
    }))
}

pub async fn update_workflow(
    State(db): State<Database>,
    user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateWorkflowRequest>,
) -> Result<Json<WorkflowResponse>> {
    let tenant_id = user.tenant_id
        .and_then(|t| Uuid::parse_str(&t).ok())
        .ok_or_else(|| AppError::Auth("Tenant not found".to_string()))?;

    let workflow = sqlx::query_as!(
        Workflow,
        r#"UPDATE workflows SET
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            trigger_type = COALESCE($3, trigger_type),
            trigger_config = COALESCE($4, trigger_config),
            actions = COALESCE($5, actions),
            is_active = COALESCE($6, is_active),
            updated_at = NOW()
        WHERE id = $7 AND tenant_id = $8
        RETURNING *"#,
        req.name,
        req.description,
        req.trigger_type,
        req.trigger_config,
        req.actions,
        req.is_active,
        id,
        tenant_id
    )
    .fetch_optional(db.pool())
    .await?
    .ok_or_else(|| AppError::NotFound("Workflow not found".to_string()))?;

    Ok(Json(WorkflowResponse {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        trigger_type: workflow.trigger_type,
        trigger_config: workflow.trigger_config,
        actions: workflow.actions,
        is_active: workflow.is_active,
        last_run_at: workflow.last_run_at,
        run_count: workflow.run_count,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
    }))
}

pub async fn delete_workflow(
    State(db): State<Database>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let tenant_id = user.tenant_id
        .and_then(|t| Uuid::parse_str(&t).ok())
        .ok_or_else(|| AppError::Auth("Tenant not found".to_string()))?;

    sqlx::query!(
        r#"DELETE FROM workflows WHERE id = $1 AND tenant_id = $2"#,
        id,
        tenant_id
    )
    .execute(db.pool())
    .await?;

    Ok(Json(json!({ "message": "Workflow deleted successfully" })))
}

pub async fn execute_workflow(
    State(db): State<Database>,
    user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<ExecuteWorkflowRequest>,
) -> Result<Json<ExecuteWorkflowResponse>> {
    let tenant_id = user.tenant_id
        .and_then(|t| Uuid::parse_str(&t).ok())
        .ok_or_else(|| AppError::Auth("Tenant not found".to_string()))?;

    // Verify workflow exists and is active
    let workflow = sqlx::query_as!(
        Workflow,
        r#"SELECT * FROM workflows WHERE id = $1 AND tenant_id = $2 AND is_active = true"#,
        id,
        tenant_id
    )
    .fetch_optional(db.pool())
    .await?
    .ok_or_else(|| AppError::NotFound("Workflow not found or inactive".to_string()))?;

    // Create execution record
    let execution_id = Uuid::new_v4();
    
    sqlx::query!(
        r#"INSERT INTO workflow_executions (id, workflow_id, tenant_id, status, payload, started_at)
         VALUES ($1, $2, $3, 'running', $4, NOW())"#,
        execution_id,
        id,
        tenant_id,
        req.payload
    )
    .execute(db.pool())
    .await?;

    // Update workflow run count and last_run_at
    sqlx::query!(
        r#"UPDATE workflows SET run_count = run_count + 1, last_run_at = NOW() WHERE id = $1"#,
        id
    )
    .execute(db.pool())
    .await?;

    // TODO: Trigger actual workflow execution via n8n or internal engine

    Ok(Json(ExecuteWorkflowResponse {
        execution_id,
        status: "running".to_string(),
        started_at: chrono::Utc::now(),
    }))
}