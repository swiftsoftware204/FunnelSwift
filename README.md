# FunnelSwift Rust API

Lightweight Rust backend for FunnelSwift — replacing the Next.js API routes with a compiled binary.

## Architecture

- **Framework:** Axum (Tokio-based web framework)
- **Database:** PostgreSQL with SQLx (compile-time checked queries)
- **Auth:** Supabase JWT validation
- **Memory Usage:** ~50-100MB (vs ~700MB for Next.js)

## Project Structure

```
funnelswift-rust/
├── Cargo.toml           # Dependencies
├── Dockerfile           # Multi-stage build
├── src/
│   ├── main.rs          # Entry point, routing
│   ├── error.rs         # Error handling
│   ├── db.rs            # Database connection pool
│   ├── auth.rs          # JWT validation
│   ├── middleware/      # Auth, CORS, security headers
│   ├── models/          # Database models
│   └── routes/          # API handlers
│       ├── admin.rs
│       ├── auth.rs
│       ├── automation.rs
│       ├── leads.rs
│       ├── v1/          # API v1 routes
│       └── webhooks.rs
```

## Quick Start

### 1. Set Environment Variables

```bash
cp .env.example .env
# Edit .env with your values
```

### 2. Build & Run (Development)

```bash
# Install dependencies
cargo build

# Run with hot reload (install cargo-watch first)
cargo watch -x run

# Or run directly
cargo run
```

### 3. Build Release Binary

```bash
cargo build --release
# Binary: target/release/funnelswift
```

### 4. Docker Build

```bash
docker build -t funnelswift-rust .
docker run -p 8080:8080 --env-file .env funnelswift-rust
```

## API Endpoints

### Public
- `GET /` — API info
- `GET /health` — Health check
- `POST /api/auth/login` — Login
- `POST /api/auth/signup` — Signup

### Protected (requires Bearer token)
- `GET /api/admin/settings` — Get site settings
- `GET /api/leads` — List leads
- `POST /api/leads` — Create lead
- `GET /api/automation/workflows` — List workflows
- `POST /api/automation/workflows` — Create workflow

### Webhooks
- `POST /api/webhooks/twilio` — Twilio SMS/voice
- `POST /api/webhooks/stripe` — Stripe payments

## Database Schema

Required tables (SQL migrations not included — use your existing Supabase schema):

- `users` — User accounts
- `leads` — Lead management
- `workflows` — Automation workflows
- `site_settings` — Configuration

## Deployment

### Hetzner VPS

```bash
# Build on server or CI
cargo build --release

# Copy binary and .env to server
scp target/release/funnelswift root@your-vps:/opt/funnelswift/
scp .env root@your-vps:/opt/funnelswift/

# Run with systemd or Docker
```

### Docker Compose

```yaml
version: '3.8'
services:
  funnelswift:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
    restart: unless-stopped
```

## Migration from Next.js

| Feature | Next.js | Rust |
|---------|---------|------|
| Memory | ~700MB | ~75MB |
| Cold start | 2-5s | <100ms |
| Runtime | Node.js | Native binary |
| Type safety | TypeScript | Rust (compile-time) |

## TODO

- [ ] SQL migrations
- [ ] Complete v1 API routes
- [ ] n8n integration for workflow execution
- [ ] Redis caching layer
- [ ] Rate limiting
- [ ] Webhook signature verification

## License

Proprietary — SwiftSoftware