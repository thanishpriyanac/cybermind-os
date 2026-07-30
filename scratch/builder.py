import os

# --- LAYER 1: STRUCTURED METADATA ---
volumes_metadata = [
    {
        "id": 15, "domain": "Attack Surface Management (ASM)",
        "mission": "Continuously discover, classify, monitor, and assess externally exposed enterprise assets.",
        "owns": ["Internet-facing assets", "Domains", "Subdomains", "Public IPs", "Certificates", "DNS records", "Internet services", "Cloud exposures", "Shadow IT", "Third-party exposures"],
        "never_owns": ["Vulnerabilities (VM)", "Authoritative Assets (Asset Platform)", "Telemetry (SIEM)", "Incidents (SOC)", "Forensics (DFIR)"],
        "consumes": ["Asset Platform", "CTI", "Knowledge Graph", "Search", "Workflow", "Identity"],
        "publishes": ["AssetDiscovered", "ExposureDetected", "InternetServiceChanged", "DomainExpired", "CertificateExpiring"],
        "lifecycle": "Discovery -> Classification -> Validation -> Enrichment -> Exposure Analysis -> Risk -> Notification",
        "principle": "Attack surface is a continuously changing security boundary. Every exposed asset must remain attributable, monitored, classified, and traceable throughout its lifecycle."
    },
    {
        "id": 16, "domain": "Exposure Management",
        "mission": "Calculate enterprise-wide cyber exposure using vulnerabilities, attack paths, business context, and threat intelligence.",
        "owns": ["Exposure score", "Risk aggregation", "Attack path analysis", "Security posture"],
        "never_owns": ["Vulnerabilities", "Assets", "Threat Intelligence", "Detection"],
        "consumes": ["VM", "ASM", "Asset Platform", "CTI", "Knowledge Graph", "SOC"],
        "publishes": ["ExposureScoreUpdated", "RiskPrioritized"],
        "lifecycle": "Collect -> Correlate -> Score -> Prioritise -> Recommend -> Recalculate",
        "principle": "Exposure is a governed enterprise risk metric derived from authoritative domains rather than independently discovered data."
    },
    {
        "id": 17, "domain": "GRC",
        "mission": "Govern policies, controls, risks, compliance, and audits.",
        "owns": ["Policies", "Controls", "Risks", "Framework mappings", "Audit evidence", "Compliance posture"],
        "never_owns": ["Vulnerabilities", "Incidents", "Assets", "Detection"],
        "consumes": ["Exposure Management", "Identity", "Asset Platform"],
        "publishes": ["PolicyUpdated", "ControlFailed", "AuditInitiated"],
        "lifecycle": "Define Policy -> Map Controls -> Assess Risk -> Audit -> Report",
        "principle": "Governance establishes policy but never overrides operational truth produced by authoritative domains."
    },
    {
        "id": 18, "domain": "Identity Security (PAM)",
        "mission": "Govern privileged identities and secure administrative access.",
        "owns": ["Privileged accounts", "Vault", "Secrets", "Session recording", "JIT access", "Approval workflows"],
        "never_owns": ["Core Identity", "Authentication", "Users"],
        "consumes": ["Identity Platform", "Workflow"],
        "publishes": ["PrivilegeGranted", "PrivilegeRevoked", "SessionRecorded"],
        "lifecycle": "Request -> Approve -> Grant JIT -> Record Session -> Revoke",
        "principle": "Privileged access is temporary, attributable, and continuously verified."
    },
    {
        "id": 19, "domain": "Cloud Security",
        "mission": "Protect cloud infrastructure and workloads.",
        "owns": ["CSPM", "CWPP", "CIEM", "Kubernetes security", "Cloud posture"],
        "never_owns": ["Assets", "Identity", "Workflow"],
        "consumes": ["Asset Platform", "Identity Platform"],
        "publishes": ["CloudMisconfigurationDetected", "WorkloadThreatDetected"],
        "lifecycle": "Scan Cloud -> Identify Drift -> Assess Risk -> Remediate",
        "principle": "Cloud posture shall be continuously evaluated using authoritative cloud state."
    },
    {
        "id": 20, "domain": "Data Security",
        "mission": "Protect enterprise data throughout its lifecycle.",
        "owns": ["Classification", "Sensitive data discovery", "DLP", "DSPM", "Encryption policies"],
        "never_owns": ["Storage", "Identity", "Search"],
        "consumes": ["Identity Platform", "Knowledge Graph"],
        "publishes": ["DataClassified", "DLPViolation", "SensitiveDataDiscovered"],
        "lifecycle": "Discover -> Classify -> Protect -> Monitor",
        "principle": "Data protection policies follow the data independently of the storage medium."
    },
    {
        "id": 21, "domain": "UEBA",
        "mission": "Detect behavioural anomalies.",
        "owns": ["Behaviour baselines", "Behaviour profiles", "Insider risk", "Entity risk"],
        "never_owns": ["Alerts", "Telemetry", "Incidents"],
        "consumes": ["Identity", "Asset Platform"],
        "publishes": ["BehaviourAnomalyDetected", "EntityRiskScoreUpdated"],
        "lifecycle": "Baseline -> Monitor -> Detect Deviation -> Score Risk",
        "principle": "Behavioural anomalies indicate risk variation, not definitive detection."
    },
    {
        "id": 22, "domain": "Malware Analysis",
        "mission": "Analyse malicious software.",
        "owns": ["Static analysis", "Dynamic analysis", "Sandbox", "Malware reports", "YARA validation"],
        "never_owns": ["Evidence Storage", "Incidents"],
        "consumes": ["DFIR", "CTI"],
        "publishes": ["MalwareReportPublished", "YARASignatureGenerated"],
        "lifecycle": "Ingest Sample -> Static Analysis -> Sandbox Detonation -> Report",
        "principle": "Malware analysis occurs in strict isolation without polluting operational environments."
    },
    {
        "id": 23, "domain": "Threat Intelligence Marketplace",
        "mission": "Exchange structured intelligence.",
        "owns": ["Feed subscriptions", "STIX/TAXII", "Intelligence sharing", "Feed governance"],
        "never_owns": ["Detection Rules", "Incident Management"],
        "consumes": ["CTI"],
        "publishes": ["FeedSubscribed", "IntelligenceExported"],
        "lifecycle": "Subscribe -> Ingest -> Translate -> Distribute",
        "principle": "Intelligence exchange strictly adheres to structured data contracts and sharing protocols."
    },
    {
        "id": 24, "domain": "Security Knowledge Base",
        "mission": "Preserve reusable operational knowledge.",
        "owns": ["Runbooks", "Playbooks", "Procedures", "Lessons learned"],
        "never_owns": ["Execution State", "Live Incidents"],
        "consumes": ["SOC", "Threat Hunting", "DFIR"],
        "publishes": ["KnowledgeArticlePublished", "PlaybookUpdated"],
        "lifecycle": "Draft -> Review -> Publish -> Maintain",
        "principle": "Operational knowledge is a continuously maintained, versioned asset."
    },
    {
        "id": 25, "domain": "Integration Platform",
        "mission": "Connect CYBERMIND with external ecosystems.",
        "owns": ["Connectors", "SDK", "Webhooks", "REST", "Kafka", "gRPC", "STIX/TAXII"],
        "never_owns": ["Business Logic", "Data Storage"],
        "consumes": ["All Domains"],
        "publishes": ["IntegrationError", "WebhookReceived"],
        "lifecycle": "Receive Request -> Route -> Transform -> Deliver",
        "principle": "Integration relies strictly on decoupled event passing and API contracts."
    },
    {
        "id": 26, "domain": "Notification Platform",
        "mission": "Reliably deliver multi-channel alerts and escalations.",
        "owns": ["Email", "SMS", "Push", "Teams", "Slack", "WhatsApp", "Escalations"],
        "never_owns": ["Alert generation", "Incident state"],
        "consumes": ["Workflow", "SOC", "SIEM"],
        "publishes": ["NotificationSent", "NotificationFailed"],
        "lifecycle": "Receive Message -> Format -> Dispatch -> Acknowledge",
        "principle": "Notifications are stateless delivery mechanisms, not systems of record."
    },
    {
        "id": 27, "domain": "Asset Platform",
        "mission": "Become the authoritative CMDB.",
        "owns": ["Assets", "Owners", "Relationships", "Lifecycle"],
        "never_owns": ["Vulnerabilities", "Telemetry", "Incidents"],
        "consumes": ["ASM", "Identity"],
        "publishes": ["AssetRegistered", "AssetUpdated", "AssetDecommissioned"],
        "lifecycle": "Discover -> Reconcile -> Assign Owner -> Monitor -> Decommission",
        "principle": "The Asset Platform is the single source of truth for entity existence and ownership."
    },
    {
        "id": 28, "domain": "Configuration Platform",
        "mission": "Manage global, tenant, and dynamic platform configurations.",
        "owns": ["Feature flags", "Dynamic configuration", "Tenant settings", "Secrets references"],
        "never_owns": ["Raw Secrets", "Operational Data"],
        "consumes": ["Identity"],
        "publishes": ["ConfigUpdated", "FeatureFlagToggled"],
        "lifecycle": "Propose Change -> Approve -> Deploy -> Validate",
        "principle": "Configuration changes are governed deployments, never manual ad-hoc updates."
    },
    {
        "id": 29, "domain": "Observability",
        "mission": "Monitor the health and performance of the CYBERMIND Platform.",
        "owns": ["Metrics", "Logs", "Traces", "Health", "Platform monitoring"],
        "never_owns": ["Security Telemetry", "Threat Detections"],
        "consumes": ["All Domains"],
        "publishes": ["HealthDegraded", "ServiceRecovered"],
        "lifecycle": "Collect Telemetry -> Aggregate -> Alert on Health -> Archive",
        "principle": "Platform observability is distinct and separate from security telemetry."
    },
    {
        "id": 30, "domain": "Reporting",
        "mission": "Provide executive, operational, and compliance reporting.",
        "owns": ["Executive dashboards", "KPIs", "Scheduled reports", "Compliance reporting"],
        "never_owns": ["Raw Operational Data", "Incident Management"],
        "consumes": ["All Domains"],
        "publishes": ["ReportGenerated"],
        "lifecycle": "Query Data -> Format -> Schedule -> Distribute",
        "principle": "Reports are read-only reflections of authoritative domain data."
    }
]

