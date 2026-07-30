# ADR-001: PM2 Application Process Management Over Full-Stack Docker

## Status
Accepted

## Context
Standard enterprise web deployments often default to Docker containers for all microservices. However, RexonSoftTech's operational guideline specifies bare-metal Ubuntu Server management. Additionally, running NestJS/Node.js directly on bare-metal reduces virtualization overhead and simplifies local filesystem interaction for logging and performance.

## Decision
We choose **PM2** to manage the main NestJS API and BullMQ worker processes directly on Ubuntu 24.04 LTS. Docker will be strictly isolated and reserved *only* for single-use sandbox workers parsing untrusted malicious files (PCAP, EVTX).

## Consequences
- **Positive:** Zero container networking overhead for core API; native OS performance; simplified deployment via PM2 `ecosystem.config.js`.
- **Negative:** OS-level dependencies (Node.js 20, PostgreSQL, Redis) must be provisioned directly on the host server.

---

# ADR-002: Cloudflare Tunnel Over Exposed Ingress Ports / Nginx

## Status
Accepted

## Context
Exposing inbound ports (e.g., 80, 443, 3000) directly to the public Internet creates an unnecessary attack surface, requiring complex WAF rules, SSL certificate renewal scripts, and Nginx reverse proxy maintenance.

## Decision
We choose **Cloudflare Tunnel (Zero Trust)** to connect the local application port (`localhost:3000`) directly to Cloudflare's edge network without opening any public inbound ports on the Ubuntu firewall.

## Consequences
- **Positive:** Zero open ports on host firewall (`ufw default deny incoming`); automatic DDoS mitigation and SSL termination via Cloudflare; no Nginx configuration needed.
- **Negative:** Dependency on Cloudflare daemon (`cloudflared`) and Cloudflare network availability.

---

# ADR-003: Unified PostgreSQL + pgvector Over Dual Database Architecture

## Status
Accepted

## Context
AI applications frequently pair a relational database (PostgreSQL) with a specialized vector database (Qdrant, Pinecone, Weaviate). Managing two separate databases introduces operational burden, transactional inconsistency, and complex backup pipelines.

## Decision
We choose **PostgreSQL 16 with the `pgvector` extension**, utilizing PgBouncer for transaction pooling.

## Consequences
- **Positive:** Single database to backup, mirror, and operate; relational data and vector embeddings coexist in atomic transactions; simplified query layer with Prisma.
- **Negative:** Vector search scalability is bound to Postgres instance scaling (acceptable for Phase 1 enterprise scale).

---

# ADR-004: Redis + BullMQ Asynchronous Event Bus

## Status
Accepted

## Context
Multi-model AI queries (querying 6 providers simultaneously) and knowledge ingestion pipelines (parsing hundreds of articles) will block main API HTTP execution threads if handled synchronously.

## Decision
We choose **Redis 7 + BullMQ** to implement an internal decoupled Event Bus and worker job queue system.

## Consequences
- **Positive:** Real-time multi-provider fan-out via non-blocking SSE streaming; automatic job retries and concurrency control; decoupled background indexing.
- **Negative:** Requires Redis instance management and monitoring.
