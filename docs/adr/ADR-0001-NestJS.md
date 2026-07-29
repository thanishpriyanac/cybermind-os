# ADR-0001: Backend Framework (NestJS)

**Status:** Accepted
**Date:** 2026-07-28

## Context
CYBERMIND Platform requires a robust, scalable backend framework for its dozens of microservices. We need a framework that enforces architectural boundaries, supports Dependency Injection, natively integrates with gRPC and REST, and scales well for enterprise teams.

## Decision
We will use **NestJS (Node.js + TypeScript)** for all core business services. Python will be strictly reserved for AI, ML, and Data Science components where its ecosystem excels.

## Consequences
- **Positive:** Uniform language across frontend (Next.js) and backend (NestJS). Native support for DDD patterns. Strong OpenAPI and gRPC support.
- **Negative:** Cold start times compared to Go. Slightly higher memory footprint than Rust/Go.
- **Mitigation:** We will deploy as persistent long-running containers (Kubernetes) to negate cold-start issues, and horizontally scale via HPA.
