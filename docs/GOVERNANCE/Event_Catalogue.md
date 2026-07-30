# Event Catalogue
| Domain | Publishes | Consumes |
|---|---|---|
| Attack Surface Management (ASM) | AssetDiscovered, ExposureDetected, InternetServiceChanged, DomainExpired, CertificateExpiring | Asset PlatformEvent, CTIEvent, Knowledge GraphEvent, SearchEvent, WorkflowEvent, IdentityEvent |
| Exposure Management | ExposureScoreUpdated, RiskPrioritized | VMEvent, ASMEvent, Asset PlatformEvent, CTIEvent, Knowledge GraphEvent, SOCEvent |
| GRC | PolicyUpdated, ControlFailed, AuditInitiated | Exposure ManagementEvent, IdentityEvent, Asset PlatformEvent |
| Identity Security (PAM) | PrivilegeGranted, PrivilegeRevoked, SessionRecorded | Identity PlatformEvent, WorkflowEvent |
| Cloud Security | CloudMisconfigurationDetected, WorkloadThreatDetected | Asset PlatformEvent, Identity PlatformEvent |
| Data Security | DataClassified, DLPViolation, SensitiveDataDiscovered | Identity PlatformEvent, Knowledge GraphEvent |
| UEBA | BehaviourAnomalyDetected, EntityRiskScoreUpdated | IdentityEvent, Asset PlatformEvent |
| Malware Analysis | MalwareReportPublished, YARASignatureGenerated | DFIREvent, CTIEvent |
| Threat Intelligence Marketplace | FeedSubscribed, IntelligenceExported | CTIEvent |
| Security Knowledge Base | KnowledgeArticlePublished, PlaybookUpdated | SOCEvent, Threat HuntingEvent, DFIREvent |
| Integration Platform | IntegrationError, WebhookReceived | All DomainsEvent |
| Notification Platform | NotificationSent, NotificationFailed | WorkflowEvent, SOCEvent, SIEMEvent |
| Asset Platform | AssetRegistered, AssetUpdated, AssetDecommissioned | ASMEvent, IdentityEvent |
| Configuration Platform | ConfigUpdated, FeatureFlagToggled | IdentityEvent |
| Observability | HealthDegraded, ServiceRecovered | All DomainsEvent |
| Reporting | ReportGenerated | All DomainsEvent |
| AI Agent Platform | AgentTaskCompleted, AgentTaskFailed | AI PlatformEvent, Knowledge GraphEvent, SearchEvent |
| SOC Agent | AgentTaskCompleted, AgentTaskFailed | AI PlatformEvent, Knowledge GraphEvent, SearchEvent |
| Threat Hunter Agent | AgentTaskCompleted, AgentTaskFailed | AI PlatformEvent, Knowledge GraphEvent, SearchEvent |
| DFIR Agent | AgentTaskCompleted, AgentTaskFailed | AI PlatformEvent, Knowledge GraphEvent, SearchEvent |
| Malware Agent | AgentTaskCompleted, AgentTaskFailed | AI PlatformEvent, Knowledge GraphEvent, SearchEvent |
| Compliance Agent | AgentTaskCompleted, AgentTaskFailed | AI PlatformEvent, Knowledge GraphEvent, SearchEvent |
| Executive Advisor | AgentTaskCompleted, AgentTaskFailed | AI PlatformEvent, Knowledge GraphEvent, SearchEvent |
| AI Governance | AgentTaskCompleted, AgentTaskFailed | AI PlatformEvent, Knowledge GraphEvent, SearchEvent |
| Purple Team Platform | PurpleTeamPlatformEventGenerated | Asset PlatformEvent, Identity PlatformEvent, WorkflowEvent |
| Breach & Attack Simulation | Breach&AttackSimulationEventGenerated | Asset PlatformEvent, Identity PlatformEvent, WorkflowEvent |
| Deception Platform | DeceptionPlatformEventGenerated | Asset PlatformEvent, Identity PlatformEvent, WorkflowEvent |
| API Security | APISecurityEventGenerated | Asset PlatformEvent, Identity PlatformEvent, WorkflowEvent |
| OT / ICS Security | OT/ICSSecurityEventGenerated | Asset PlatformEvent, Identity PlatformEvent, WorkflowEvent |
| IoT Security | IoTSecurityEventGenerated | Asset PlatformEvent, Identity PlatformEvent, WorkflowEvent |
| Mobile Security | MobileSecurityEventGenerated | Asset PlatformEvent, Identity PlatformEvent, WorkflowEvent |
| Supply Chain Security | SupplyChainSecurityEventGenerated | Asset PlatformEvent, Identity PlatformEvent, WorkflowEvent |
| PKI & Certificates Platform | PKI&CertificatesPlatformEventGenerated | Asset PlatformEvent, Identity PlatformEvent, WorkflowEvent |
| Secrets Management | SecretsManagementEventGenerated | Asset PlatformEvent, Identity PlatformEvent, WorkflowEvent |
| Platform Administration | PlatformAdministrationEventGenerated | Asset PlatformEvent, Identity PlatformEvent, WorkflowEvent |
| Enterprise Reference Architecture | ArchitectureBaselinePublished | All DomainsEvent |
