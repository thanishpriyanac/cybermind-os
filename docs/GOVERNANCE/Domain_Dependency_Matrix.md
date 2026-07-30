# Domain Dependency Matrix

This matrix explicitly defines the upstream prerequisites and downstream consumers for the operational domains, ensuring that boundaries and implementation sequences are strictly governed.

| Domain | Consumes (Dependencies) | Consumers (Downstream) |
|---|---|---|
| **Identity Platform** | *None (Root)* | All Domains |
| **Knowledge Graph** | All Domains | All Domains |
| **CTI** | External Feeds | SIEM, SOC, SOAR, Threat Hunting, VM, ASM, Exposure Mgmt |
| **Search Platform** | All Domains | Threat Hunting, SOC, DFIR, Knowledge Graph |
| **Workflow Platform** | *None (Root Execution)* | SOAR, SOC, VM, ASM, Identity |
| **Asset Platform** | ASM, Identity | VM, ASM, Exposure Mgmt, SIEM, SOC |
| **SIEM** | Telemetry, CTI, Asset | SOC, Threat Hunting |
| **SOC** | SIEM, CTI, Search | SOAR, DFIR, Knowledge Base |
| **SOAR** | SOC, Workflow, CTI, Identity | DFIR, Notification Platform |
| **DFIR** | SOAR, SOC, SIEM | Malware Analysis, Knowledge Base |
| **Threat Hunting** | Search, CTI, SIEM | SOC, SIEM (Detections) |
| **Attack Surface Mgmt (ASM)** | Asset, CTI | VM, Asset Platform, Exposure Mgmt |
| **Vulnerability Mgmt (VM)** | ASM, Asset, CTI, Workflow | Exposure Mgmt, SIEM, SOC |
| **Exposure Management** | VM, ASM, Asset, CTI, Identity | GRC, Executive Reporting |
| **GRC** | Exposure Mgmt, Asset, Identity | Reporting |
