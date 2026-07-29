# Security Baseline

All CYBERMIND services must implement the following mandatory controls before production deployment.

## 1. Authentication & Authorization (RBAC)
- **JWT Validation:** All inbound REST/gRPC requests must carry a signed JWT.
- **RBAC Enforcement:** Route handlers must declare `@Roles()` or `@Permissions()`. The Auth middleware enforces this before controller execution.

## 2. Tenant Isolation
- **Row-Level Security (RLS):** All Postgres queries must implicitly append `WHERE tenant_id = ?`.
- No cross-tenant data aggregation is permitted outside the Exposure/GRC domains (and only via elevated system roles).

## 3. Input Validation & Output Encoding
- **Validation:** Use NestJS `ValidationPipe` with `class-validator` strictly. Drop unknown payload properties (`whitelist: true`).
- **Encoding:** Frontend must encode outputs to prevent XSS.

## 4. Audit Logging
- All state-mutating API calls (POST, PUT, DELETE) must generate an immutable `AuditRecordCreated` event via the Event Bus.

## 5. Rate Limiting
- Enforced at the API Gateway layer (Redis-backed).
- Services must also implement internal rate-limiting for expensive operations (e.g., complex graph queries).

## 6. Secrets Management
- No secrets in codebase or environment variables in plain text.
- Use Kubernetes Secrets or a dedicated Vault injected at runtime.

## 7. TLS & Encryption
- In-transit: TLS 1.3 mandated internally and externally.
- At-rest: Postgres volumes, MinIO buckets, and OpenSearch indices must be encrypted.
