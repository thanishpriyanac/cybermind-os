# Volume 6 – Domain Architecture: Cyber Threat Intelligence (CTI)
**Document Status:** DRAFT (Pending Approval via AR-0005)
**Version:** 1.0

---

## Part 1: Strategic Overview

### 1. Executive Summary
The Cyber Threat Intelligence (CTI) domain is the authoritative intelligence production engine of the CYBERMIND Platform. It is responsible for the collection, validation, enrichment, scoring, and publication of all cyber threat intelligence consumed by downstream operational modules (SOC, SIEM, DFIR) and the Knowledge Graph.

### 2. Vision & 3. Design Goals
To transform raw observations and unstructured reports into structured, actionable, and machine-readable intelligence.
- **Goals:** Automate ingestion from diverse sources; enforce strict confidence scoring; completely decouple collection mechanisms from internal business logic; ensure 100% auditability of the intelligence lifecycle.

### 4. Guiding Principles
- **Intelligence is Not Telemetry:** Raw observations are not intelligence. Intelligence is information that has been validated, enriched, versioned, scored, and is traceable to its provenance. *(Platform Constitution Amendment)*
- **CTI Owns Intelligence, Graph Owns Context:** CTI publishes validated entities; the Knowledge Graph consumes them to build relationships.

---

## Part 2: Domain-Driven Design (DDD)

### 5. Ubiquitous Language
- **Intelligence Object:** A curated, versioned package of threat data (e.g., Threat Actor, Campaign, IOC).
- **Observation:** Unvalidated raw data collected from an external source.
- **Connector:** An isolated adapter responsible for polling/receiving data from a specific provider (e.g., NVD, VirusTotal).

### 6. Bounded Contexts & 7. Context Map
- **Dependencies (Upstream):** AI Platform (for extraction/summarization), Identity (AuthZ).
- **Consumers (Downstream):** Knowledge Graph, Search, SOC, SIEM.

### 8. Domain Model & 9. Intelligence Object Taxonomy
- **Threat Entities:** Threat Actors, Groups, Campaigns.
- **Malware Entities:** Malware, Families, Toolkits, Exploits.
- **Vulnerabilities:** CVE, CWE, CAPEC.
- **Indicators (IOCs):** IPs, Domains, URLs, Hashes, Certificates.
- **Rules/Advisories:** YARA, Sigma, Threat Reports, Vendor Bulletins.
- **Behaviors:** MITRE ATT&CK (Tactics, Techniques, Procedures).

---

## Part 3: Architecture & Intelligence Lifecycle

### 10. Intelligence Lifecycle
1. **Collection:** Raw ingest via Connectors.
2. **Validation:** Deduplication and normalization to STIX/internal format.
3. **Enrichment:** AI extraction and external API lookups (e.g., VirusTotal).
4. **Scoring:** Assigning Confidence and Risk scores.
5. **Review:** Human-in-the-Loop or automated approval.
6. **Publication:** Event emitted to Event Bus.
7. **Expiration/Revocation:** Lifecycle end based on TTL or explicit invalidation.

### 11. Collection Architecture & 12. Connector Framework
- Connectors run as isolated micro-workers (via BullMQ).
- **Modular Design:** Connectors map provider-specific JSON to a canonical `RawObservation` DTO. Adding a new feed (e.g., Mandiant) requires only a new Connector plugin, zero changes to CTI core logic.

### 13. Enrichment Pipeline & 14. Correlation Strategy
- **Pipeline:** Sequentially processes `RawObservation` objects. Extracts IOCs and maps unstructured text to MITRE ATT&CK.
- **Correlation:** Merges `RawObservations` from multiple sources (e.g., AlienVault + OTX) into a single, higher-confidence `IntelligenceObject`.

### 15. Confidence Model & 16. Risk Model
- **Confidence:** Aggregate score based on Source Reliability (matrix), AI Extraction Confidence, and Analyst overrides.
- **Risk:** Calculated severity based on potential impact and active exploitability.

