use axum::{
    http::{Request, StatusCode},
    middleware::Next,
    response::Response,
};

use crate::auth::validate_token;

pub async fn auth_middleware<B>(
    request: Request<B>,
    next: Next<B>,
) -> Result<Response, StatusCode> {
    // Skip auth for public routes
    let path = request.uri().path();
    let public_paths = [
        "/api/health",
        "/api/auth/login",
        "/api/auth/signup",
        "/api/auth/refresh",
        "/",
    ];

    if public_paths.iter().any(|p| path.starts_with(p)) {
        return Ok(next.run(request).await);
    }

    // Check Authorization header
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "));

    match auth_header {
        Some(token) => {
            match validate_token(token).await {
                Ok(_user) => {
                    // Token is valid, proceed
                    // In a real implementation, you'd attach the user to the request extensions
                    Ok(next.run(request).await)
                }
                Err(_) => Err(StatusCode::UNAUTHORIZED),
            }
        }
        None => Err(StatusCode::UNAUTHORIZED),
    }
}