# AI Ecosystem (31-38)
ai_domains = [
    "AI Agent Platform", "SOC Agent", "Threat Hunter Agent", "DFIR Agent", 
    "Malware Agent", "Compliance Agent", "Executive Advisor", "AI Governance"
]
for i, name in enumerate(ai_domains, 31):
    volumes_metadata.append({
        "id": i, "domain": name,
        "mission": f"Provide autonomous and semi-autonomous capabilities for {name}.",
        "owns": ["Agent Prompts", "Agent Memory", "Tool Execution Logic"],
        "never_owns": ["Authoritative Domain Data", "Governance Overrides"],
        "consumes": ["AI Platform", "Knowledge Graph", "Search"],
        "publishes": ["AgentTaskCompleted", "AgentTaskFailed"],
        "lifecycle": "Receive Prompt -> Plan -> Execute Tools -> Summarize",
        "principle": "AI assists human decision-making but never replaces authoritative domain ownership or governance."
    })

# Enterprise Expansion (39-49)
exp_domains = [
    "Purple Team Platform", "Breach & Attack Simulation", "Deception Platform", 
    "API Security", "OT / ICS Security", "IoT Security", "Mobile Security", 
    "Supply Chain Security", "PKI & Certificates Platform", "Secrets Management", "Platform Administration"
]
for i, name in enumerate(exp_domains, 39):
    volumes_metadata.append({
        "id": i, "domain": name,
        "mission": f"Manage and secure the {name} lifecycle across the enterprise.",
        "owns": [f"{name} Policies", f"{name} Objects", f"{name} Metrics"],
        "never_owns": ["SIEM Telemetry", "SOC Incidents", "Core Identity"],
        "consumes": ["Asset Platform", "Identity Platform", "Workflow"],
        "publishes": [f"{name.replace(' ', '')}EventGenerated"],
        "lifecycle": "Initialize -> Monitor -> Detect -> Govern",
        "principle": f"{name} operates as a specialised bounded context leveraging core platform services."
    })

