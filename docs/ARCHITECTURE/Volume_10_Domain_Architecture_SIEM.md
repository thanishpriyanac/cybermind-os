# Volume 10 – Domain Architecture: Security Information and Event Management (SIEM)
**Document Status:** DRAFT (Pending Approval via AR-0009)
**Version:** 1.0

---

## Part 1: Strategic Overview

### 1. Executive Summary
The Security Information and Event Management (SIEM) domain is the high-velocity telemetry, normalization, and detection engine of the CYBERMIND CyberOS. It ingests massive volumes of raw data, normalizes it into a canonical schema, correlates events, and generates actionable alerts for the SOC. 

### 2. Vision & 3. Design Goals
To process enterprise-scale telemetry with sub-second latency while completely decoupling the detection layer from incident management.
- **Goals:** Universal log parsing, deterministic signature and behavioral detection, and strict adherence to the boundary that SIEM produces alerts, not investigations.

### 4. Guiding Principles
- **Constitutional Alignment (Rule #24):** Telemetry is an immutable operational record. The SIEM preserves, normalizes, correlates, and detects from telemetry, but investigations, intelligence, and remediation remain the responsibility of their authoritative domains.

---

## Part 2: Domain-Driven Design (DDD)

### 5. Ubiquitous Language
- **Telemetry:** Raw log data originating from a sensor, network, or cloud asset.
- **Normalized Event:** Telemetry transformed into the SIEM's canonical schema.
- **Detection Rule:** A logical expression evaluated against normalized events.
- **Alert:** The output of a triggered detection rule.

### 6. Bounded Contexts & 7. Context Map
- **Consumers (Downstream):** SOC (consumes Alerts), Search (indexes Telemetry metadata).
- **Dependencies (Upstream):** CTI (consumes Threat Intel for correlation), Identity (AuthZ).

### 8. Domain Model & 9. Telemetry Taxonomy
- `RawEvent`, `NormalizedEvent`, `Alert`, `DetectionRule`, `Parser`.
- **Taxonomy:** Endpoint, Network, Identity, Cloud, Application, Database.

---

## Part 3: Architecture & Ingestion Lifecycle

### 10. Ingestion Architecture & 11. Canonical Event Model
- **Pipeline:** Collector -> Parser -> Normalizer -> Enrichment -> Correlation -> Storage -> Publication.
- **Canonical Model:** Enforces a rigid schema (`timestamp`, `tenant_id`, `src_ip`, `dest_ip`, `user_id`, `action`, `outcome`). If raw data cannot map to this schema, it is stored in an unstructured `raw_payload` blob, but the structured fields guarantee uniform detection rules.

### 12. Parser Architecture & 13. Normalization Pipeline
- Parsers run as stateless micro-workers capable of horizontal scaling to millions of EPS (Events Per Second). Regex and Grok patterns map raw vendor logs to the Canonical Event Model.

### 14. Correlation Engine
- A complex event processing (CEP) engine evaluates sliding time windows (e.g., "5 failed logins followed by 1 successful login from the same IP within 5 minutes").

### 15. Detection Engine & 16. Rule Management
- **Engine:** Supports Sigma rules natively. Evaluates rules deterministically.
- **Rule Management:** Rules are versioned assets stored in Git (Detection-as-Code). Each rule explicitly maps to MITRE ATT&CK techniques.

### 17. Alert Model
- Alerts contain `AlertID`, `DetectionRule`, `Severity`, `MITRE_Mapping`, and an array of `EvidenceReferences` (pointers to the exact telemetry events that triggered the rule).
- **Critical Boundary:** Alerts are *not* Cases. If the SOC investigates an alert, the SOC creates a Case and links the Alert.

### 18. Retention Strategy
- Multi-tier storage: Hot (NVMe) for 30 days, Warm (SSD) for 90 days, Cold (S3/Glacier) for 1-7 years based on compliance mandates.

---

## Part 4: Integrations

### 19. Event Model
- **Consumed:** `ThreatPublished` (CTI), `IdentityUpdated` (Identity).
- **Published:** `AlertCreated`, `DetectionRuleTriggered`, `TelemetryArchived`.

### 20. AI Integration
- AI is strictly advisory. It generates human-readable explanations of complex detection rules or translates natural language queries into SIEM search syntax (e.g., KQL/SPL equivalent). AI does **not** evaluate alerts autonomously to prevent non-deterministic security omissions.

### 21. Knowledge Graph Integration
- SIEM queries the Graph during Enrichment to add context (e.g., tagging a normalized event with `is_critical_asset: true` if the Graph confirms it). SIEM does not modify the Graph.

### 22. CTI Integration
- SIEM ingests high-confidence IOCs published by CTI into memory caches (e.g., Redis) for real-time match correlation against incoming telemetry streams.

### 23. Search Integration & 24. Workflow Integration
- SIEM metadata is synced to the Search Platform for cross-domain discovery.
- SIEM triggers the Workflow Platform for rule lifecycle approvals (e.g., "Approve promotion of Rule XYZ from Staging to Production").

### 25. Identity & 26. Public APIs
- `POST /api/siem/ingest`
- `GET /api/siem/alerts`
- `POST /api/siem/rules/evaluate`

---

## Part 5: Infrastructure & Operations

### 27. Storage Abstraction
- Raw telemetry and parsed events require columnar, time-series optimized datastores (e.g., ClickHouse, Apache Pinot). The architecture abstracts this behind a `TelemetryRepository`.

### 28. Security Architecture & 29. Multi-Tenant Strategy
- Deep multi-tenancy. Telemetry is physically partitioned or strictly logically isolated by `tenant_id`. RBAC ensures a user in Tenant A cannot query Tenant B's logs.

### 30. Performance & 31. Scalability Strategy
- Event Bus (e.g., Kafka/Redpanda) buffers ingestion spikes. The parsing and detection layers autoscale based on Kafka consumer lag.

### 32. Disaster Recovery, 33. Monitoring, & 34. Observability
- OpenTelemetry tracks `siem.ingest.eps`, `siem.pipeline.latency`, `siem.detection.evaluation_time`.
- Kafka ensures zero telemetry loss during database or worker crashes.

### 35. Audit Strategy & 36. Data Lifecycle
- Any modification to Detection Rules or Parser schemas requires an auditable Git commit and CI/CD workflow approval.

---

## Part 6: Governance

### 37. Engineering Decisions & 38. ADRs
- **EDR-SIEM-01:** Alerts are distinct from Investigations. SIEM produces Alerts; SOC handles Investigations.
- **EDR-SIEM-02:** Detection-as-Code is mandatory. UI rule creation generates Git commits behind the scenes.

### 39. Risks & 40. Future Expansion
- **Risk:** Parsing bottlenecks. Mitigated by pushing parsing logic out to edge agents where possible.
- **Expansion:** Integration with XDR agents for active endpoint telemetry.

### 41. Detection Quality Metrics
- Rule Efficacy (True Positive vs False Positive ratio), Rule Coverage (vs MITRE ATT&CK), Time-to-Detect (TTD).

### 42. Architecture Validation Checklist
- [x] Clean Architecture
- [x] DDD Boundaries Respected
- [x] Event-Driven (Kafka backbone)
- [x] Canonical Event Model
- [x] Detection Governance (Detection-as-Code)
- [x] Enterprise Scale

### 43. Glossary & 44. References
- **Detection-as-Code:** Managing SIEM rules using software engineering practices (version control, testing, CI/CD).
- **Reference:** Volume 09 (SOC), Volume 06 (CTI).
