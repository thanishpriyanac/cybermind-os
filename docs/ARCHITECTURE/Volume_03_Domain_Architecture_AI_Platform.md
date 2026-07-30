# Volume 3 – Domain Architecture: AI Platform
**Document Status:** DRAFT (Pending Approval)
**Version:** 1.0

This volume serves as the authoritative specification governing all AI capabilities within the CYBERMIND Platform. Every future AI-enabled feature must consume the AI Platform through its defined contracts, ensuring consistent security, observability, governance, and provider independence.

---

## 1. Domain Overview

**Purpose:** Provide secure, scalable, and provider-agnostic artificial intelligence capabilities as a shared enterprise utility to all business domains.
**Scope:** Orchestration of LLMs, embedding generation, prompt management, context assembly, semantic search integration, and evaluation metrics.
**Responsibilities:** Provider routing, API key management, token budgeting, prompt injection defense, and interaction persistence.
**Business Goals:** Accelerate analyst workflows across CTI, SOC, SIEM, and SOAR without locking the platform into a single AI vendor.
**Out-of-Scope:** Hardcoded business logic (e.g., the AI Platform does not "know" what a SOC is; it only provides the reasoning engine for the SOC module to use).
**Domain Boundaries:** The AI Platform sits above the shared data layer but below the specific domain modules (CTI, SOC). No domain module may integrate directly with an external LLM provider.

---

## 2. Domain Components

| Component | Responsibilities | Dependencies | Failure Behavior |
| :--- | :--- | :--- | :--- |
| **AI Gateway** | Central entry point for all AI requests. Enforces auth and rate limits. | Identity Service | Rejects requests with 429/401. |
| **Provider Router** | Routes requests to optimal providers based on cost, latency, or capability. | Model Registry | Fails over to secondary provider. |
| **Provider Adapters** | Normalizes external APIs (OpenAI, Anthropic) to the internal contract. | None | Retries with exponential backoff. |
| **Model Registry** | Stores available models, pricing, and context window limits. | DB | Defaults to cached registry list. |
| **Prompt Library** | Stores, versions, and serves prompt templates. | DB | Fails if template not found. |
| **Conversation Engine** | Manages multi-turn dialog state and token truncation. | DB / Redis | Truncates oldest context if full. |
| **Context Builder** | Assembles inputs (Graph, CTI, Alerts) into the context window. | Search, Graph | Graceful degradation if Search fails. |
| **Semantic Memory** | Embeds and stores past interactions for long-term recall. | Embedding Service | Asynchronous; non-blocking. |
| **Embedding Service** | Generates vector representations of text. | Provider Router | Retries; alerts on failure. |
| **Cost Guard** | Hard-stops requests exceeding token/cost budgets per tenant. | Observability | Blocks request with 402 error. |
| **Safety Guardrails** | Scans inputs for prompt injection and PII. | None | Strips PII or blocks request. |
| **Consensus Engine** | (Beta) Runs multiple models and aggregates answers for high-stakes tasks. | Provider Router | Degrades to single-model if timeouts occur. |

---

## 3. AI Request Lifecycle

1. **Request Received:** A domain module (e.g., CTI) sends a payload to the AI Gateway.
2. **AuthN/AuthZ:** The Gateway validates the caller's JWT and RBAC permissions.
3. **Context Construction:** The Context Builder fetches relevant Graph nodes, past conversation history, and alert data.
4. **Prompt Composition:** The Prompt Library retrieves the version-pinned template and injects the context.
5. **Safety Scan:** Guardrails check for injection and mask PII.
6. **Provider Selection:** The Router selects the best model from the Registry based on task tags and token size.
7. **Model Invocation:** The Adapter translates the request and calls the external provider.
8. **Streaming Response:** The Gateway streams the normalized response back to the domain module.
9. **Persistence & Auditing:** Token usage, cost, and raw prompts are logged asynchronously.
10. **Knowledge Enrichment:** (If applicable) Extracted entities are formatted for the Knowledge Graph pipeline.

---

## 4. Provider Abstraction