# Volume 50
volumes_metadata.append({
    "id": 50, "domain": "Enterprise Reference Architecture",
    "mission": "Provide the capstone reference tying all CYBERMIND domains together.",
    "owns": ["Context Map", "Domain Matrix", "Event Catalogue", "API Catalogue", "Deployment Architecture", "Version 2 Roadmap"],
    "never_owns": ["Live Code", "Operational State"],
    "consumes": ["All Domains"],
    "publishes": ["ArchitectureBaselinePublished"],
    "lifecycle": "Draft -> Review -> Publish -> Iterate",
    "principle": "The reference architecture is the immutable blueprint for all platform engineering."
})


# --- LAYER 2: GENERATOR SCRIPT ---
TEMPLATE = """# Engineering Directive ED-{id:04d}
**Project:** CYBERMIND Platform
**Volume:** {id}
**Domain:** {domain}
**Status:** Architecture Design
**Architecture Freeze:** v1.1

## 1. Mission
{mission}

## 2. Vision
Establish a highly resilient, enterprise-grade bounded context for {domain} that adheres to Zero Trust principles.

## 3. Purpose
To cleanly decouple {domain} capabilities from adjacent platforms and prevent monolithic anti-patterns.

## 4. Scope
Encompasses the complete lifecycle and orchestration of {domain} objects without duplicating core services.

## 5. Responsibilities
Manage domain logic, state transitions, and API contracts for {domain}.

## 6. Owns
{owns}

## 7. Never Owns
{never_owns}

## 8. Domain Model
- `{domain_slug}Aggregate`
- `{domain_slug}Policy`
- `{domain_slug}Record`

## 9. Aggregates
Data mutations within {domain} are strictly transacted across aggregate roots to ensure consistency.

## 10. Value Objects
Immutably models properties (e.g., timestamps, IDs, status codes) used by the domain.

## 11. Domain Events Published
{publishes}

## 12. Domain Events Consumed
{consumes_events}

## 13. Commands
- `Create{domain_slug}`
- `Update{domain_slug}`
- `Delete{domain_slug}`

## 14. Queries
- `Get{domain_slug}ById`
- `List{domain_slug}s`

## 15. Lifecycle
{lifecycle}

## 16. AI Integration
AI models assist with {domain} insights via prompt-based recommendations, retaining human-in-the-loop authority.

## 17. Knowledge Graph Integration
{domain} maps relationships into the global ontology to maintain blast-radius and semantic correlation.

## 18. Search Integration
{domain} indexes read-optimized metadata into the Search service for global platform discovery.

## 19. Workflow Integration
Workflow Platform is responsible for orchestration. This domain must never execute long-running workflows directly.

## 20. Identity Integration
Strict RBAC and ABAC policies govern all API and command execution via the Identity Platform.

## 21. Event Bus Integration
Asynchronous message passing via Kafka ensures decoupled state synchronization.

## 22. Storage Strategy
Domain state is persisted in isolated datastores; read models are eventually consistent.

## 23. Public APIs
- Query API
- Command API
- Administration API
- Metrics API
- Search API
- Export API

## 24. Metrics
- Availability
- Latency
- Error Rate
- Throughput
- Queue Depth
- Processing Time
- Success Rate
- Failure Rate

## 25. Observability
- Trace IDs
- Correlation IDs
- Span Context
- Audit IDs

## 26. Security Model
- Zero Trust
- RBAC
- ABAC
- Multi-Tenant
- Least Privilege

## 27. Governance
Data retention, schema changes, and deployments are strictly governed by CI/CD pipelines and ADRs.

## 28. Quality Gates
- Clean Architecture
- DDD
- Event Driven
- Vendor Independent
- AI Ready
- Cloud Native
- Observable
- Recoverable

## 29. Constitutional Principle
> {principle}

## 30. Future Extensions
Integration into broader CYBERMIND ecosystem workflows as defined in Version 2 Roadmap.
"""

