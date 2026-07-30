# Volume 13 – Domain Architecture: Threat Hunting
**Document Status:** DRAFT (Pending Approval via AR-0012)
**Version:** 1.0

---

## Part 1: Strategic Overview

### 1. Executive Summary
The Threat Hunting domain is the proactive analytical discovery engine of the CYBERMIND CyberOS. While the SIEM passively monitors telemetry against known rules, Threat Hunting empowers analysts to actively search for hidden adversaries, zero-days, and sophisticated behavioral anomalies that evade traditional detections.

### 2. Vision & 3. Design Goals
To shift CYBERMIND from a purely reactive defense posture to a proactive hunting ecosystem.
- **Goals:** Formalize the threat hunting lifecycle (Hypothesis -> Search -> Pivot -> Discovery), maintain governed Hunt Campaigns, and seamlessly integrate with the CTI, Search, and Graph platforms to enrich the analyst's query scope without duplicating data storage.

### 4. Guiding Principles
- **Hunt, Don't Alert:** Threat Hunting does not generate real-time alerts. When a hunt discovers malicious activity, it spawns a SOC Case. When a hunt discovers a repeatable pattern, it spawns a SIEM Detection Rule.
- **Proactive Discovery:** Hunts are driven by intelligence (CTI), frameworks (MITRE ATT&CK), and hypotheses, rather than reactive triggers.

---

## Part 2: Domain-Driven Design (DDD)

### 5. Ubiquitous Language
- **Hunt Campaign:** A time-boxed, objective-driven proactive search initiative (e.g., "Hunt for SolarWinds indicators across Q3").
- **Hypothesis:** A testable statement guiding the hunt (e.g., "Adversaries are using PowerShell to dump credentials on developer workstations").
- **Pivot:** The analytical action of taking one indicator (e.g., an IP) and querying related datasets to discover new indicators (e.g., domains associated with that IP).
- **Finding:** A verified malicious or anomalous discovery resulting from a hunt.

### 6. Bounded Contexts & 7. Context Map
- **Consumers (Downstream):** SOC (consumes Findings to create Incidents); SIEM (consumes Hunt logic to create Detections); CTI (consumes novel IOCs discovered during the hunt).
- **Dependencies (Upstream):** SIEM (Telemetry), CTI (Intel), Knowledge Graph (Context), Search (Discovery Engine).

### 8. Domain Model & 9. Hunting Object Taxonomy
- `HuntCampaign`, `HuntHypothesis`, `HuntQuery`, `HuntFinding`, `HuntReport`.
- **Taxonomy:** Intelligence-Driven (IOC sweeps), Hypothesis-Driven (Behavioral queries), Baseline-Driven (Anomaly hunting).

---

## Part 3: Architecture & Hunting Lifecycle

### 10. Hunting Lifecycle
1. **Hypothesis Generation:** Analyst formulates a hypothesis based on CTI, industry news, or internal risk.
2. **Campaign Planning:** A Hunt Campaign is created, defining scope, timeline, and targeted assets (e.g., "Crown Jewel servers").
3. **Execution (Query & Pivot):** Analyst utilizes the Search and Graph platforms to query historical SIEM telemetry and pivot across relationships.
4. **Validation:** Analysts review the results to filter out false positives and environmental noise.
5. **Operationalization:** 
   - If a threat is found -> Escalate to SOC Case.
   - If a pattern is found -> Author SIEM Detection Rule.
6. **Reporting:** Findings and metrics are documented in a Hunt Report.

### 11. Hunt Campaign Architecture
Campaigns track the overall mission. They store queries executed, data sources searched, analysts involved, and the specific MITRE ATT&CK techniques investigated.

### 12. Hypothesis & 13. Query Management
- Hypotheses are structured objects requiring a rationale and expected outcome.
- Queries (e.g., KQL/SPL) are saved and versioned within the campaign, allowing for reproducibility and peer review.

