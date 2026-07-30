# Volume 15 – Domain Architecture: Attack Surface Management (ASM)
**Document Status:** DRAFT (Pending Approval via AR-0014)
**Version:** 1.0

---

## Part 1: Strategic Overview

### 1. Executive Summary
The Attack Surface Management (ASM) domain is the continuous external discovery engine of the CYBERMIND CyberOS. It maps the organization's digital footprint from the outside-in, identifying internet-facing assets, rogue infrastructure, shadow IT, and exposed cloud resources that often evade internal agent-based visibility.

### 2. Vision & 3. Design Goals
To eliminate blind spots by providing an attacker's view of the enterprise perimeter. 
- **Goals:** Continuous discovery, automated attribution of unknown assets to business units, and strict separation of discovery logic from the authoritative Asset Platform (CMDB) and Vulnerability Management (VM).

### 4. Guiding Principles
- **ASM Discovers, Asset Platform Owns:** ASM finds IPs, Domains, and Certificates. However, ASM does not become the CMDB. It submits discovered entities to the Asset Platform for reconciliation and authoritative ownership tracking.
- **Outside-In Perspective:** ASM assumes zero internal access. It discovers infrastructure via DNS, WHOIS, BGP, Shodan, port scanning, and certificate transparency logs.

---

## Part 2: Domain-Driven Design (DDD)

### 5. Ubiquitous Language
- **Seed:** A known root asset (e.g., a primary corporate domain) used as the starting point for discovery.
- **Discovered Asset:** An externally facing entity (IP, Domain, Subdomain, Cloud Bucket, API endpoint) identified during a scan.
- **Shadow IT:** A discovered asset belonging to the enterprise but previously unknown to the Asset Platform.
- **Exposure:** An open port, expired certificate, or exposed service on a Discovered Asset.

### 6. Bounded Contexts & 7. Context Map
- **Consumers (Downstream):** Asset Platform (consumes Discovered Assets for reconciliation); VM (consumes Exposures for risk scoring).
- **Dependencies (Upstream):** CTI (Threat Actor targeting intel); Knowledge Graph (Blast radius context).

### 8. Domain Model & 9. Exposure Taxonomy
- `SeedNode`, `DiscoveryJob`, `DiscoveredAsset`, `CertificateRecord`, `OpenService`.
- **Taxonomy:** Domains, Subdomains, IPs, ASNs, Cloud Storage, Exposed APIs, Certificates, Third-Party Hosted Pages.

---

## Part 3: Architecture & Discovery Lifecycle

### 10. Discovery Lifecycle
1. **Seeding:** The system is seeded with known corporate ASNs, root domains, and cloud accounts.
2. **Reconnaissance:** ASM engines (distributed globally to avoid geographic filtering) perform continuous, non-intrusive enumeration (DNS bruteforcing, port scanning, scraping).
3. **Attribution:** Machine learning and rule-based heuristics determine if the newly discovered asset belongs to the organization (e.g., matching copyright strings, CNAME records, or IP ownership blocks).
4. **Reconciliation:** ASM publishes the attributed asset to the Asset Platform.
5. **Exposure Analysis:** ASM catalogs open ports and technologies running on the asset, passing potential vulnerabilities to the VM domain.
6. **Continuous Monitoring:** The asset is added to a high-frequency monitoring loop to track state changes (e.g., a port opening or certificate expiring).

### 11. Discovery Engine Architecture
The engine uses a distributed, microservice-based architecture to circumvent rate-limiting and geo-blocking. Workers pull tasks from a queue (e.g., `ScanDomain(xyz.com)`) and push results back to a central ingestion API.

### 12. Attribution Model
Confidence scoring is applied to attribution.
- *High Confidence:* CNAME resolves to an internal AWS account.
- *Low Confidence:* Website contains a similar logo but is hosted on an unknown Russian ASN. Low-confidence assets require a SOC or IT workflow for manual verification.

