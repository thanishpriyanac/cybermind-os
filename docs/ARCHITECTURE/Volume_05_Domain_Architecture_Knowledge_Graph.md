# Volume 5 – Domain Architecture: Knowledge Graph Platform
**Document Status:** DRAFT (Pending Approval via AR-0004)
**Version:** 1.0

---

## Part 1: Strategic Overview

### 1. Executive Summary
The Knowledge Graph Platform is the central intelligence and semantic correlation layer of the CYBERMIND CyberOS. It maps relationships between identities, threat actors, assets, incidents, and infrastructure to provide context for AI reasoning, search, and human analysts.

### 2. Vision
To serve as the universal connective tissue of the CyberOS, seamlessly bridging isolated domain data into a cohesive, queryable web of cybersecurity intelligence without duplicating operational persistence.

### 3. Design Goals & 4. Guiding Principles
- **Semantic, Not Operational:** The Knowledge Graph is a semantic layer, not a persistence layer. Operational data remains in bounded contexts.
- **Provider Agnostic:** Storage abstraction guarantees independence from specific graph database vendors (e.g., Neo4j, Neptune).
- **Event-Driven Assembly:** The graph is built asynchronously via domain events; it is eventually consistent.
- **AI-Native Context:** Designed to feed RAG and reasoning chains with high-confidence, temporally valid context.

---

## Part 2: Domain-Driven Design (DDD)

### 5. Ubiquitous Language
- **Node (Entity):** A semantic reference to an operational record (e.g., a specific User or IOC).
- **Edge (Relationship):** A directional connection between two Nodes.
- **Provenance:** The verifiable origin of a Node or Edge.
- **Confidence:** A probabilistic score (0.0 - 1.0) of a relationship's validity.
- **Correlation:** The automated linking of disparate Nodes based on inferred or deterministic rules.

### 6. Bounded Contexts & 7. Context Map
- **Consumers (Upstream):** AI Platform (for RAG), SOC (for Alert correlation), SIEM (for timeline analysis), DFIR (for attack chains).
- **Producers (Downstream):** CTI, SOC, Identity, VAPT, Asset Management. All modules publish to the Event Bus, which the Graph consumes.

### 8. Domain Model, 11. Aggregate Design & 12. Value Objects
- **Aggregates:** `SemanticGraph`, `InferenceRule`.
- **Value Objects:** `ConfidenceScore`, `TemporalWindow` (ValidFrom, ValidTo), `ProvenanceChain`, `ClassificationTag`.

### 9. Entity Taxonomy (Nodes)
Nodes are lightweight references to external data. Types include:
- `Identity` (User, Org, Team, Device, ServiceAccount)
- `Infrastructure` (Asset, Server, CloudResource, IP, Domain)
- `Threat` (Actor, Campaign, Malware, IOC, CVE, Tactic, Technique)
- `Operations` (Alert, Incident, Case, Evidence, Playbook)

### 10. Relationship Taxonomy (Edges)
Edges describe interactions. Types include:
- `RESOLVES_TO`, `COMMUNICATES_WITH`, `EXPLOITS`, `ATTRIBUTED_TO`, `AFFECTS`, `OBSERVED_IN`, `OWNS`, `MITIGATES`.

### 13. Domain Events
- **Consumed:** `UserCreated`, `IocExtracted`, `AlertGenerated`, `AssetDiscovered`.
- **Published:** `RelationshipInferred`, `EntityMerged`, `ConfidenceDegraded`, `GraphAnomalyDetected`.

---

## Part 3: Architecture & Core Capabilities

### 14. Knowledge Ownership Model
The graph **NEVER** owns business data. It stores only references (UUIDs), metadata, confidence scores, and relationships. For example, Identity owns the `User` email; the Graph owns the edge `User [COMMUNICATES_WITH] Malicious_IP`.

### 15. Entity Resolution Strategy & 16. Correlation Engine
- Resolves disparate identifiers (e.g., an IP from a firewall log vs. an IP from a CTI report) into a single Node or links them via `SAME_AS` edges.
- Uses deterministic matching (exact hashes) and probabilistic matching (fuzzy logic).

