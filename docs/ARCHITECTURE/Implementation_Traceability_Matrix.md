# Implementation Traceability Matrix

This matrix maps every architectural volume to its implementation artifacts, tracking development progress across milestones.

| Architecture Volume | Services | Database | APIs | Core Events | Sprint | Status |
|---|---|---|---|---|---|---|
| **01 - Core Foundations** | `gateway`, `notification` | `platform_db` | REST, gRPC | `NotificationSent` | M1 | Planned |
| **02 - Platform Constitution** | N/A (Governance) | N/A | N/A | N/A | N/A | Enforced |
| **03 - AI Platform** | `ai-service` | `vector_db` | gRPC | `ModelInferenceRequested` | M5 | Planned |
| **04 - Identity Platform** | `identity-service` | `identity_db` | REST, gRPC | `UserCreated`, `JWTIssued` | M1 | Planned |
| **05 - Knowledge Graph** | `knowledge-service` | `graph_db` | gRPC | `GraphUpdated` | M5 | Planned |
| **06 - CTI** | `cti-service` | `cti_db` | REST, gRPC | `ThreatPublished` | M2 | Planned |
| **07 - Search Platform** | `search-service` | OpenSearch | REST, gRPC | `IndexUpdated` | M1 | Planned |
| **08 - Workflow Platform** | `workflow-service` | `workflow_db` | gRPC | `WorkflowStarted` | M1 | Planned |
| **09 - SOC** | `soc-service` | `soc_db` | REST | `CaseCreated` | M4 | Planned |
| **10 - SIEM** | `siem-service` | OpenSearch | gRPC | `AlertGenerated` | M3 | Planned |
| **11 - SOAR** | `soar-service` | `soar_db` | REST, gRPC | `PlaybookExecuted` | M6 | Planned |
| **12 - DFIR** | `dfir-service` | `vault_db`, S3 | REST, gRPC | `EvidenceAcquired` | M7 | Planned |
| **13 - Threat Hunting** | `hunting-service` | `hunt_db` | REST | `HuntCampaignStarted` | M6 | Planned |
| **14 - Vulnerability Mgmt** | `vm-service` | `vm_db` | REST | `FindingCreated` | M8 | Planned |
| **15 - Attack Surface Mgmt** | `asm-service` | `asm_db` | REST | `AssetDiscovered` | M8 | Planned |
| **16 - Exposure Mgmt** | `exposure-service` | `exposure_db` | REST | `ExposureScoreUpdated`| M8 | Planned |
| **17 - GRC** | `grc-service` | `grc_db` | REST | `PolicyUpdated` | M8 | Planned |
| **27 - Asset Platform** | `asset-service` | `asset_db` | REST, gRPC | `AssetRegistered` | M1 | Planned |
