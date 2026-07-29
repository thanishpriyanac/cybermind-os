# ADR-0003: Search & Telemetry (OpenSearch)

**Status:** Accepted
**Date:** 2026-07-28

## Context
CYBERMIND must ingest, index, and query billions of telemetry events, audit logs, and cases for the SIEM, Threat Hunting, and SOC domains.

## Decision
We will use **OpenSearch** as the primary search and analytics engine for unstructured/semi-structured telemetry and global search.

## Consequences
- **Positive:** Open-source, highly scalable, and excellent text-search capabilities. Supported by AWS for managed deployments.
- **Negative:** Can become resource-intensive and expensive at extreme enterprise scale compared to columnar databases.
- **Mitigation:** In the future, for extremely high-volume pure telemetry analytics, we will introduce **ClickHouse**, retaining OpenSearch for text-heavy hunting and global platform search.
