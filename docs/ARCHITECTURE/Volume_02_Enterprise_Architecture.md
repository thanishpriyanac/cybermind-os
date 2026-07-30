# Volume 2 – Enterprise Architecture
**Document Status:** DRAFT (Pending Approval)
**Version:** 1.0

This volume serves as the constitutional architecture document for the CYBERMIND Cyber Security Operating System (CyberOS). All future modules, services, APIs, and schemas must conform to this blueprint unless superseded through an approved Architecture Decision Record (ADR).

---

## 1. Platform Architecture

**Architectural Style:** Modular Monolith (Microservice-Ready)
**Core Principles:** API-First, Event-Driven, AI-Native, Zero Trust, Human-in-the-Loop.

CYBERMIND employs a **Layered Modular Architecture**. 
- **Presentation Layer:** React-based Analyst Workbench (Single Page Application).
- **API Gateway / Routing Layer:** NestJS REST & GraphQL controllers.
- **Domain Modules:** Isolated Bounded Contexts (CTI, SOC, SIEM, etc.) containing their own business logic, DTOs, and repositories.
- **Platform Services Layer:** Shared infrastructure and utility services consumed by Domain Modules.
- **Data Layer:** Polyglot persistence (PostgreSQL for structured data, Redis for queues/caching, MinIO for object storage).

---

## 2. Platform Services Layer

The foundational layer that all Domain Modules consume. These services are horizontally scalable and centrally managed.

| Service | Responsibilities | Consumers | Scalability & Security |
| :--- | :--- | :--- | :--- |
| **Identity Service** | AuthN, AuthZ, RBAC, SSO integration, API Key management. | All Modules, API Gateway | Stateless JWTs; Highly scalable. Encrypts credentials. |
| **AI Gateway** | Provider routing, fallback, rate limiting, circuit breaking. | AI Platform, Chat-to-Graph, SOC | Horizontally scalable. Manages API keys via Secrets. |
| **Model Registry** | Metadata management for available LLMs/Agents. | AI Gateway | Caching via Redis. |
| **Knowledge Graph** | Manages Graph traversal, provenance, and confidence scoring. | CTI, Search, AI Platform | Read-heavy optimization; strict RBAC on nodes. |
| **Search Service** | Global semantic and lexical search across the platform. | All Modules | Distributed indexing. |
| **Workflow Engine** | Orchestrates long-running stateful tasks (e.g., Playbooks). | SOAR, VAPT | Queue-backed (BullMQ). |
| **Event Bus** | Asynchronous pub/sub event routing between modules. | All Modules | Redis Pub/Sub; high throughput. |
| **Storage Service** | Manages large binary artifacts (PCAPs, PDFs). | CTI, DFIR, Sandbox | MinIO/S3 backed. Scans on upload. |
| **Secrets Service** | Manages and injects sensitive environment variables. | Infrastructure | HashiCorp Vault / AWS Secrets integration. |
| **Observability** | Centralized logging, tracing, and metrics. | Infrastructure | OpenTelemetry standard. |

---

## 3. Bounded Context Map

Domain Modules represent distinct business capabilities within the CyberOS.

### Cyber Threat Intelligence (CTI)
- **Responsibilities:** Ingesting external feeds, analyzing malware, extracting IOCs.
- **Owned Entities:** Threat Actors, Malware, IOCs, Campaigns.
- **Public APIs:** `/api/cti/*`
- **Published Events:** `EntityExtracted`, `IocDiscovered`, `CampaignIdentified`.

### Security Operations Center (SOC)
- **Responsibilities:** Alert triage, case management, correlation.
- **Owned Entities:** Alerts, Cases, Incidents.
- **Public APIs:** `/api/soc/*`
- **Published Events:** `AlertGenerated`, `CaseEscalated`.

### AI Platform
- **Responsibilities:** Agent orchestration, prompt management, semantic reasoning.
- **Owned Entities:** Prompts, AI Agents, Evaluation Metrics.
- **Public APIs:** `/api/ai/*`

*(Future Modules: SIEM, SOAR, DFIR, VAPT, GRC, Asset Management, Cloud Security will follow this exact structure as they are built).*

---

## 4. Platform Capability Map

Ensuring no duplicated effort as the platform expands.

