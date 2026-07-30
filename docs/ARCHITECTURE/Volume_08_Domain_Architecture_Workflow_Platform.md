# Volume 8 – Domain Architecture: Workflow & Automation Platform
**Document Status:** DRAFT (Pending Approval via AR-0007)
**Version:** 1.0

---

## Part 1: Strategic Overview

### 1. Executive Summary
The Workflow & Automation Platform is the central orchestration engine of the CYBERMIND CyberOS. It serves as the unified execution layer, providing durable, scalable, and auditable orchestration for all long-running processes, manual approvals, and automated remediation actions across the enterprise.

### 2. Vision & 3. Design Goals
To abstract the complexity of state management, retries, and failure compensation away from domain services.
- **Goals:** Ensure 100% durability (survive crashes/restarts), maintain strict vendor independence from the underlying workflow engine, and enforce Human-in-the-Loop (HITL) accountability for governance-sensitive decisions.

### 4. Guiding Principles
- **Constitutional Alignment (Rule #20):** Workflow coordinates execution but never owns business logic. Every domain remains responsible for its own business decisions; the Workflow Platform orchestrates those decisions through well-defined contracts, events, and approvals.

---

## Part 2: Domain-Driven Design (DDD)

### 5. Ubiquitous Language
- **Workflow:** A versioned definition of a business process (DAG of tasks).
- **Execution:** A single running instance of a Workflow.
- **Task (Node):** A discrete step within a workflow (e.g., API call, AI request, wait timer).
- **Compensation:** A rollback action triggered when a subsequent task fails.
- **Approval:** A human-gated decision point suspending workflow execution.

### 6. Bounded Contexts & 7. Context Map
- **Consumers (Downstream):** SOC, SIEM, SOAR, DFIR, GRC (triggering workflows).
- **Dependencies (Upstream):** Identity (AuthZ/Approvals), Knowledge Graph (Context), Search (Discovery).
- **Integration Layer:** Connectors to execute external APIs (e.g., Firewall block, EDR quarantine).

### 8. Domain Model & 9. Workflow Taxonomy
Models define execution graphs.
- **Taxonomy:** 
  - `Playbooks` (Security automation)
  - `Approval Flows` (Access requests, publishing)
  - `Long-Running Processes` (Investigation lifecycles, Data archiving)
  - `Scheduled Jobs` (Daily compliance checks)

---

## Part 3: Architecture & Execution Lifecycle

### 10. Execution Lifecycle & 11. State Model
1. **Trigger:** Event Bus or API initiates an Execution.
2. **State Hydration:** Engine loads the current state into memory.
3. **Task Dispatch:** Engine evaluates the next DAG node and dispatches the task.
4. **Execution:** Worker performs the task (idempotently).
5. **State Persisted:** Engine records the transition in durable storage.
6. **Completion/Failure:** Terminal state reached; metrics and audit logs emitted.

### 12. Task Model & 13. Approval Model
- **Task Types:** Service Task, AI Task, Human Task, Timer, Parallel Gateway.
- **Approvals:** Gated by Identity RBAC. Approvals capture `user_id`, `timestamp`, `comments`, and `decision`. If an approval times out, an escalation path is triggered.

### 14. Automation Model & 15. Scheduling Architecture
- Automation tasks must be deterministic, idempotent, and retry-able.
- Scheduling supports Cron syntax and fixed-delay execution (e.g., "Check status in 24 hours").

### 16. Retry & Compensation Strategy
- Transients (HTTP 503) trigger Exponential Backoff.
- Hard failures (HTTP 401) trigger a Compensation Path (e.g., if "Isolate Host" succeeds but "Block IP" fails, the workflow executes "Unisolate Host" to revert the system to a clean state).

### 17. Versioning Strategy
Workflows are strictly versioned (`v1.0.0`, `v1.0.1`). Active executions complete using the version they started with. New executions use the latest published version.

---

## Part 4: Integrations

### 18. Event Model
- **Published Events:** `WorkflowStarted`, `TaskCompleted`, `ApprovalRequested`, `ApprovalGranted`, `WorkflowFailed`, `WorkflowCompleted`.
- **Consumed Events:** Domain triggers (e.g., `HighSeverityAlertCreated` triggers the `TriagePlaybook`).

### 19. Human-in-the-Loop Architecture
Execution is suspended (persisted to DB) while waiting for Human input. A `ResumeExecution` webhook awakens the workflow once the analyst clicks "Approve" in the UI.

### 20. AI Integration
AI acts as a task executor. Workflows can dispatch tasks like "Summarize Threat Report" or "Suggest Remediation Options" to the AI Platform. The AI returns structured output, which the workflow routes to a human for final approval.

### 21. Knowledge Graph & 22. Search & 23. Identity & 24. Notification Integrations
- **Graph:** Workflow tasks query Blast Radius context.
- **Search:** Workflow tasks discover historical cases.
- **Identity:** Ensures the human approver holds the correct Role.
- **Notification:** Dispatches emails/Slack messages during `ApprovalRequested` tasks.

### 25. Public APIs
- `POST /api/workflow/execute`
- `GET /api/workflow/executions/{id}/status`
- `POST /api/workflow/tasks/{id}/complete` (For human approvals)

---

## Part 5: Infrastructure & Operations

### 26. Storage Abstraction
- Defined by a generic `ExecutionRepository`. The underlying engine (e.g., Temporal, Camunda, Zeebe, PostgreSQL-backed state machine) is completely hidden from the domain logic.

### 27. Security Architecture & 28. Multi-Tenant Strategy
- Multi-tenancy is enforced on workflow templates and executions. Tenant A cannot trigger, view, or approve Tenant B's workflows.

### 29. Performance & 30. Scalability Strategy
- Horizontally scalable stateless worker nodes. The state management database is the only scaling constraint, mitigated via sharding by `tenant_id`.

### 31. Disaster Recovery & 32. Monitoring & 33. Observability
- 100% durable state means node crashes lose zero data. The workflow resumes from the last persisted task upon restart.
- OpenTelemetry metrics: `workflow.execution.duration`, `task.retry.count`, `workflow.failure.rate`.

### 34. Audit Strategy & 35. Data Lifecycle
- Every state transition is appended to an immutable Event Sourcing log. Completed execution logs are archived to cold storage after 90 days.

---

## Part 6: Governance

### 36. Engineering Decisions & 37. ADRs
- **EDR-WF-01:** Engine-Agnostic Orchestration. No tight coupling to any third-party workflow engine SDK in domain logic.
- **EDR-WF-02:** Strict Idempotency Requirement for all automated tasks to safely support infinite retries.

### 38. Risks & 39. Future Expansion
- **Risk:** "God Service" anti-pattern. Mitigated by Rule #20 (Workflow coordinates, domains decide).
- **Expansion:** AI Agent Workflows, where autonomous agents dictate the next DAG step dynamically rather than following a static template.

### 40. Workflow DSL Strategy & 41. Plugin & Extension Model
- Workflows are defined using an internal declarative JSON/YAML Domain Specific Language (DSL).
- Plugins allow the community or vendors to build custom Task Nodes (e.g., "CrowdStrike Isolate Node").

### 42. Architecture Validation Checklist
- [x] Clean Architecture
- [x] DDD Boundaries
- [x] Event-Driven Ready
- [x] Human-in-the-Loop
- [x] Replayable & Recoverable
- [x] Vendor Independent

### 43. Glossary & 44. References
- **DAG:** Directed Acyclic Graph (the workflow structure).
- **Idempotency:** An operation that produces the same result no matter how many times it is executed.