All external LLMs are abstracted behind a unified interface contract.
- **Contract Interface:** Defines `generateText()`, `streamText()`, `generateEmbeddings()`, and `structuredOutput(Schema)`.
- **Error Handling:** Standardized error mapping (e.g., converting OpenAI's 429 and Anthropic's 429 into a unified `RateLimitException`).
- **Retry Strategy:** Built-in exponential backoff (max 3 retries) applied at the Adapter level.
- **Timeout Policy:** 30s hard timeout for standard generation; 60s for Consensus logic.

---

## 5. Model Registry

- **Ownership:** Maintained by Platform Administrators.
- **Capabilities:** Tags models with supported features (e.g., `vision`, `tools`, `json-mode`).
- **Pricing Metadata:** Stores input/output cost per 1M tokens to drive the Cost Guard.
- **Availability & Health:** Actively pinged. If a provider's error rate exceeds 5% in 1 minute, the circuit breaker opens and the model is marked `DEGRADED`.
- **Deprecation:** Flags models nearing EOL to warn downstream consumers before removing them from the routing pool.

---

## 6. Prompt Architecture

- **Prompt as Code:** Prompts are treated as governed assets, stored in the DB, not hardcoded strings.
- **Versioning:** Semantic versioning (v1.0.0). Breaking changes to variables require a major version bump.
- **Dynamic Variables:** Must use strict templating (e.g., Handlebars/Jinja) to prevent accidental injection.
- **Approval Workflow:** Changing a prompt used in a "High-Risk" workflow (e.g., Playbook Generation) requires explicit approval via the Governance UI.

---

## 7. Context Architecture

The Context Builder operates on a **Token Budget**.
1. **System Prompt (Highest Priority):** Immutable instructions.
2. **Active Investigation Context:** User-uploaded artifacts or specific alerts being triaged.
3. **Knowledge Graph Context:** Relevant nodes retrieved via RAG.
4. **Conversation History (Lowest Priority):** Truncated (FIFO) when the context window nears 80% capacity.

---

## 8. Knowledge Graph Integration

- **Reading:** AI Platform utilizes RAG to query the Graph for entity relationships before generating responses.
- **Writing:** The AI Platform *does not* write directly to the Graph. It returns a `GraphIntent` DTO, which the domain module (e.g., CTI) submits to the Governance queue for provenance tracking and human approval.
- **Explainability:** All Graph nodes injected into the prompt are returned as citation metadata in the final response.

---

## 9. Evaluation Framework

- **Offline Benchmarking:** CI/CD pipeline runs golden-dataset tests against new prompts/models.
- **Production Metrics:**
  - **Accuracy & Grounding:** Sampled via secondary LLM-as-a-Judge evaluations.
  - **Latency & Cost:** Tracked per request.
  - **User Feedback:** Thumbs up/down captured in the Analyst Workbench.

---

## 10. Security Architecture

- **Secrets Handling:** Provider API keys are injected via HashiCorp Vault into memory; never logged.
- **Data Isolation:** Prompts and semantic memory are strictly partitioned by `tenant_id`.
- **PII Handling:** Regex and lightweight NLP models mask PII before the payload leaves the enterprise boundary.
- **Audit Logging:** Every AI request, including the exact prompt payload and provider selected, is stored in immutable audit logs.

---

## 11. Observability

Telemetry is exposed via OpenTelemetry metrics:
- `ai.provider.latency` (Histogram)
- `ai.tokens.total` (Counter, tagged by tenant and model)
- `ai.cost.estimated` (Gauge)
- `ai.errors.rate` (Counter, tagged by provider)
- `ai.queue.depth` (Gauge)

---

## 12. Future Evolution (Maturity Framework)

| Capability | Maturity Status |
| :--- | :--- |
| **Provider Routing & Failover** | Release Candidate |
| **Context Assembly (RAG)** | Release Candidate |
| **Cost Guard & Telemetry** | Beta |
| **Local Model Execution (Ollama)** | Prototype |
| **Tool Calling / Agents** | Planned |
| **Fine-Tuned Domain Models** | Vision |
| **Autonomous Workflows** | Vision |
