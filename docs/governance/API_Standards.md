# API Standards

This document enforces the standard for all REST and gRPC APIs across CYBERMIND.

## 1. URI Conventions
- Use kebab-case for URLs (e.g., `/api/v1/user-profiles`).
- Use nouns for resources, not verbs (e.g., `POST /cases`, not `POST /create-case`).
- Nested resources should indicate hierarchy (e.g., `/api/v1/cases/{caseId}/evidence`).

## 2. Versioning
- All APIs must be versioned in the URI (e.g., `/api/v1/...`).
- Minor, non-breaking changes are silently rolled forward. Breaking changes require `/api/v2/`.

## 3. Error Format
- Strict adherence to **RFC 9457 (Problem Details for HTTP APIs)**.
- Example:
  ```json
  {
    "type": "https://api.cybermind.io/errors/validation-failed",
    "title": "Validation Failed",
    "status": 400,
    "detail": "The 'severity' field must be High or Critical.",
    "instance": "/api/v1/alerts/123"
  }
  ```

## 4. Pagination, Filtering, & Sorting
- **Pagination:** Offset-based (`?limit=50&offset=100`) for standard lists. Cursor-based for high-velocity feeds (e.g., telemetry).
- **Filtering:** Use query parameters (`?status=open&severity=high`).
- **Sorting:** Use `?sort=-createdAt,severity`.

## 5. Idempotency
- All `POST`, `PUT`, and `PATCH` requests must support an `Idempotency-Key` header.
- The API Gateway will enforce caching of idempotent responses for 24 hours.

## 6. Tracing & Correlation
- Every request must include an `X-Correlation-ID` header. If missing, the Gateway generates one.
- Logs and downstream gRPC calls must propagate this ID.

## 7. Response Envelope
- Avoid unnecessary envelopes. Return the raw JSON object or array directly.
- Include metadata (e.g., pagination totals) in HTTP Headers (`X-Total-Count`) where applicable, or alongside arrays in standard list responses.
