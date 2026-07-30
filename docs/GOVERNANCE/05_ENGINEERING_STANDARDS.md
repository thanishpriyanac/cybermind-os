# CYBERMIND Engineering Standards (v1.0)

## 1. Approved Technology Stack
Only use approved technologies unless an Engineering Decision Record (EDR) authorises an exception.

**Backend:** NestJS, TypeScript (strict), Prisma ORM, PostgreSQL, Redis, BullMQ, OpenTelemetry, Jest.
**Frontend:** React, Vite, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod.
**Infrastructure:** PM2, Cloudflare Tunnel, Cloudflare Pages, Cloudflare R2, Docker.

## 2. Dependency Policy
Before introducing any dependency, answer:
* Why is it needed? Is there already an approved library that solves this?
* Is it actively maintained and widely adopted?
* What is the security risk?
* What is the long-term maintenance cost?
* Can we remove it later without major rewrites?

## 3. Coding Standards
* Strict TypeScript only. No `any` (except with documented justification).
* No disabled lint rules or ignored TypeScript errors.
* Controllers remain thin. Business logic belongs in services. Database access only through repositories.
* DTO validation on every external input. No hardcoded values.

## 4. API Standards
Every API must:
* Be versioned.
* Return consistent response formats (structured error responses).
* Include validation.
* Be documented and authenticated unless explicitly public.
* Produce audit logs where appropriate.

## 5. Database Standards
Every schema change requires a migration, rollback consideration, index review, foreign key review, performance review, and documentation. No direct SQL unless justified in an EDR.

## 6. Security Standards
Mandatory for every feature: Authentication, Authorisation, Input validation, Output sanitisation, Secret management, Encryption where required, Audit logging, Rate limiting, Security review.

## 7. Performance Standards
Every feature should consider: Database query count, N+1 queries, Memory usage, Queue utilisation, Cache opportunities, Response time, Background processing, Scalability.

## 8. Definition of Done
A task is complete only when requirements are satisfied, architecture is approved, tests pass, documentation is updated, security/performance reviews are complete, no known technical debt remains, and an EDR (if required) is recorded.

## 9. Release Quality Gates
Every release must satisfy: 100% TypeScript compilation, no critical security issues, database migrations verified, CI/CD green, automated tests passing, documentation updated, release notes prepared, rollback plan available.

## 10. Platform Maturity
Every new module must declare its maturity: Vision, Planned, Prototype, Alpha, Beta, Release Candidate, General Availability (GA), Deprecated, Retired.