### 14. Pivot Engine
A specialized UI component that bridges Search and Graph. When an analyst clicks an IP address in a search result, the Pivot Engine automatically suggests related graph queries (e.g., "Show all identities that logged in from this IP in the last 30 days").

---

## Part 4: Integrations

### 15. Event Model
- **Consumed:** `ThreatPublished` (CTI), `NewAssetDiscovered` (Asset Platform).
- **Published:** `HuntCampaignStarted`, `HuntFindingConfirmed`, `HuntCampaignCompleted`.

### 16. SIEM & Search Integration
- Threat Hunting heavily consumes the SIEM's indexed telemetry via the Search Platform's unified APIs. It performs deep, historical queries over cold storage (which SIEM real-time correlation typically avoids).

### 17. CTI Integration
- CTI acts as the primary driver for Intelligence-Driven hunts. High-fidelity threat reports are directly imported into Hunt Campaigns to seed initial queries.

### 18. Knowledge Graph Integration
- The Graph provides the blast radius and relationship context essential for pivoting (e.g., tracking an attacker's lateral movement across identity graphs and network topologies).

### 19. AI Integration
- AI Platform assists by summarizing massive query result sets, suggesting KQL queries to test a natural language hypothesis, and identifying statistical anomalies in behavioral data (e.g., "This endpoint's beaconing behavior deviates 3-sigma from the baseline").

### 20. Identity & 21. Public APIs
- **Identity:** Controls access to sensitive historical telemetry during hunts.
- **APIs:** 
  - `POST /api/hunt/campaigns`
  - `POST /api/hunt/campaigns/{id}/queries`
  - `POST /api/hunt/findings/escalate`

---

## Part 5: Infrastructure & Operations

### 22. Storage Abstraction
- PostgreSQL stores Campaign metadata, Hypotheses, Saved Queries, and Reports.
- The actual telemetry queried lives in the SIEM/Search datastores; Threat Hunting does not duplicate it.

### 23. Security Architecture & 24. Multi-Tenant Strategy
- **Security:** Hunt queries are audited. 
- **Multi-Tenant:** Managed Security Service Providers (MSSPs) can execute a single Hunt Campaign simultaneously across multiple tenant environments, aggregating the findings while preserving strict tenant data isolation.

### 25. Performance & 26. Scalability Strategy
- Hunting queries are inherently resource-intensive (long look-backs). The architecture utilizes asynchronous query jobs and materialized views in the SIEM datastore to prevent Hunt queries from impacting real-time SIEM ingestion.

### 27. Disaster Recovery, 28. Monitoring, & 29. Observability
- OpenTelemetry tracks `hunt.query.execution_time`, `hunt.campaign.duration`.

### 30. Audit Strategy & 31. Data Lifecycle
- Every executed query is logged to prevent abuse (e.g., an insider threat searching for executive communications). Hunt Reports are archived permanently.

---

## Part 6: Governance

### 32. Engineering Decisions & 33. ADRs
- **EDR-HUNT-01:** Threat Hunting acts as a consumer of SIEM datastores. It must use asynchronous batch queries for historical searches > 30 days to protect SIEM real-time performance.
- **EDR-HUNT-02:** Findings are not actionable until escalated. A Finding must be formally escalated to a SOC Case or SIEM Rule to impact the operational environment.

### 34. Risks & 35. Future Expansion
- **Risk:** "Query of Death" taking down SIEM databases. Mitigated by strict resource limits and query timeouts enforced by the Search Platform.
- **Expansion:** Automated continuous hunting (where hypotheses are tested on a rolling schedule in the background).

### 36. Architecture Validation Checklist
- [x] Clean Architecture
- [x] DDD Boundaries Respected
- [x] No Telemetry Duplication
- [x] Asynchronous Query Design
- [x] Strict Escalation Paths
- [x] Multi-Tenant Hunting Capable

### 37. Glossary & 38. References
- **KQL/SPL:** Query languages used for searching telemetry.
- **Reference:** Volume 06 (CTI), Volume 10 (SIEM).
