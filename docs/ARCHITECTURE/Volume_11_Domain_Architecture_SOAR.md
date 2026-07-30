# Volume 11 – Domain Architecture: Security Orchestration, Automation & Response (SOAR)
**Document Status:** DRAFT (Pending Approval via AR-0010)
**Version:** 1.0

---

## Part 1: Strategic Overview

### 1. Executive Summary
The Security Orchestration, Automation & Response (SOAR) domain is the authoritative response and remediation layer of the CYBERMIND CyberOS. It translates operational decisions (from SOC) and detections (from SIEM) into governed, automated, or human-approved security playbooks.

### 2. Vision & 3. Design Goals
To abstract response logic away from individual analysts and operational domains, providing a centralized library of executable, governed security playbooks.
- **Goals:** Decouple business logic (Playbooks) from execution infrastructure (Workflow Platform); enforce strict Human-in-the-Loop governance; provide a unified layer for connector orchestration.

### 4. Guiding Principles
- **Constitutional Alignment (Rule #22 & #23):** SOAR orchestrates response expertise. It consumes the Workflow Platform for execution guarantees. Response policies are governed assets, and automated remediation actions must be auditable, idempotent, and recoverable.

---

## Part 2: Domain-Driven Design (DDD)

### 5. Ubiquitous Language
- **Playbook:** A business logic definition of a security response procedure.
- **Automation Action:** A discrete, stateless script or API call executing a connector capability.
- **Remediation Policy:** A rule defining *when* a playbook should execute and *what* approvals are required.

### 6. Bounded Contexts & 7. Context Map
- **Consumers (Downstream):** None. SOAR is a terminal operational domain that interacts with external environment integrations (Firewalls, EDR, IAM).
- **Dependencies (Upstream):** 
  - *Execution:* Workflow Platform
  - *Trigger/Context:* SIEM, SOC, CTI
  - *Trust:* Identity

### 8. Domain Model & 9. Response Object Taxonomy
- `Playbook`, `PlaybookExecutionStatus`, `AutomationAction`, `RemediationPolicy`, `ResponseConnector`.
- **Taxonomy:** Containment (Isolate, Block), Eradication (Delete, Terminate), Recovery (Restore, Unblock), Enrichment (Lookup, Scan).

---

## Part 3: Architecture & Orchestration Lifecycle

### 10. Orchestration Lifecycle
1. **Trigger:** Event received (e.g., `AlertCreated` from SIEM or `DecisionRecorded` from SOC).
2. **Policy Evaluation:** SOAR determines the correct Playbook and evaluates required approval thresholds.
3. **Dispatch:** SOAR compiles the Playbook into a Workflow DSL and dispatches it to the Workflow Platform.
4. **Execution Coordination:** Workflow Platform manages state; SOAR manages the business logic of individual Automation Actions.
5. **Completion:** Playbook finishes; SOAR updates the SOC Case with the outcome.

### 11. Playbook Architecture & 12. Automation Logic
- Playbooks are version-controlled assets. They define the *What* and *Why* of a response. The Workflow platform handles the *How* (retries, state, compensations).
- Automation actions are strictly idempotent (e.g., `EnsureIPBlocked` rather than `BlockIP` to prevent errors if the IP is already blocked).

### 13. Remediation Governance & 14. Connector Orchestration
- **Governance:** High-risk actions (e.g., "Shutdown Production Server") have embedded Remediation Policies requiring M-of-N approvals from authorized Identity roles.
- **Connector Orchestration:** Connectors execute as isolated, sandboxed functions (e.g., Docker containers or WebAssembly modules) to prevent malicious payloads or memory leaks from crashing the SOAR core.

---

## Part 4: Integrations

### 15. Event Model
- **Consumed:** `AlertCreated` (SIEM), `OperationalDecisionRecorded` (SOC), `WorkflowCompleted` (Workflow).
- **Published:** `PlaybookStarted`, `RemediationExecuted`, `ResponseApprovalRequested`, `PlaybookCompleted`.

### 16. Workflow Integration
- SOAR is the primary consumer of the Workflow Platform. SOAR delegates the heavy lifting of state management, timeouts, retries, and compensation to the Workflow engine.

### 17. SIEM & SOC Integration
- SOAR consumes SIEM Alerts for automated triage/enrichment playbooks.
- SOAR consumes SOC Decisions for human-directed containment playbooks.

### 18. CTI & Knowledge Graph Integration
- SOAR queries CTI for threat intelligence to pass into enrichment playbooks.
- SOAR queries the Knowledge Graph to calculate the Blast Radius of an asset before authorizing an automated isolation (e.g., "Do not automatically isolate a Domain Controller").

### 19. Identity & 20. Notification Integration
- Identity evaluates approval policies.
- Notification handles critical playbook escalations and human approval requests (Slack/Teams integration).

---

## Part 5: Infrastructure & Operations

### 21. Storage Abstraction
- Relational database stores Playbook definitions, Remediation Policies, and Connector configurations. 
- Execution state is NOT stored in SOAR; it belongs to the Workflow Platform.

### 22. Security Architecture & 23. Multi-Tenant Strategy
- **Security:** Secret Management is paramount. SOAR connectors require highly privileged API keys (e.g., EDR admin tokens). These are stored in an external Vault and injected at runtime.
- **Multi-Tenant:** Playbooks can be global (System) or tenant-specific. Execution sandboxes are strictly isolated per tenant.

### 24. Performance & 25. Scalability Strategy
- Connector execution scales horizontally via Kubernetes Jobs or serverless functions to handle mass-remediation events (e.g., isolating 10,000 endpoints simultaneously).

### 26. Disaster Recovery, 27. Monitoring, & 28. Observability
- OpenTelemetry tracks `soar.playbook.duration`, `soar.connector.latency`, `soar.remediation.success_rate`.

### 29. Audit Strategy & 30. Data Lifecycle
- Every response action, approval, and connector output is permanently archived for legal and forensic compliance.

---

## Part 6: Governance

### 31. Engineering Decisions & 32. ADRs
- **EDR-SOAR-01:** Playbook execution state is delegated to the Workflow Platform. SOAR maintains the business logic, UI, and connector execution.
- **EDR-SOAR-02:** Strict Connector Sandboxing. Connectors execute out-of-process.

### 33. Risks & 34. Future Expansion
- **Risk:** Automated disruption of business operations (False Positives causing mass-isolation). Mitigated by Knowledge Graph blast-radius checks and required human approvals for critical assets.
- **Expansion:** AI Agent integration where an AI orchestrates sub-playbooks dynamically.

### 35. Architecture Validation Checklist
- [x] Clean Architecture
- [x] DDD Boundaries Respected
- [x] Consumes Workflow Layer
- [x] Human-in-the-Loop Approvals
- [x] Idempotent Actions
- [x] Enterprise Scale

### 36. Glossary & 37. References
- **Idempotent Automation:** An automation action that produces the same safe result regardless of how many times it is executed.
- **Reference:** Volume 08 (Workflow Platform), Volume 09 (SOC).