| Capability | Current Owner | Future Consumers |
| :--- | :--- | :--- |
| Authentication | Identity Service | All Modules |
| AI Reasoning | AI Gateway | SOC, SIEM, SOAR, DFIR |
| Threat Intelligence | CTI | SOC, SIEM, GRC |
| Knowledge Search | Search Service | All Modules |
| Evidence Storage | Storage Service | DFIR, Sandbox |
| Workflow Automation | Workflow Engine | SOAR, VAPT |

---

## 5. Module Interaction Matrix

**Rules of Engagement:**
- Domain Modules **MAY NOT** directly access another module's database repository.
- Domain Modules **MAY** call the public interfaces (Services/APIs) of the Platform Services Layer.
- Domain Modules **SHOULD** communicate with other Domain Modules asynchronously via the Event Bus. Synchronous HTTP/Service calls between Domain Modules must be justified via an EDR.

---

## 6. Event Catalogue

**Naming Convention:** `[Domain][Entity][Action]PastTense` (e.g., `CtiArtifactUploaded`, `SocAlertTriaged`).
**Payload Ownership:** The emitting module owns the schema of the payload.
**Versioning:** Payloads include a `version` field. Breaking changes require a new topic/event name (e.g., `CtiArtifactUploadedV2`).
**Reliability:** High-priority events are backed by persistent queues (BullMQ) for guaranteed delivery; UI updates use Redis Pub/Sub.

---

## 7. Data Ownership Matrix

Every database entity has exactly ONE owning module.

| Owner | Owned Entities | Write Access | Read Access Strategy |
| :--- | :--- | :--- | :--- |
| **CTI** | Threat Actors, IOCs, Articles | CTI Module ONLY | Synchronous API or async data replication. |
| **SOC** | Alerts, Cases | SOC Module ONLY | Synchronous API or async data replication. |
| **Identity** | Users, Roles, API Keys | Identity Service ONLY | Synchronous API. |

---

## 8. API Ownership

- **Owner:** The bounded context that implements the business logic.
- **Versioning:** URI versioning (`/api/v1/...`).
- **Authentication:** Enforced at the API Gateway layer via the Identity Service.
- **Authorization:** Granular RBAC enforced by decorators on the controller methods.
- **Deprecation:** 6-month sunset window documented via OpenAPI specs.

---

## 9. Security Architecture

- **Zero Trust:** Internal service-to-service communication assumes no implicit trust.
- **Identity Flow:** Users authenticate via Identity Service -> Receive JWT -> JWT verified on every API request.
- **Encryption:** TLS 1.3 in transit; AES-256 for data at rest (database and MinIO).
- **Audit Strategy:** Immutable audit logs generated for every Write/Delete operation.
- **Tenant Isolation:** Row-Level Security (RLS) in PostgreSQL based on `tenant_id` for multi-tenant environments.

---

## 10. Deployment Architecture

- **Development:** Local Docker Compose (PostgreSQL, Redis, MinIO) + local PM2 running NestJS/React.
- **Testing:** Ephemeral CI/CD environments matching production.
- **Production (Cloud/On-Premises):**
  - **Reverse Proxy / Edge:** Cloudflare Tunnel for secure ingress.
  - **App Servers:** Node.js (PM2) or Kubernetes Pods scaling horizontally.
  - **Background Workers:** Dedicated Node.js processes subscribing to Redis queues.
  - **Databases:** Managed PostgreSQL (HA), Managed Redis (HA).

---

## 11. Future Microservice Extraction Plan

The Modular Monolith design enables future microservice extraction without rewriting business logic.
**Extraction Strategy:**
1. Identify a Domain Module experiencing unique scaling constraints (e.g., AI Gateway).
2. Physically separate the module into its own repository/deployable unit.
3. Replace internal NestJS dependency injection calls with internal HTTP/gRPC calls.
4. Maintain the existing Event Bus architecture (Redis/Kafka) for async communication.
**Data Ownership:** Since the DB schema is logically separated by domain, the tables can be physically migrated to a new DB instance without cross-join breakages.

---

## 12. Enterprise Architecture Principles

All future ADRs and EDRs must reference and uphold these principles:
1. **Decoupled by Default:** Modules operate independently.
2. **Event-Driven Over Synchronous:** Prefer asynchronous messaging to prevent cascading failures.
3. **Single Source of Truth:** Data is owned by one module; others must request it.
4. **Observable by Design:** If it cannot be monitored, it cannot be deployed.
5. **Secure at the Edge and the Core:** Validate everything, everywhere.