---

## Part 4: Integrations

### 13. Event Model
- **Consumed:** `AssetRegistered` (Asset Platform), `SeedAdded` (Configuration).
- **Published:** `AssetDiscovered`, `ExposureDetected`, `CertificateExpiring`.

### 14. Asset Platform & VM Integration
- ASM discovers an IP -> Asks Asset Platform "Do you know this IP?" -> If No, ASM triggers an `AssetDiscovered` event. Asset Platform creates a "Shadow IT" record.
- ASM passes banner grabs and open port data directly to Vulnerability Management, which treats it as a finding and assigns an SLA.

### 15. CTI & Knowledge Graph Integration
- ASM queries CTI for known malicious IPs. If an external enterprise IP is communicating with a CTI-flagged sinkhole, ASM escalates the exposure.
- The Knowledge Graph ingests the ASM topology, linking external domains to internal services, providing a clear Attack Path from the internet to internal data stores.

### 16. Workflow Integration
- When ASM attributes a new asset with High Confidence, it triggers a Workflow to automatically query cloud APIs to find the developer who spun up the instance, automatically assigning ownership.

### 17. Identity & 18. Public APIs
- **Identity:** Controls access to the discovery rules and seed definitions.
- **APIs:** 
  - `POST /api/asm/seeds`
  - `GET /api/asm/discoveries`
  - `POST /api/asm/jobs/trigger`

---

## Part 5: Infrastructure & Operations

### 19. Storage Abstraction
- A highly connected Graph Database (e.g., Neo4j/Amazon Neptune) is used internally by ASM to manage the complex, constantly changing relationships between domains, subdomains, IPs, and certificates before publishing the finalized state to the enterprise Knowledge Graph.

### 20. Security Architecture & 21. Multi-Tenant Strategy
- **Security:** Scanning workers must originate from designated, published IP ranges so internal SOCs can whitelist them and avoid false-positive SIEM alerts.
- **Multi-Tenant:** Seeds and Discovery Jobs are strictly partitioned by `tenant_id`.

### 22. Performance & 23. Scalability Strategy
- Internet-wide scanning generates massive, noisy datasets. Distributed data streaming (Kafka) and stream-processing (Apache Flink) filter out noise and deduplicate results before they hit the ASM datastore.

### 24. Disaster Recovery, 25. Monitoring, & 26. Observability
- OpenTelemetry tracks `asm.discovery.latency`, `asm.worker.throughput`, `asm.attribution.confidence_avg`.

### 27. Audit Strategy & 28. Data Lifecycle
- Historical discovery states are snapshotted daily. If an asset disappears from the internet, it is marked `Offline` but retained for 1 year to preserve historical context for DFIR.

---

## Part 6: Governance

### 29. Engineering Decisions & 30. ADRs
- **EDR-ASM-01:** ASM will not perform authenticated vulnerability scanning. It strictly performs external discovery and exposure monitoring (ports/banners/certs). Deep scanning is delegated to VM.
- **EDR-ASM-02:** ASM does not maintain the authoritative asset inventory. It is an upstream discovery feed for the Asset Platform.

### 31. Risks & 32. Future Expansion
- **Risk:** High false-positive attribution leading to SOC alert fatigue. Mitigated by the Attribution Confidence Score and Workflow-driven human verification.
- **Expansion:** Dark Web integration to discover leaked credentials associated with discovered corporate domains.

### 33. Architecture Validation Checklist
- [x] Clean Architecture
- [x] DDD Boundaries Respected (No CMDB/VM overlap)
- [x] Outside-In Perspective Maintained
- [x] Event-Driven Discovery
- [x] High-Scale Distributed Scanning

### 34. Glossary & 35. References
- **Shadow IT:** Software or hardware utilized by employees without the knowledge or approval of the IT/Security department.
- **Reference:** Volume 14 (Vulnerability Management), Volume 27 (Asset Platform).