def generate():
    out_dir = "/home/thanish/.gemini/antigravity/scratch/cybermind-ai/docs/GOVERNANCE/DIRECTIVES"
    os.makedirs(out_dir, exist_ok=True)
    
    master_content = "# CYBERMIND Engineering Directives Master Pack\n\n"
    
    ownership_matrix = "# Domain Ownership Matrix\n| Domain | Owns | Never Owns |\n|---|---|---|\n"
    event_catalog = "# Event Catalogue\n| Domain | Publishes | Consumes |\n|---|---|---|\n"
    api_catalog = "# API Catalogue\n\nStandardized across all domains:\n- Query API\n- Command API\n- Administration API\n- Metrics API\n- Search API\n- Export API\n"
    
    for v in volumes_metadata:
        domain_slug = v['domain'].replace(" ", "").replace("&", "").replace("/", "")
        
        owns_str = "\n".join([f"- {x}" for x in v['owns']])
        never_owns_str = "\n".join([f"- {x}" for x in v['never_owns']])
        publishes_str = "\n".join([f"- {x}" for x in v['publishes']])
        consumes_events_str = "\n".join([f"- {x}Event" for x in v['consumes']])
        
        md_content = TEMPLATE.format(
            id=v['id'],
            domain=v['domain'],
            domain_slug=domain_slug,
            mission=v['mission'],
            owns=owns_str,
            never_owns=never_owns_str,
            consumes_events=consumes_events_str,
            publishes=publishes_str,
            lifecycle=v['lifecycle'],
            principle=v['principle']
        )
        
        # Write individual file
        with open(os.path.join(out_dir, f"ED-{v['id']:04d}.md"), 'w') as f:
            f.write(md_content)
            
        master_content += f"## ED-{v['id']:04d}: {v['domain']}\n*See `DIRECTIVES/ED-{v['id']:04d}.md`*\n\n"
        
        # Matrices
        owns_inline = ", ".join(v['owns'])
        never_owns_inline = ", ".join(v['never_owns'])
        publishes_inline = ", ".join(v['publishes'])
        consumes_inline = ", ".join([f"{x}Event" for x in v['consumes']])
        
        ownership_matrix += f"| {v['domain']} | {owns_inline} | {never_owns_inline} |\n"
        event_catalog += f"| {v['domain']} | {publishes_inline} | {consumes_inline} |\n"
        
    with open("/home/thanish/.gemini/antigravity/scratch/cybermind-ai/docs/GOVERNANCE/MASTER_ENGINEERING_DIRECTIVES.md", 'w') as f:
        f.write(master_content)
        
    with open("/home/thanish/.gemini/antigravity/scratch/cybermind-ai/docs/GOVERNANCE/Domain_Ownership_Matrix.md", 'w') as f:
        f.write(ownership_matrix)
        
    with open("/home/thanish/.gemini/antigravity/scratch/cybermind-ai/docs/GOVERNANCE/Event_Catalogue.md", 'w') as f:
        f.write(event_catalog)
        
    with open("/home/thanish/.gemini/antigravity/scratch/cybermind-ai/docs/GOVERNANCE/API_Catalogue.md", 'w') as f:
        f.write(api_catalog)

if __name__ == "__main__":
    generate()
    print("Directives generation complete.")