### 17. Versioning Strategy
Every Intelligence Object is immutable. Modifications result in a new version (e.g., `v1` -> `v2`). Downstream consumers track the `latest` pointer.

### 18. Validation, 19. Review, 20. Publication, & 21. Revocation Workflows
- **Validation:** Automated schema checks.
- **Review:** "High Confidence" objects bypass human review; "Low/Medium" enter the Analyst Workbench queue.
- **Publication:** Emits `IntelligencePublished` event.
- **Revocation:** Emits `IndicatorRevoked` event (critical for SIEM/SOC to stop alerting on stale IPs).

---

## Part 4: Integrations

### 22. Event Model
- **Published Events:** `ThreatActorCreated`, `IocExtracted`, `IndicatorRevoked`, `ThreatIntelExpired`, `MITREMapped`, `KnowledgePublished`.

### 23. AI Integration
- **Role:** Advisory only.
- **Use Cases:** Summarizing PDF threat reports, extracting IOCs from unstructured text, suggesting MITRE ATT&CK mappings, and detecting duplicates.
- **Constraint:** AI cannot publish directly; it stages objects for Analyst approval.

### 24. Knowledge Graph Integration
- CTI emits events. The Graph subscribes to `KnowledgePublished` and creates `Nodes` and `Edges` (e.g., linking the new IOC to a Campaign). CTI does not write to the Graph DB.

### 25. Search Integration
- All published Intelligence Objects are synced to the Search Service index (Elasticsearch/OpenSearch) for immediate cross-domain discovery.

### 26. Public APIs
- `GET /api/cti/indicators?type=ip`
- `POST /api/cti/reports`
- `PATCH /api/cti/actors/{id}/revoke`

---

## Part 5: Infrastructure & Operations

### 27. Security Architecture & 28. Multi-Tenant Strategy
- **Security:** Strict RBAC. Analysts can only approve intel; Admins can configure connectors.
- **Multi-Tenancy:** CTI supports a global "System Tenant" (shared intel like NVD) and "Customer Tenants" (proprietary intel). RLS ensures no cross-contamination of proprietary intel.

### 29. Data Classification & 30. Storage Abstraction
- **Classification:** TLP (Traffic Light Protocol) enforced natively (TLP:RED, AMBER, GREEN, CLEAR).
- **Storage:** PostgreSQL for relational intel tracking; MinIO/S3 for storing raw PDF/HTML reports.

### 31. Performance & 32. Scalability Strategy
- High-throughput Redis queues buffer incoming feeds. Horizontal scaling of worker nodes processing enrichment tasks.

### 33. Disaster Recovery, 34. Monitoring, & 35. Observability
- OpenTelemetry tracks `cti.ingest.rate`, `cti.enrichment.latency`, and `cti.publish.count`.
- Database replication ensures no loss of curated intelligence.

### 36. Audit Strategy & 37. Data Lifecycle
- 100% audit trail for manual Analyst overrides of AI confidence scores.
- Indicators have a `valid_until` TTL. Once expired, they are moved to cold storage and a revocation event is fired.

---

## Part 6: Governance

### 38. Engineering Decisions & 39. ADRs
- **EDR-CTI-01:** Connector micro-workers strictly decoupled from core CTI logic.
- **EDR-CTI-02:** TLP integrated at the row-level security boundary.

### 40. Risks & 41. Future Expansion
- **Risk:** Alert fatigue from low-confidence IOCs. Mitigated by strict Confidence thresholds before publishing.
- **Future Expansion:** Bi-directional TAXII 2.1 server implementation for sharing intel with external organizations.

### 42. Architecture Validation Checklist
- [x] Clean Architecture
- [x] DDD Boundaries Respected
- [x] Event-Driven Publishing
- [x] AI-Assisted (Not Autonomous)
- [x] Multi-Tenant + TLP
- [x] Explainable & Auditable

### 43. Glossary & 44. References
- **TLP:** Traffic Light Protocol.
- **STIX/TAXII:** Standardized language and transport for CTI.
- **Reference:** Volume 02 (Enterprise Architecture), Volume 03 (AI Platform).
