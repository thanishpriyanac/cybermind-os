# ADR-0005: Object Storage (MinIO)

**Status:** Accepted
**Date:** 2026-07-28

## Context
Domains such as DFIR (Evidence Vault) and SOAR require scalable storage for large blobs (e.g., memory dumps, PCAP files, artifact attachments) that should not be stored in PostgreSQL.

## Decision
We will use **MinIO** for local development and self-hosted environments, enforcing strict **S3-compatibility**.

## Consequences
- **Positive:** 100% API compatibility with AWS S3. Extremely fast. Allows developers to test object storage locally via Docker.
- **Negative:** Requires volume management and backup strategies if used as the production datastore.
- **Mitigation:** In managed cloud deployments, the platform will swap MinIO for native AWS S3 or Azure Blob Storage (via S3 API) without any code changes.
