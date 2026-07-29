# Coding Standards

## 1. Architecture & Domain Boundaries
- Strictly adhere to Domain-Driven Design (DDD).
- Each NestJS microservice must contain:
  - `controllers/` (HTTP/gRPC Handlers)
  - `services/` (Business Logic)
  - `repositories/` (Data Access)
  - `dto/` (Data Transfer Objects)
  - `entities/` (Domain Models)

## 2. Dependency Rules
- Services may NEVER import code from another service's directory.
- All inter-service communication must happen via the API Gateway, gRPC, or Redpanda.
- Shared logic goes into `/packages/` (Nx Libs).

## 3. Naming Conventions
- **Files:** `kebab-case.ts` (e.g., `user.controller.ts`).
- **Classes:** `PascalCase` (e.g., `UserController`).
- **Interfaces/Types:** `PascalCase` (no `I` prefix, e.g., `User` not `IUser`).

## 4. Exception Handling
- Throw domain-specific exceptions in the `services/` layer.
- Use global Exception Filters in NestJS to map domain exceptions to RFC 9457 HTTP responses.
- Never leak stack traces to HTTP responses.

## 5. Testing Conventions
- **Unit Tests (`*.spec.ts`):** Must mock repositories and external services. Target >80% coverage.
- **Integration Tests:** Use Testcontainers to spin up ephemeral Postgres/Redis/Redpanda instances.

## 6. Logging
- Use the `@cybermind/logger` package.
- Log in JSON format for OpenSearch ingestion.
- Always include `correlationId`, `tenantId`, and `userId` in log context.
