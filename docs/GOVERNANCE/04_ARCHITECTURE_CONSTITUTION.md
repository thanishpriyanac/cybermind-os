# CYBERMIND ARCHITECTURE CONSTITUTION
**Version:** 1.0 (Frozen)

These rules are immutable unless explicitly revised via an Engineering Decision Record (EDR).

1. **Never introduce technical debt knowingly.**
2. **Never sacrifice security for convenience.**
3. **Never break backward compatibility without:**
   - documenting the reason,
   - providing a migration strategy,
   - obtaining approval.
4. **Never duplicate business logic.**
5. **Never bypass architectural layers.**
6. **Never access the database directly from controllers.**
7. **Never hardcode configuration or secrets.**
8. **Never merge unrelated responsibilities into a single module.**
9. **Never create circular dependencies.**
10. **Never optimise prematurely.**
11. **Never over-engineer Phase 1 features for hypothetical requirements.**
12. **Every architectural decision must be:**
    - justified,
    - documented,
    - reviewable.
13. **Every feature must improve one or more of:**
    - correctness,
    - security,
    - maintainability,
    - scalability,
    - observability,
    - reliability.
14. **When uncertain:**
    - Stop.
    - Explain the uncertainty.
    - Present options.
    - Recommend one.
    - Wait for approval.
15. **The architecture is more important than implementation speed.**
16. **Raw observations are not intelligence.** Intelligence is information that has been validated, enriched, versioned, scored, and is traceable to its provenance.
17. **Intelligence is a governed asset.** Every published intelligence object must remain explainable, versioned, auditable, attributable, and revocable throughout its lifecycle.
18. **Search is a discovery layer, not a data store.** It indexes information for retrieval but never becomes the system of record. Every indexed document must remain traceable to its authoritative owning domain.
19. **Search must always be reproducible.** Every search result must be explainable, security-trimmed, traceable to its authoritative source, and reproducible under the same query context and permissions.
20. **Workflow coordinates execution but never owns business logic.** Every domain remains responsible for its own business decisions; the Workflow Platform orchestrates those decisions through well-defined contracts, events, and approvals.
21. **Every automated action must be deterministic, idempotent, auditable, and recoverable.** When failure occurs, the platform must either safely retry or execute an explicitly defined compensation strategy.
22. **Operational domains coordinate expertise, not infrastructure.** They consume shared platform services rather than reimplementing identity, intelligence, discovery, execution, or observability.
23. **Operational decisions are governed assets.** Every investigation, decision, approval, and evidence reference must remain attributable, explainable, auditable, and traceable throughout its lifecycle.
24. **Telemetry is an immutable operational record.** The SIEM preserves, normalizes, correlates, and detects from telemetry, but investigations, intelligence, and remediation remain the responsibility of their authoritative domains.
25. **Detections are governed assets.** Every alert must be reproducible, explainable, versioned, attributable to its originating telemetry and detection logic, and traceable through the complete detection lifecycle.
26. **Automated responses are governed assets.** Every remediation must be risk-aware, explainable, verifiable, reversible where technically feasible, and fully attributable from initiating detection through final outcome.
27. **Forensic evidence is a governed legal asset.** Every artefact must remain authentic, integrity-protected, attributable, chain-of-custody verified, reproducible, and preserved in accordance with its legal and regulatory obligations.
28. **Threat hunting is a governed discovery process.** Every hunt shall begin with a testable hypothesis, maintain complete evidence lineage, produce reproducible findings, and either improve organisational knowledge or strengthen deterministic detections.
29. **Vulnerability findings are governed exposure assets.** Every finding shall remain attributable to its originating assessment, continuously risk-evaluated using current intelligence and business context, traceable throughout its remediation lifecycle, and closed only after independent verification confirms that the exposure has been effectively mitigated.
30. **External exposure is a governed discovery asset.** Every externally visible asset shall be continuously discovered, attributable through evidence-based ownership, historically traceable, and evaluated in the context of organisational risk without assuming authoritative ownership.
31. **Enterprise exposure is a governed risk model.** Every exposure score shall be reproducible, explainable, continuously recalculated from authoritative domains, historically traceable, and never derived from duplicated or independently maintained security data.
