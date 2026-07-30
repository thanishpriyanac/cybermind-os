# CYBERMIND AI — STRIDE Threat Model

> **Scope:** AI Gateway, File Sandbox, Authentication, Secrets Storage, Data Ingestion, API Subsystems  

---

## 1. Threat Matrix & Mitigations

| STRIDE Threat | Risk Level | Target Component | Threat Scenario | Mitigation Strategy |
|---|---|---|---|---|
| **Spoofing** | High | Auth API | Attacker attempts credential stuffing or session hijack to access admin capabilities | Mandatory TOTP MFA on all logins; JWT rotated on use; HTTP-only secure cookies |
| **Tampering** | Critical | Sandbox Worker | Uploaded malicious PCAP/EVTX contains exploit payload attempting host takeover | Sandbox runs inside single-use Docker container (`--network none`, `--read-only` rootfs, non-root user); destroyed after execution |
| **Repudiation** | Medium | Admin Operations | Administrator or system action modifies key/data without record | Immutable `AuditLog` table capturing actor, action, timestamp, and IP; retained 365 days |
| **Information Disclosure** | Critical | API Keys & Storage | Attacker accesses database or logs to steal OpenAI/Anthropic API keys or user query secrets | API keys encrypted with AES-256-GCM before DB insert; decryption key in host `.env` (600 permissions); PII redacted before LLM call |
| **Denial of Service** | High | AI Gateway & SSE | Attacker or user triggers 6-model fan-out repeatedly to exhaust API budget or backend connections | Rate limiting per IP/token; spend caps auto-disable Full Fan-Out; BullMQ concurrency queues; 10s connection timeout |
| **Elevation of Privilege** | High | Multi-Tenant Data | Attacker injects query to read another organization's conversation data | Strict tenant isolation via default `tenantId` filtering in Prisma repository layer; parameterized queries only |

---

## 2. Security Controls Verification Matrix

- [x] **Zero Public Port Exposure:** All traffic routed exclusively through Cloudflare Tunnel.
- [x] **Database Security:** Parameterized queries only (Prisma ORM default); database user permissions restricted to application schema.
- [x] **Malware Defense:** Zero auto-extraction of ZIP files; zero execution of binary content outside isolated sandbox container.
