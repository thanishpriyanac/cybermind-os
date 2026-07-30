# Volume 16 – Domain Architecture: Exposure Management
**Document Status:** DRAFT (Pending Approval via AR-0015)
**Version:** 1.0

---

## Part 1: Strategic Overview

### 1. Executive Summary
The Exposure Management domain is the enterprise cyber risk aggregation layer of the CYBERMIND CyberOS. It continuously computes enterprise cyber risk from authoritative data produced by other domains and transforms that data into prioritized, actionable exposure intelligence.

### 2. Vision & 3. Design Goals
To unify disparate risk metrics (vulnerabilities, external exposures, identity risk, asset criticality) into a single, cohesive, business-aligned exposure score.
- **Goals:** Aggregate risk without duplicating detection or discovery, map exposures to business services, and provide executive-level visibility into the organization's true attack paths.

### 4. Guiding Principles
- **Constitutional Alignment:** Exposure is a governed enterprise risk metric derived from authoritative domains rather than independently discovered data. Exposure Management never discovers, detects, or remediates.

---

## Part 2: Domain-Driven Design (DDD)

### 5. Ubiquitous Language
- **Exposure Score:** A normalized, dynamic metric (e.g., 0-100) representing the risk posture of an asset, identity, or business service.
- **Attack Path:** A connected graph of exposures demonstrating how an adversary could breach a critical asset.
- **Security Posture:** The aggregated exposure score across the entire enterprise.

### 6. Bounded Contexts & 7. Context Map
- **Consumers (Downstream):** GRC (consumes posture for compliance reporting), Executive Dashboard (reporting).
- **Dependencies (Upstream):** VM (Vulnerabilities), ASM (External Exposures), Asset Platform (CMDB), Identity (Privilege risk), Knowledge Graph (Relationships).

### 8. Domain Model & 9. Exposure Taxonomy
- `EnterpriseExposureScore`, `AssetExposureProfile`, `AttackPathDefinition`, `PostureSnapshot`.

---

## Part 3: Architecture & Lifecycle

### 10. Exposure Lifecycle
1. **Collect:** Ingest findings from VM and ASM.
2. **Correlate:** Overlay findings with Identity privilege and Asset criticality.
3. **Score:** Compute dynamic risk scores based on exploitability and business impact.
4. **Prioritize:** Rank remediation efforts based on the highest-risk Attack Paths.
5. **Recommend:** Push prioritized recommendations to the Workflow platform.
6. **Recalculate:** Continuously update scores as underlying state changes.

### 11. Scoring Architecture
The scoring engine runs asynchronously, recalculating `ExposureScores` whenever an underlying domain publishes an event (e.g., `FindingRemediated` from VM or `PrivilegeGranted` from PAM).

### 12. Attack Path Analysis
Rather than simply listing vulnerabilities, Exposure Management queries the Knowledge Graph to stitch together multi-step attack paths (e.g., Phishing -> Compromised Endpoint -> Over-privileged IAM Role -> Sensitive S3 Bucket).

---

## Part 4: Integrations

### 13. Event Model
- **Consumed:** `FindingCreated` (VM), `ExposureDetected` (ASM), `AssetRegistered` (Asset Platform).
- **Published:** `ExposureScoreUpdated`, `RiskPrioritized`.

### 14. Asset & Vulnerability Integration
- Exposure Management consumes asset metadata and vulnerability findings purely as read-only inputs for its scoring algorithms.

### 15. Knowledge Graph Integration
- Relies heavily on the Graph to traverse relationships between identities, assets, and vulnerabilities to calculate true blast radius.

### 16. Workflow Integration
- Prioritized remediation campaigns are dispatched to Workflow for execution.

### 17. Identity & 18. Public APIs
- **Identity:** Provides context on user privilege levels (e.g., Domain Admins increase the exposure score of compromised endpoints).
- **APIs:** 
  - `GET /api/exposure/enterprise/score`
  - `GET /api/exposure/assets/{id}/paths`
  - `POST /api/exposure/recalculate`

---

## Part 5: Infrastructure & Operations

### 19. Storage Abstraction
- Leverages OLAP (Online Analytical Processing) databases for rapid, multi-dimensional slicing and dicing of enterprise risk metrics across business units.

### 20. Security Architecture & 21. Multi-Tenant Strategy
- **Multi-Tenant:** Risk algorithms and weighting factors can be tuned per-tenant, ensuring MSSPs can apply custom risk models to different clients.

### 22. Performance & 23. Scalability Strategy
- Batch processing pipelines (e.g., Apache Spark) recalculate global exposure scores nightly, while stream processors (e.g., Apache Flink) adjust individual asset scores in near real-time.

### 24. Audit Strategy & 25. Data Lifecycle
- `PostureSnapshots` are archived monthly to demonstrate historical risk reduction to auditors and the board.

---

## Part 6: Governance

### 26. Engineering Decisions & 27. ADRs
- **EDR-EXP-01:** Exposure Management does not execute active scans. It computes risk purely from authoritative downstream services.

### 28. Risks & 29. Future Expansion
- **Risk:** Stale data from upstream domains artificially inflating/deflating scores. Mitigated by data freshness tracking.
- **Expansion:** Predictive Exposure Modeling (e.g., "What-if" simulations of patching a specific CVE).

### 30. Architecture Validation Checklist
- [x] Clean Architecture
- [x] No Discovery or Remediation logic
- [x] Consumes Knowledge Graph
- [x] Dynamic Scoring Model
