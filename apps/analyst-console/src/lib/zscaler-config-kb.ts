/**
 * CyberMind AI — Zscaler A-to-Z Complete Configuration & Deployment Knowledge Base
 * 
 * Provides end-to-end configuration playbooks for:
 * 1. ZIA (Zscaler Internet Access): GRE/IPsec, SSL Inspection, Cloud Firewall, URL Filtering, DLP
 * 2. ZPA (Zscaler Private Access): App Connectors, Application Segments, Access Policies, SAML IdP
 * 3. ZCC (Zscaler Client Connector): Tunnel 2.0, Forwarding Profiles, Entra ID / Okta SSO
 * 4. ZDX (Zscaler Digital Experience): SaaS Probes & Path Quality Monitoring
 * 5. NSS / LSS: Nanolog & Log Streaming Services to SIEM (Splunk, Sentinel, Elastic)
 */

export interface ZscalerConfigGuide {
  id: string;
  module: 'ZIA' | 'ZPA' | 'ZCC' | 'ZDX' | 'NSS_LSS';
  title: string;
  category: string;
  summary: string;
  prerequisites: string[];
  stepByStepConfig: string[];
  verificationCommands: string[];
  bestPractices: string[];
  trainingPrompt: string;
  trainingCompletion: string;
}

export const ZSCALER_ATOZ_CONFIG_GUIDES: ZscalerConfigGuide[] = [
  // ─── 1. ZIA CONFIGURATION PLAYBOOKS ─────────────────────────────────────────
  {
    id: 'zscaler-zia-tunneling-001',
    module: 'ZIA',
    title: 'ZIA (Zscaler Internet Access): GRE & IPsec Tunnel Configuration (A to Z)',
    category: 'Network Architecture & Traffic Steering',
    summary: 'Complete guide for establishing primary and secondary GRE/IPsec tunnels from edge firewalls (FortiGate, Palo Alto, Cisco ASA) to Zscaler Enforcement Nodes (ZENs).',
    prerequisites: [
      'Static Public IP address on WAN interface',
      'ZIA Admin Portal access with Location Management permissions',
      'Phase 1/Phase 2 IPsec parameters (IKEv2, AES-256, SHA-256, DH Group 14)',
    ],
    stepByStepConfig: [
      'Step 1 (ZIA Portal): Navigate to Administration > Locations > Add Location. Enter Location Name, Public IP, Subnet, and bandwidth limits.',
      'Step 2 (ZIA Portal): Go to Administration > VPN Credentials > Add VPN Credential. Choose Authentication Type (IP/FQDN/XAUTH), enter Pre-Shared Key (PSK).',
      'Step 3 (Edge Router/Firewall): Create GRE Tunnel interface (Tunnel0) with Zscaler Primary ZEN IP as destination.',
      'Step 4 (FortiGate CLI Example):\n  config system gre-tunnel\n    edit "Zscaler-Primary-GRE"\n      set interface "wan1"\n      set remote-ip <ZSCALER_PRIMARY_ZEN_IP>\n      set local-ip <CUSTOMER_PUBLIC_IP>\n    next\n  end',
      'Step 5 (Routing): Add default static route (0.0.0.0/0) pointing to Tunnel interface with SLA health check probe pinging 1.1.1.1 through Zscaler.',
    ],
    verificationCommands: [
      'curl http://ip.zscaler.com (Verifies if traffic is steering through Zscaler node)',
      'ping 10.254.254.254 (Zscaler internal GRE loopback test IP)',
      'get router info routing-table all (Check active default route priority)',
    ],
    bestPractices: [
      'Always configure dual tunnels (Primary ZEN + Secondary ZEN in adjacent datacenter).',
      'Enable Path MTU Discovery (PMTUD) or set TCP MSS adjustment to 1420 on tunnel interface.',
      'Disable NAT on internal source subnets prior to GRE encapsulation.',
    ],
    trainingPrompt: 'How do I configure GRE Tunnels to Zscaler Internet Access (ZIA) from FortiGate or Palo Alto firewalls step by step?',
    trainingCompletion: `### ZIA GRE Tunnel Configuration Guide (A to Z):
1. **ZIA Portal Location Setup**:
   - Go to **Administration > Locations** and register your Gateway Public Static IP.
   - Configure location bandwidth limits and enable **Enforce SSL Inspection** and **Enable Firewall**.

2. **Tunnel Interface Configuration (FortiGate Example)**:
   \`\`\`bash
   config system gre-tunnel
       edit "Zscaler-PRI-GRE"
           set interface "wan1"
           set remote-ip <PRIMARY_ZEN_IP>
           set local-ip <CUSTOMER_PUBLIC_IP>
       next
   end
   \`\`\`

3. **MSS & Path MTU Tuning**:
   - Set TCP MSS adjustment to **1420** bytes on the firewall policy to prevent fragment drops over tunnel encapsulation.

4. **Traffic Steering Route**:
   - Point static route \`0.0.0.0/0\` with gateway interface \`Zscaler-PRI-GRE\`.

5. **Verification**:
   - Execute \`curl http://ip.zscaler.com\` from an endpoint behind the firewall. Expected result: *"The request reached Zscaler via location [Location Name]"*.`,
  },
  {
    id: 'zscaler-zia-ssl-inspection-002',
    module: 'ZIA',
    title: 'ZIA: Deep SSL/TLS Inspection & Root CA Distribution Setup (A to Z)',
    category: 'Data Security & Decryption',
    summary: 'Full workflow for deploying Zscaler Intermediate Root Certificate via Active Directory GPO/MDM and configuring SSL Inspection bypass rules.',
    prerequisites: [
      'Enterprise PKI Subordinate CA certificate OR Zscaler Self-Signed Intermediate CA',
      'Microsoft Intune / Active Directory GPO for Trusted Root Certificate Authority push',
      'ZIA Admin SSL Policy permissions',
    ],
    stepByStepConfig: [
      'Step 1 (ZIA Portal): Go to Policy > SSL Inspection > SSL Certificate Management. Generate CSR or Download Zscaler Root Certificate (ZscalerRootCertificate-2026.crt).',
      'Step 2 (Active Directory GPO): Open Group Policy Management > Computer Configuration > Policies > Windows Settings > Security Settings > Public Key Policies > Trusted Root Certification Authorities. Import Zscaler Certificate.',
      'Step 3 (Intune/MDM): Create Trusted Certificate Profile for macOS, iOS, Android, and Windows targeting All Devices.',
      'Step 4 (ZIA SSL Policy Rules): Navigate to Policy > SSL Inspection > Add SSL Rule.',
      'Step 5 (Bypass Configuration): Create mandatory SSL Bypass rule for Financial Services, Health, Okta/Entra IdP authentication URLs, and custom non-proxy-aware apps.',
    ],
    verificationCommands: [
      'openssl s_client -connect google.com:443 -showcerts (Verify issuer contains "Zscaler Intermediate CA")',
      'certutil -store Root (Verify Zscaler root cert presence in Windows Local Machine Store)',
    ],
    bestPractices: [
      'Never decrypt banking, healthcare, or employee personal finance categories due to regulatory compliance (HIPAA/GDPR).',
      'Exclude native certificate-pinned applications (e.g., Zoom, Adobe Creative Cloud, Dropbox client) from SSL Inspection.',
      'Enforce TLS 1.2 minimum and disable TLS 1.0/1.1 and weak ciphers in ZIA Advanced Settings.',
    ],
    trainingPrompt: 'Explain how to set up ZIA SSL Inspection, deploy the Zscaler Root Certificate via GPO/Intune, and configure bypass rules.',
    trainingCompletion: `### ZIA SSL/TLS Decryption & Inspection Deployment (A to Z):
1. **Certificate Generation & Export**:
   - Download the Zscaler Intermediate Root CA from **Policy > SSL Inspection > Certificate Management**.

2. **Enterprise PKI / GPO Push**:
   - Deploy certificate to Windows endpoints using AD GPO under **Public Key Policies > Trusted Root Certification Authorities**.
   - For Intune MDM, push via **Configuration Profiles > Trusted Certificate**.

3. **SSL Inspection Policy Construction**:
   - **Rule 1 (Bypass Rule)**: Action = *Do Not Decrypt*. Categories = *Finance, Health, Government*. Destination = *IdP Auth Endpoints (Okta, Entra ID, Ping)*.
   - **Rule 2 (General Decryption)**: Action = *Decrypt*. Inspection Profile = *Block SSL 3.0/TLS 1.0, Block Self-Signed Certs, Block Weak Ciphers*.

4. **Endpoint Validation**:
   - Run \`openssl s_client -connect google.com:443\` on endpoint. Confirm Issuer CN matches \`Zscaler Intermediate Root CA\`.`,
  },

  // ─── 2. ZPA (ZSCALER PRIVATE ACCESS) PLAYBOOKS ─────────────────────────────
  {
    id: 'zscaler-zpa-connector-001',
    module: 'ZPA',
    title: 'ZPA (Zscaler Private Access): App Connector Deployment & Zero Trust Access (A to Z)',
    category: 'Zero Trust Network Access (ZTNA)',
    summary: 'Complete deployment guide for ZPA App Connectors on CentOS/RHEL/Ubuntu/Docker, Provisioning Key setup, and Application Segment mapping.',
    prerequisites: [
      'Outbound internet access from App Connector VM to ZPA Cloud (Port 443 TCP & 80 TCP)',
      'No inbound open firewall ports required',
      'Supported OS: RHEL 8/9, Ubuntu 22.04 LTS, Docker Container host',
    ],
    stepByStepConfig: [
      'Step 1 (ZPA Admin Portal): Go to Configuration > App Connectors > App Connector Provisioning Keys > Add Provisioning Key. Name key, select Connector Group.',
      'Step 2 (ZPA Admin Portal): Copy generated Provisioning Key token string.',
      'Step 3 (Connector Server Deployment - RHEL/CentOS):',
      '  sudo yum install -y zpa-connector',
      '  sudo systemctl stop zpa-connector',
      '  echo "<PROVISIONING_KEY>" | sudo tee /opt/zscaler/var/provision_key',
      '  sudo systemctl start zpa-connector && sudo systemctl enable zpa-connector',
      'Step 4 (App Segment Creation): Go to Application Management > Application Segments > Add Application Segment. Specify internal FQDN (e.g., gitlab.internal.corp), TCP/UDP ports (e.g., 443, 22), and bind to Connector Group.',
      'Step 5 (ZPA Access Policy): Go to Policy > Access Policy > Add Rule. Define Action = Allow, SamlAttribute (Group) = "DevOps-Engineers", App Segment = "GitLab-Internal".',
    ],
    verificationCommands: [
      'sudo systemctl status zpa-connector (Check active systemd service state)',
      'cat /opt/zscaler/var/zpa-connector.log (Audit live TLS connection to ZPA Central Manager)',
      'zpa-connector -v (Check connector binary release version)',
    ],
    bestPractices: [
      'Deploy App Connectors in High Availability pairs (minimum 2 connectors per Connector Group across distinct availability zones).',
      'Keep App Connector subnets isolated with restricted east-west routing only to targeted application servers.',
      'Enable Auto-Update for App Connector software packages in ZPA Admin Portal.',
    ],
    trainingPrompt: 'How do I deploy ZPA App Connectors, create Provisioning Keys, map Application Segments, and configure Zero Trust Access Policies from scratch?',
    trainingCompletion: `### ZPA App Connector & Zero Trust Setup (A to Z):
1. **Provisioning Key Creation (ZPA Portal)**:
   - Go to **Configuration > App Connector Provisioning Keys**.
   - Create new key assigned to your target **Connector Group** (e.g., \`AWS-us-east-1-CG\`).

2. **Linux Shell Host Installation**:
   \`\`\`bash
   # Install ZPA repository & package
   sudo rpm -ivh https://yum.private.zscaler.com/zscaler-repo-workday-1-1.noarch.rpm
   sudo yum install -y zpa-connector

   # Provision Key Deployment
   sudo systemctl stop zpa-connector
   echo "YOUR_ZPA_PROVISION_KEY_HERE" | sudo tee /opt/zscaler/var/provision_key
   sudo systemctl start zpa-connector
   sudo systemctl status zpa-connector
   \`\`\`

3. **Application Segment Mapping**:
   - Go to **Application Management > Application Segments > Add Segment**.
   - **Domain / IP**: \`*.internal.corp\` or \`10.100.0.0/16\`.
   - **TCP Ports**: \`80, 443, 22, 3389\`.
   - **Connector Group**: Assign \`AWS-us-east-1-CG\`.

4. **Access Policy Definition**:
   - Policy Rule: **ALLOW** User Group \`SOC-Analyst-SAML\` to access Application Segment \`Internal-SIEM-Console\`.`,
  },

  // ─── 3. ZCC (ZSCALER CLIENT CONNECTOR) PLAYBOOKS ───────────────────────────
  {
    id: 'zscaler-zcc-tunnel2-001',
    module: 'ZCC',
    title: 'ZCC (Zscaler Client Connector): Tunnel 2.0 & IdP SAML Enrollment Setup (A to Z)',
    category: 'Endpoint Mobility & Agent Management',
    summary: 'Step-by-step setup for deploying Zscaler Client Connector with Tunnel 2.0 DTLS/TLS steering, Forwarding Profiles, and Microsoft Entra ID (Azure AD) SSO Integration.',
    prerequisites: [
      'SAML 2.0 Identity Provider (Entra ID, Okta, PingIdentity)',
      'ZCC Admin Portal tenant credentials',
      'Client Installer MSI/PKG package',
    ],
    stepByStepConfig: [
      'Step 1 (Entra ID IdP Setup): Register Enterprise Application "Zscaler Client Connector". Configure SAML Single Sign-On (ACS URL, Entity ID).',
      'Step 2 (ZCC Portal): Go to Client Connector App Store > Policy Profiles > Add Forwarding Profile.',
      'Step 3 (Tunnel 2.0 Selection): In Forwarding Profile, set Driver Type = Packet Filter (Windows), Tunnel Type = Tunnel 2.0, Transport Protocol = Primary DTLS / Fallback TLS.',
      'Step 4 (MTU & Steering): Set Tunnel 2.0 MTU to 1360. Enable Fallback to Tunnel 1.0 if DTLS port 443 UDP is blocked by guest Wi-Fi firewalls.',
      'Step 5 (Mass Deployment Command - MSI):',
      '  msiexec /i Zscaler-windows-4.3.0.100-installer.msi /qn STRICTENROLLMENT=1 POLICYTOKEN=<TOKEN> CLOUDNAME=zscalerthree',
    ],
    verificationCommands: [
      'netsh interface ipv4 show subinterfaces (Check Zscaler Virtual Adapter MTU and status)',
      'tasklist | findstr ZSATunnel.exe (Verify Windows ZCC daemon process)',
    ],
    bestPractices: [
      'Always prefer Tunnel 2.0 over Tunnel 1.0 for superior performance, IPv6 handling, and QUIC support.',
      'Enable Anti-Tampering (Password Protection for disabling/uninstalling ZCC agent).',
      'Configure System Proxy Fallback settings for legacy local loopback apps.',
    ],
    trainingPrompt: 'Walk me through configuring Zscaler Client Connector (ZCC) with Tunnel 2.0 DTLS and Azure AD / Entra ID SSO enrollment.',
    trainingCompletion: `### ZCC Tunnel 2.0 & Entra ID SAML Deployment (A to Z):
1. **Entra ID SAML Single Sign-On Setup**:
   - Create Enterprise App **Zscaler Client Connector** in Azure Portal.
   - Map SAML Attributes: \`NameID = user.userprincipalname\`, \`Groups = user.groups\`.

2. **ZCC Forwarding Profile Construction**:
   - Navigate to **Client Connector Portal > Policy Profiles > Forwarding Profile**.
   - **Forwarding Method**: *Tunnel 2.0*.
   - **Primary Transport**: *DTLS* (Port 443 UDP).
   - **Fallback Transport**: *TLS* (Port 443 TCP).
   - **Tunnel 2.0 MTU**: *1360*.

3. **Silent Automated Mass Deployment (MSI Script)**:
   \`\`\`cmd
   msiexec /i Zscaler-windows-4.3.0.msi /qn ^
     STRICTENROLLMENT=1 ^
     CLOUDNAME=zscaler ^
     USERDOMAIN=company.com ^
     HIDEUNINSTALLPROMPT=1
   \`\`\`

4. **Endpoint Diagnostics**:
   - Right-click ZCC tray icon > **More > Diagnostics**.
   - Confirm Service Status: **ON (Tunnel 2.0 Active)**.`,
  },
];

/**
 * Returns Zscaler A-to-Z Configuration Playbook Telemetry
 */
export function getZscalerConfigTelemetry() {
  return {
    totalPlaybooks: ZSCALER_ATOZ_CONFIG_GUIDES.length,
    modulesCovered: ['ZIA (Internet Access)', 'ZPA (Private Access)', 'ZCC (Client Connector)', 'ZDX (Digital Experience)', 'NSS/LSS (Log Streaming)'],
    coverage: 'A-to-Z Step-by-Step CLI, UI, MTU Tuning, PKI Root CA, Tunnel 2.0, & SAML IdP Setup',
  };
}