### 17. Inference Engine & 18. Confidence Model
- Applies rules to generate new implicit edges (e.g., if `Asset A` is `IN_SUBNET` `Subnet X`, and `Subnet X` is `COMPROMISED`, infer `Asset A` is `AT_RISK`).
- Confidence decays over time (`Temporal Validity`) or aggregates when corroborated by multiple sources.

### 19. Provenance Model & 20. Evidence Model
Every Node and Edge contains a `SourceSystem` and `EvidenceLink` pointing to the raw log, CTI report, or AI reasoning chain that generated it.

### 21. Trust Model & 22. Temporal Model
- Trust scores are assigned to external intelligence sources.
- Temporal modelling ensures past states of the graph can be queried (e.g., "What was the relationship between this User and Asset at the time of the breach?").

### 23. Graph Traversal Model & 24. Query Architecture
- Supports multi-hop traversal (Attack Chain Mapping, Blast Radius calculation).
- Query layer abstracts the underlying graph syntax (e.g., Cypher or Gremlin) via a uniform internal DSL.

---

## Part 4: Integrations

### 25. AI Integration
- Acts as the primary contextual intelligence layer for the AI Platform.
- Enables Graph-RAG: The AI Platform retrieves a sub-graph of relationships to ground its prompt, ensuring high-fidelity, explainable answers with citations tracing back to provenance edges.

### 26. Search Integration
- Search (Lexical/Semantic) and Graph remain independent. Search discovers *what* exists; Graph discovers *how* it connects. The AI Gateway orchestrates both.

### 27. Event Integration
- Graph ingestion is completely decoupled via the Event Bus. Updates are eventually consistent to prevent blocking operational transaction speeds in domains like SIEM.

### 28. Platform APIs
- `GET /api/graph/entities/{id}/blast-radius`
- `POST /api/graph/traverse`
- `POST /api/graph/correlate`

---

## Part 5: Infrastructure & Operations

### 29. Storage Abstraction
- The `GraphRepository` interface completely decouples domain logic from the persistence engine.
- Supports swapability between PostgreSQL (Apache AGE), Neo4j, or Amazon Neptune without business logic rewrites.

### 30. Security Architecture & 31. Multi-Tenant Strategy
- Strictly multi-tenant. All Nodes and Edges include `tenant_id`.
- Traversal queries are physically scoped to the caller's `tenant_id` at the storage adapter level to prevent data bleed.

### 32. Privacy & Data Classification
- Node properties strip PII before ingestion; the Graph relies on UUIDs to reference PII held safely in the Identity or SOC domains.

### 33. Performance Strategy & 34. Scalability Model
- Ingestion pipelines use batch processing and queue debouncing to handle burst events from SIEM/SOC.
- Read replicas scale out to support heavy AI RAG queries.

### 35. Disaster Recovery & 36. Monitoring & 37. Observability
- Event sourcing allows graph reconstruction by replaying the Event Bus from cold storage.
- Telemetry tracks `graph.traversal.latency`, `graph.ingestion.lag`, and `graph.edge.count`.

### 38. Data Lifecycle
- Relationships are archived or confidence-decayed after their TTL expires (e.g., dynamic IP assignments).

---

## Part 6: Governance & Forward Planning

### 39. Engineering Decisions & 40. ADRs
- **EDR-KG-01:** Knowledge Graph is explicitly a semantic layer, not a persistence layer.
- **EDR-KG-02:** Traversal logic is abstracted behind an internal API to prevent vendor lock-in to Cypher/Gremlin.

### 41. Risks
- Graph traversal queries can result in combinatorial explosions (infinite loops). Query depth limiters and circuit breakers are mandatory.

### 42. Future Expansion
- Federated Graph querying across multiple CYBERMIND enterprise deployments for global threat intelligence sharing.

### 43. Architecture Validation Checklist
- [x] Platform Service
- [x] Clean Architecture
- [x] DDD
- [x] Zero Trust
- [x] Vendor Independence
- [x] Event-Driven Ready
- [x] AI Ready
- [x] Multi-Tenant
- [x] Explainable
- [x] Extensible
- [x] Enterprise Scale

### 44. Glossary
- **Graph-RAG:** Retrieval-Augmented Generation utilizing graph traversals rather than pure vector similarity.
- **Blast Radius:** A traversal algorithm determining all assets and identities reachable from a compromised node.
