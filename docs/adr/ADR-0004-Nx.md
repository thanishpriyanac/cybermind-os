# ADR-0004: Monorepo Management (Nx)

**Status:** Accepted
**Date:** 2026-07-28

## Context
We are adopting a monorepo strategy (`cybermind-os`) to house 20+ microservices, shared libraries, and multiple frontend applications. We need a tool to manage this complexity, enforce boundaries, and orchestrate builds.

## Decision
We will use **Nx** over alternatives like Turborepo or Lerna.

## Consequences
- **Positive:** Superior dependency graph visualization. Strong enforcement of architectural boundaries (tags and linting rules). Built-in code generators (Nx plugins) for NestJS and React. Excellent caching for affected builds.
- **Negative:** Steeper learning curve. `project.json` complexity compared to pure `package.json` workspaces.
- **Mitigation:** Rely heavily on Nx generators to abstract configuration complexity from developers.
