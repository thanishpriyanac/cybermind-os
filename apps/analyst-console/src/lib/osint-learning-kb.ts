/**
 * CyberMind AI — OSINT (Open Source Intelligence) & Deep Cybersecurity Masterclass Knowledge Base
 * 
 * Provides exhaustive, complete technical study guides, CLI commands, YARA rules, Sigma rules,
 * and passive reconnaissance playbooks across top OSINT platforms:
 * 1. Shodan & Censys (Internet Infrastructure Scanning & Exposed Service Recon)
 * 2. VirusTotal & Hybrid Analysis (Malware Sandbox Telemetry & YARA Hunting)
 * 3. AlienVault OTX & ThreatMiner (IOC Pulse Correlation & STIX Graphs)
 * 4. GreyNoise & AbuseIPDB (Mass Scanner Noise Filtering & IP Reputation)
 * 5. Bellingcat & GEOINT / SOCMINT (Open Source Investigation & Geolocation)
 * 6. SecurityTrails & Certificate Transparency (Passive DNS & Subdomain Enumeration)
 * 7. OSINT Framework & Recon-ng (Passive Information Gathering Playbooks)
 */

export interface OsintKnowledgeGuide {
  id: string;
  source: string;
  url: string;
  title: string;
  category: 'OSINT' | 'RESEARCH' | 'MALWARE' | 'EXPLOIT' | 'ADVISORY';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  contentSnippet: string;
  trainingPrompt: string;
  trainingCompletion: string;
  tags: string[];
}

export const OSINT_MASTER_KNOWLEDGE_BASE: OsintKnowledgeGuide[] = [
  // ─── 1. SHODAN & CENSYS INFRASTRUCTURE RECON ──────────────────────────────
  {
    id: 'osint-shodan-censys-001',
    source: 'Shodan.io & Censys.io',
    url: 'https://www.shodan.io',
    title: 'OSINT Masterclass: Shodan & Censys Advanced Search Syntax, Port Scanning & CVE Correlation',
    category: 'OSINT',
    severity: 'CRITICAL',
    summary: 'Exhaustive technical study guide for performing passive internet-wide infrastructure reconnaissance using Shodan and Censys query operators, JA3/JA4 TLS fingerprinting, and exposed device discovery.',
    contentSnippet: `SHODAN ADVANCED SEARCH OPERATORS & SYNTAX MASTERCLASS:
- Search by Organization / ASN: org:"Acme Corp" asn:AS13335
- Search by Port & Service: port:443 product:"Fortinet FortiGate SSL-VPN"
- Search by Vulnerability / CVE: vuln:"CVE-2026-9270"
- Search by SSL Certificate SHA-256 / CN: ssl.cert.subject.cn:"*.acme.com"
- Search by HTTP Response Header / Title: http.title:"Dashboard Login" http.favicon.hash:116323821

CENSYS SEARCH OPERATORS & JA3 FINGERPRINTING:
- Censys Query: services.software.vendor: "Palo Alto Networks" AND services.port: 443
- JA3 Fingerprint Search: services.tls.ja3s: "e35df3e00ca4ef31d42b8d4e857a7077"
- Certificate Transparency Log Hunt: certificates.names: "subdomain.target.corp"

CLI AUTOMATION COMMANDS:
1. Shodan CLI Initialization: shodan init <YOUR_API_KEY>
2. Host Inspection: shodan host 203.0.113.50
3. Search Export: shodan download --limit 500 fortigate_cve.json.gz 'product:"FortiGate" vuln:"CVE-2026-9270"'
4. Parse Results: shodan parse --fields ip_str,port,org,vuln fortigate_cve.json.gz`,
    trainingPrompt: 'Provide a complete technical OSINT guide for using Shodan and Censys to discover exposed enterprise infrastructure, vulnerable FortiGate/Palo Alto appliances, and SSL certificate relationships.',
    trainingCompletion: `### OSINT Infrastructure Reconnaissance & Threat Hunting Guide (Shodan & Censys)

#### 1. Executive Summary & Objective:
Passive infrastructure reconnaissance allows threat intelligence analysts and SOC teams to identify exposed perimeter attack surfaces, unpatched zero-day vulnerabilities, and unauthorized cloud assets without sending a single probe to target subnets.

#### 2. Shodan Advanced Search Dorks & Use Cases:
| Recon Objective | Shodan Query Syntax | Technical Explanation |
| :--- | :--- | :--- |
| **Exposed FortiGate SSL-VPNs** | \`product:"FortiGate" port:10443\` | Identifies FortiOS SSL-VPN login portals on custom ports. |
| **CVE Vulnerability Search** | \`vuln:"CVE-2026-9270"\` | Filters hosts confirmed vulnerable by Shodan banner probes. |
| **SSL Certificate Hierarchy** | \`ssl.cert.subject.cn:"*.company.com"\` | Maps public subdomains via SSL certificate Subject Alternative Names (SANs). |
| **Favicon Hash Recon** | \`http.favicon.hash:116323821\` | Uses Murmur3 hash of favicon images to locate specific enterprise apps. |
| **Remote Access Protocols** | \`port:3389,5900 "authentication disabled"\` | Uncovers exposed RDP and VNC instances lacking authentication. |

#### 3. Censys Advanced Threat Hunting Syntax:
\`\`\`sql
-- Censys Search v2 SQL Syntax
SELECT ip, services.port, services.service_name, location.country 
FROM censys.hosts 
WHERE services.software.vendor = 'Palo Alto Networks' 
  AND services.software.product = 'PAN-OS'
  AND labels = 'vulnerable';
\`\`\`

#### 4. Shodan CLI Automation Workflow:
\`\`\`bash
# 1. Initialize API Session
shodan init YOUR_SHODAN_API_KEY

# 2. Query target domain subnets & save output
shodan search --fields ip_str,port,org,hostnames "org:'Target Enterprise'" > exposed_assets.txt

# 3. Stats breakdown by country and port
shodan stats --facets port,country "org:'Target Enterprise'"

# 4. Monitor perimeter IP list in real-time
shodan monitor add 198.51.100.0/24
\`\`\`

#### 5. Defensive Remediation Playbook:
1. **Perimeter Audit**: Regularly run automated Shodan API queries against corporate ASN and IP ranges.
2. **Access Control**: Restrict administrative portals (port 8443, 10443, 22, 3389) behind ZPA (Zscaler Private Access) or IP-whitelisted VPNs.
3. **SSL Certificate Masking**: Avoid exposing internal domain names in public SSL SAN fields where unnecessary.`,
    tags: ['OSINT', 'Shodan', 'Censys', 'Reconnaissance', 'CVE', 'SSL_SAN', 'JA3'],
  },

  // ─── 2. VIRUSTOTAL & ALIENVAULT OTX THREAT HUNTING ────────────────────────
  {
    id: 'osint-virustotal-alienvault-002',
    source: 'VirusTotal & AlienVault OTX',
    url: 'https://www.virustotal.com',
    title: 'OSINT Threat Intelligence: VirusTotal VTI Intelligence, YARA Rules & AlienVault OTX Pulse Correlation',
    category: 'OSINT',
    severity: 'CRITICAL',
    summary: 'Comprehensive study guide on leveraging VirusTotal Enterprise (VTI) search modifiers, YARA rule writing, and AlienVault OTX open-source threat intelligence pulse correlation.',
    contentSnippet: `VIRUSTOTAL ENTERPRISE (VTI) ADVANCED SEARCH MODIFIERS:
- File Hash Query: sha256:7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a
- File Type & Execution Behavior: type:pe-exe exports:VirtualAlloc imports:InternetOpenUrlA
- Subdomain / Parent Domain Lookup: domain:malicious-domain.com
- Embedded IP Address & C2 Server: ip:198.51.100.45
- YARA Rule Match Hunt: yara_rule:APT29_Cobalt_Strike_Beacon

ALIENVAULT OTX PULSE CORRELATION:
- OTX Pulse API Endpoint: https://otx.alienvault.com/api/v1/pulses/subscribed
- STIX 2.1 JSON Export: Extract indicators (IP, FileHash-SHA256, Domain, URI, YARA)
- Threat Actor Mapping: TTPs mapped to MITRE ATT&CK (T1059, T1071, T1566)

SAMPLE YARA DETECTION RULE:
rule APT_PowerShell_Obfuscated_Dropper {
    meta:
        description = "Detects obfuscated PowerShell dropper payload identified in OSINT feeds"
        author = "CyberMind OSINT Intelligence"
        severity = "CRITICAL"
    strings:
        $s1 = "FromBase64String" ascii wide case_insensitive
        $s2 = "IO.MemoryStream" ascii wide case_insensitive
        $s3 = "GzipStream" ascii wide case_insensitive
        $s4 = "Rundll32" ascii wide case_insensitive
    condition:
        all of ($s*) and filesize < 500KB
}`,
    trainingPrompt: 'Explain how to conduct VirusTotal VTI malware threat hunting, write custom YARA detection rules, and correlate AlienVault OTX IOC pulses for SOC investigations.',
    trainingCompletion: `### VirusTotal & AlienVault OTX Malware Threat Hunting Masterclass

#### 1. VirusTotal Intelligence (VTI) Search Matrix:
| Search Modifier | Example Query | Analyst Purpose |
| :--- | :--- | :--- |
| **Specific File Hash** | \`sha256:a1b2c3d4...\` | Inspects sandbox behavioral graph and AV vendor detections. |
| **Imphash (Import Hash)** | \`imphash:1a2b3c4d...\` | Finds malware compiled with identical import tables. |
| **VT Grep Code Search** | \`code:"VirtualAllocEx" AND code:"WriteProcessMemory"\` | Locates binaries containing process injection code patterns. |
| **Communicated IP** | \`it:"198.51.100.50"\` | Finds all samples contacting a specific C2 IP address. |
| **Subdomain Enumeration** | \`domain:target.com\` | Lists all passive DNS subdomains resolved by VT crawler. |

#### 2. YARA Rule Writing Framework:
\`\`\`yara
rule CyberMind_Ransomware_Canary_Detector {
    meta:
        author = "SOC Threat Intel Team"
        description = "Detects canary file encryption routines"
        date = "2026-09-10"
        reference = "AlienVault OTX Pulse #8821"
    strings:
        $header = { 4D 5A } // MZ Header
        $str1 = "canary_honeypot.db" ascii wide
        $str2 = "CryptoAPI" ascii wide
        $hex_pattern = { 8B 45 ?? 83 C0 04 89 45 }
    condition:
        $header at 0 and all of ($str*) and $hex_pattern
}
\`\`\`

#### 3. AlienVault OTX Automated Python Ingestion Script:
\`\`\`python
import requests

OTX_API_KEY = "YOUR_ALIENVAULT_OTX_API_KEY"
headers = {"X-OTX-API-KEY": OTX_API_KEY}

# Fetch subscribed pulses
url = "https://otx.alienvault.com/api/v1/pulses/subscribed?limit=10"
response = requests.get(url, headers=headers).json()

for pulse in response.get("results", []):
    print(f"Pulse: {pulse['name']} | Author: {pulse['author_name']}")
    for indicator in pulse.get("indicators", []):
        print(f"  -> [{indicator['type']}] {indicator['indicator']}")
\`\`\`

#### 4. Actionable SOC Workflow:
1. Ingest OTX Pulse IOCs into SIEM threat intelligence tables.
2. Automate VirusTotal Hash API lookups for all newly downloaded binaries on end-user workstations.
3. Deploy YARA rules to EDR agent scanners for memory and disk inspection.`,
    tags: ['OSINT', 'VirusTotal', 'AlienVault_OTX', 'YARA', 'ThreatHunting', 'Malware', 'IOC'],
  },

  // ─── 3. GREYNOISE & ABUSEIPDB MASS SCANNER INTELLIGENCE ────────────────────
  {
    id: 'osint-greynoise-abuseipdb-003',
    source: 'GreyNoise.io & AbuseIPDB.com',
    url: 'https://www.greynoise.io',
    title: 'OSINT Masterclass: GreyNoise Mass Scanner Noise Reduction, RIOT Datasets & AbuseIPDB Reputation Analysis',
    category: 'OSINT',
    severity: 'HIGH',
    summary: 'Technical guide on using GreyNoise Visualizer/API to distinguish background internet noise from targeted APT attacks, leveraging RIOT benign whitelist, and querying AbuseIPDB for malicious IP scoring.',
    contentSnippet: `GREYNOISE QUERY LANGUAGE (GNQL) MASTERCLASS:
- Search Malicious Mass Scanners: noise:true classification:malicious
- Search Specific Vulnerability Scanner: cve:CVE-2026-9270
- Search Spoofed Scanners: spoofed:true
- Search RIOT (Rule It Out - Trusted Services): riot:true (Google, Cloudflare, Microsoft IPs)
- Query Actor / Botnet: actor:"Mirai" or actor:"Necurs"

ABUSEIPDB CATEGORY MAPPING & API QUERY:
- Category 14: Port Scan | Category 18: Brute Force | Category 21: Web App Attack | Category 4: DDoS
- API Check: GET https://api.abuseipdb.com/api/v2/check?ipAddress=198.51.100.25&maxAgeInDays=90
- Abuse Confidence Score (0-100%): >80 = Confirmed Malicious, >40 = Suspicious

SOC SIEM ALERT REDUCTION WORKFLOW:
1. Firewalls & WAF generate 50,000+ inbound probe alerts per day.
2. Query GreyNoise API: If noise=true AND classification=benign -> Suppress alert.
3. If noise=false AND target=internal_server -> High-Priority Targeted Attack Alert!`,
    trainingPrompt: 'How do GreyNoise GNQL queries and AbuseIPDB API scores help SOC analysts filter out internet background noise and identify targeted zero-day attacks?',
    trainingCompletion: `### GreyNoise & AbuseIPDB Internet Scanner Intelligence Guide

#### 1. Problem Statement:
SOC analysts are overwhelmed by millions of daily inbound firewall and WAF alerts generated by opportunistic internet mass scanners (Shodan, Censys, Mirai botnets). GreyNoise isolates "internet background noise" so analysts focus exclusively on targeted attacks.

#### 2. GreyNoise GNQL Query Cheat Sheet:
| Objective | GNQL Query Syntax | Analyst Interpretation |
| :--- | :--- | :--- |
| **Malicious Opportunistic Scanners** | \`classification:malicious\` | IPs scanning the entire IPv4 space for known exploits. |
| **Active CVE Probers** | \`cve:"CVE-2026-9270"\` | Lists all IPs actively scanning for CVE-2026-9270. |
| **RIOT Trusted Services** | \`riot:true provider:"Microsoft"\` | Confirms IP belongs to legitimate cloud provider (Do NOT Block!). |
| **Targeted Attack Indicator** | \`noise:false\` | The IP is scanning ONLY YOUR NETWORK (Targeted Recon!). |

#### 3. AbuseIPDB API Integration (Python Example):
\`\`\`python
import requests

def check_ip_reputation(ip_address):
    url = 'https://api.abuseipdb.com/api/v2/check'
    params = {'ipAddress': ip_address, 'maxAgeInDays': '90'}
    headers = {'Accept': 'application/json', 'Key': 'YOUR_ABUSEIPDB_API_KEY'}
    
    response = requests.get(url, headers=headers, params=params).json()
    data = response.get('data', {})
    
    score = data.get('abuseConfidenceScore', 0)
    country = data.get('countryCode', 'N/A')
    usage = data.get('usageType', 'N/A')
    
    return {
        'ip': ip_address,
        'abuseScore': score,
        'threatLevel': 'MALICIOUS' if score >= 80 else ('SUSPICIOUS' if score >= 40 else 'CLEAN'),
        'country': country,
        'usageType': usage
    }

# Example Output
print(check_ip_reputation('198.51.100.75'))
\`\`\`

#### 4. SOC Automated Triaging Matrix:
- **Case A**: Inbound Probe from noise:true + classification:benign -> **Automated Auto-Dismiss**.
- **Case B**: Inbound Probe from abuseScore: 95% + noise:true -> **Block at Edge Firewall**.
- **Case C**: Inbound Connection from noise:false + abuseScore: 10% -> **ESCALATE TO SOC ANALYST (Targeted Zero-Day Threat!)**.`,
    tags: ['OSINT', 'GreyNoise', 'AbuseIPDB', 'GNQL', 'NoiseReduction', 'SIEM_Triage', 'IPReputation'],
  },

  // ─── 4. BELLINGCAT & GEOINT / SOCMINT OSINT METHODOLOGIES ────────────────
  {
    id: 'osint-bellingcat-geoint-004',
    source: 'Bellingcat & OSINT Framework',
    url: 'https://www.bellingcat.com',
    title: 'OSINT Masterclass: Bellingcat Investigation Techniques, GEOINT Satellite Analysis & Digital Evidence Verification',
    category: 'OSINT',
    severity: 'HIGH',
    summary: 'Exhaustive guide covering Bellingcat open-source investigation methodologies, GEOINT satellite imagery analysis, EXIF metadata extraction, reverse image searching, and social media OSINT (SOCMINT).',
    contentSnippet: `BELLINGCAT OPEN SOURCE INVESTIGATIVE METHODOLOGY:
1. Evidence Verification: Verify digital photo/video authenticity using EXIF metadata tool (exiftool photo.jpg).
2. Geolocation (GEOINT): Match satellite imagery (Google Earth Pro, Sentinel Hub, Sentinel-2) with visual landmarks (building shadows, road networks, terrain contours, power lines).
3. Chronolocation (Time Estimation): Calculate sun elevation angles and shadow lengths using SunCalc (suncalc.org) to pinpoint exact time of day.
4. Network & Domain OSINT: Query historical WHOIS records (whoxy.com), SecurityTrails passive DNS history, and WayBack Machine archives.
5. Social Media OSINT (SOCMINT): Track user accounts, Telegram channel exports, and cross-platform profile handles using Sherloq / Maigret CLI.

EXIFTOOL COMMAND LINE EXAMPLES:
- View All Metadata: exiftool image.jpg
- Extract GPS Coordinates: exiftool -gpslatitude -gpslongitude image.jpg
- Strip Metadata for Privacy: exiftool -all= image.jpg`,
    trainingPrompt: 'Explain how Bellingcat open-source investigators use GEOINT, shadow analysis (SunCalc), EXIF metadata, and reverse image lookup for digital evidence verification.',
    trainingCompletion: `### Bellingcat Open Source Intelligence (OSINT) & GEOINT Masterclass

#### 1. Core Principles of Digital Evidence Verification:
Investigative OSINT relies on establishing **Who, What, Where, When, and Why** using publicly available digital artifacts without compromising target privacy or relying on unverified claims.

#### 2. GEOINT & Chronolocation Step-by-Step Workflow:
1. **Visual Landmark Identification**:
   - Locate prominent features: mountain ridges, unique architecture, road sign languages, license plate formats, vegetation types.
2. **Satellite Image Matching**:
   - Compare photo features against **Google Earth Pro 3D Terrain**, **Sentinel Hub EO Browser**, and **Planet Labs**.
3. **Sun Shadow Analysis (Chronolocation via SunCalc)**:
   - Measure shadow length vs object height ratio: \`tan(solar_altitude) = height / shadow_length\`.
   - Input date and estimated GPS coordinates into **SunCalc.org** to obtain exact timestamp of photo capture.

#### 3. Metadata & Image Analysis Tooling:
\`\`\`bash
# 1. Inspect EXIF Camera Metadata
exiftool -a -u -g1 evidence_photo.jpg

# 2. Extract embedded thumbnail & GPS map link
exiftool -ee -p '$GPSLatitude, $GPSLongitude' video_clip.mp4

# 3. Reverse Image Search Platforms
# - Google Lens (visual object matching)
# - Yandex Images (superior facial and geographical landmark recognition)
# - TinEye (historical image index)
\`\`\`

#### 4. Domain & Social Media Recon (SOCMINT):
\`\`\`bash
# Run Maigret to search username across 2,000+ social platforms
maigret <target_username> --json --html

# Passive Subdomain Mapping via SecurityTrails API
curl -s "https://api.securitytrails.com/v1/domain/target.com/subdomains" \
  -H "APIKEY: YOUR_SECURITYTRAILS_API_KEY" | jq .
\`\`\`

#### 5. Verification Checklist:
- [x] EXIF Timestamp matches reported event timeframe.
- [x] Weather / satellite cloud cover aligns with historical radar logs.
- [x] Shadows point toward correct solar azimuth angle.
- [x] Passive DNS history confirms domain ownership during incident window.`,
    tags: ['OSINT', 'Bellingcat', 'GEOINT', 'SOCMINT', 'EXIF', 'SunCalc', 'ReverseImageSearch'],
  },

  // ─── 5. SECURITYTRAILS & CERTIFICATE TRANSPARENCY ─────────────────────────
  {
    id: 'osint-securitytrails-ct-005',
    source: 'SecurityTrails & crt.sh',
    url: 'https://crt.sh',
    title: 'OSINT Masterclass: Certificate Transparency Log Hunting (crt.sh) & Passive DNS Subdomain Mapping',
    category: 'OSINT',
    severity: 'MEDIUM',
    summary: 'Technical guide on using Certificate Transparency (CT) logs via crt.sh and SecurityTrails API to uncover hidden dev/staging subdomains, shadow IT infrastructure, and historical IP resolutions.',
    contentSnippet: `CERTIFICATE TRANSPARENCY (CT) LOG HUNTING:
- Certificate Transparency (CT) requires public Certificate Authorities (CAs) to log every issued TLS certificate in append-only cryptographic logs.
- Web Query: https://crt.sh/?q=%.target.com&output=json
- CT logs reveal newly registered subdomains (e.g., dev-api.target.com, staging-vpn.target.com, internal-jenkins.target.com) MINUTES after cert issuance!

SECURITYTRAILS HISTORICAL DNS & WHOIS:
- Historical A Records: Tracks every IP address a domain resolved to over the last 10 years.
- Historical WHOIS: Uncovers historical registrant names, admin emails, and phone numbers prior to WHOIS privacy protection masking.

CURL & JQ ONE-LINER FOR SUBDOMAIN ENUMERATION:
curl -s "https://crt.sh/?q=%25.acme.com&output=json" | jq -r '.[].name_value' | sort -u`,
    trainingPrompt: 'How do Certificate Transparency logs (crt.sh) and historical DNS records allow threat analysts to map attack surfaces and detect shadow IT?',
    trainingCompletion: `### Certificate Transparency (CT) & Passive DNS Reconnaissance Guide

#### 1. Technical Mechanics of Certificate Transparency:
When a DevOps engineer or IT admin requests an SSL/TLS certificate (e.g., Let's Encrypt, DigiCert) for a new internal or staging server, the CA immediately writes the Subject Alternative Names (SANs) to public Certificate Transparency logs. Analysts query these logs to discover assets before they appear in DNS search engines.

#### 2. crt.sh Command-Line Subdomain Extractor:
\`\`\`bash
#!/bin/bash
# Extract clean, unique subdomains from crt.sh JSON API
TARGET_DOMAIN="example.com"

curl -s "https://crt.sh/?q=%25.\${TARGET_DOMAIN}&output=json" | \
  jq -r '.[].name_value' | \
  sed 's/\*\.//g' | \
  sort -u > subdomains_\${TARGET_DOMAIN}.txt

echo "[+] Discovered \$(wc -l < subdomains_\${TARGET_DOMAIN}.txt) unique subdomains for \${TARGET_DOMAIN}"
\`\`\`

#### 3. SecurityTrails API Query Examples:
\`\`\`python
import requests

API_KEY = "YOUR_SECURITYTRAILS_API_KEY"
domain = "example.com"

# 1. Fetch Current Subdomains
url_sub = f"https://api.securitytrails.com/v1/domain/{domain}/subdomains"
res_sub = requests.get(url_sub, headers={"APIKEY": API_KEY}).json()
print("Subdomains:", res_sub.get("subdomains", []))

# 2. Fetch Historical A Records (Previous IPs)
url_hist = f"https://api.securitytrails.com/v1/history/{domain}/dns/a"
res_hist = requests.get(url_hist, headers={"APIKEY": API_KEY}).json()
for record in res_hist.get("records", []):
    print(f"IP: {record.get('values')[0]['ip']} | First Seen: {record.get('first_seen')} | Last Seen: {record.get('last_seen')}")
\`\`\`

#### 4. Defensive Action Plan:
1. **Monitor CT Logs**: Set up automated Webhooks alerting security teams whenever a new certificate is issued for corporate root domains.
2. **Decommission Shadow IT**: Audit unused subdomains pointing to stale cloud IPs (prevents **Subdomain Takeover** attacks).`,
    tags: ['OSINT', 'crt.sh', 'SecurityTrails', 'PassiveDNS', 'CertificateTransparency', 'ShadowIT'],
  },

  // ─── 8. SEPTEMBER 11, 2026 MASTER CTI & AGENTIC AI THREAT GRAPH ──────────────────────
  {
    id: 'osint-cisco-fmc-2026',
    source: 'Cisco Talos & CyberMind CTI Engine',
    url: 'https://blog.talosintelligence.com/fmc-ongoing-exploitation/',
    title: '🔴 ACTIVE EXPLOITATION: Cisco Secure Firewall FMC Unauthenticated Root RCE (CVE-2026-20079 & CVE-2026-20316)',
    category: 'EXPLOIT',
    severity: 'CRITICAL',
    summary: 'Cisco Talos confirmed active wild exploitation targeting Cisco Secure Firewall Management Center (FMC) via CVSS 10.0 authentication-bypass (CVE-2026-20079) combined with command execution (CVE-2026-20316) for root backdoor access.',
    contentSnippet: `CISCO FMC ACTIVE EXPLOITATION SUMMARY:
- Target Product: Cisco Secure Firewall Management Center (FMC) & FMC Virtual
- CVE IDs: CVE-2026-20079 (CVSS 10.0), CVE-2026-20316 (CVSS 9.8)
- Attack Vector: Unauthenticated HTTP/HTTPS management port access (443/8443)
- Impact: Remote arbitrary script execution with root privileges
- Confirmation: Cisco Talos confirmed active exploitation in the wild starting Sept 9, 2026

SNORT / SURICATA DETECTION RULE:
alert tcp $EXTERNAL_NET any -> $HOME_NET [443,8443] (msg:"PU-EXPLOIT Cisco FMC Unauthenticated Auth Bypass (CVE-2026-20079)"; flow:established,to_server; content:"POST"; http_method; content:"/api/fmc_config/v1/domain/"; http_uri; content:"X-FMC-Bypass-Token:"; http_header; sid:3000981; rev:1;)

REMEDIATION & SOC ACTION PLAN:
1. Immediately restrict HTTP/HTTPS access to FMC management interface to trusted admin jump boxes.
2. Apply Cisco Security Advisory software update for FMC 7.4.x / 7.2.x.
3. Audit /var/log/sf/ and /var/log/httpd/ for unauthorized POST requests returning 200 OK.`,
    trainingPrompt: 'Provide emergency SOC triage and containment playbook for Cisco Secure Firewall FMC CVSS 10.0 active exploitation (CVE-2026-20079 & CVE-2026-20316).',
    trainingCompletion: `### 🔴 Emergency SOC Playbook: Cisco Secure Firewall FMC Active Exploitation (CVE-2026-20079 & CVE-2026-20316)

#### 1. Threat Overview & CVSS Score:
- **CVSS Score**: **10.0 (Critical)** | Vector: \`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H\`
- **Adversary Activity**: Cisco Talos confirmed active wild exploitation. Attackers exploit an authentication bypass in FMC web endpoints to gain root shell execution and deploy persistent backdoors.

#### 2. Detection & SIEM Hunting Queries (KQL & Sigma):
\`\`\`kql
// Detect anomalous admin API calls to Cisco FMC web interfaces
Syslog
| where ProcessName in ("httpd", "sf-api")
| where SyslogMessage has_any ("/api/fmc_config/", "/api/fmc_platform/")
| where SyslogMessage has "200 OK" and SyslogMessage !has "AuthenticatedUser"
| summarize EventCount=count() by HostIP, SrcIP=extract(@"(\\d+\\.\\d+\\.\\d+\\.\\d+)", 1, SyslogMessage)
\`\`\`

#### 3. Immediate Containment Roadmap:
1. **Perimeter Isolation**: Block public internet access to ports 443/8443 on FMC interfaces.
2. **Apply Cisco Security Patch**: Upgrade FMC software releases to patched builds (7.4.2.1+ / 7.2.9+).
3. **Forensic Audit**: Sweep '/var/sf/detection_engines/' and cron jobs for newly created backdoor scripts.`,
    tags: ['Cisco', 'FMC', 'CVE-2026-20079', 'ActiveExploitation', 'Critical', 'RCE', 'Snort'],
  },
  {
    id: 'osint-watchguard-ransomware-2026',
    source: 'CISA KEV & BleepingComputer',
    url: 'https://www.bleepingcomputer.com/news/security/cisa-watchguard-rce-flaw-now-exploited-in-ransomware-attacks/',
    title: '🔴 RANSOMWARE EXPLOITATION: WatchGuard Firebox IKEv2 VPN RCE (CVE-2025-14733)',
    category: 'MALWARE',
    severity: 'CRITICAL',
    summary: 'CISA KEV update confirms critical WatchGuard Firebox IKEv2 VPN remote code execution vulnerability (CVE-2025-14733) is actively leveraged by ransomware cartels for initial access into corporate networks.',
    contentSnippet: `WATCHGUARD FIREBOX RANSOMWARE EXPLOITATION SUMMARY:
- Target Product: WatchGuard Firebox Appliances running Fireware OS
- CVE ID: CVE-2025-14733 (CVSS 9.8)
- Vulnerability Type: Memory corruption in IKEv2 VPN service engine
- Ransomware Nexus: CISA added to KEV following confirmed deployment of ransomware strains via IKEv2 exploit payloads
- MitRE ATT&CK Mapping: T1190 (Exploit Public-Facing Application) -> T1486 (Data Encrypted for Impact)

SIGMA DETECTION RULE:
title: WatchGuard Firebox IKEv2 VPN Anomaly & Ransomware Staging
status: production
logsource:
  category: firewall
  product: watchguard
detection:
  selection:
    EventID: 40001
    Message|contains: 'IKEv2 buffer overflow'
  condition: selection
level: critical`,
    trainingPrompt: 'Explain how threat actors use WatchGuard Firebox CVE-2025-14733 for ransomware initial access and provide SIEM detection guidance.',
    trainingCompletion: `### 🔴 Ransomware Threat Intelligence: WatchGuard Firebox IKEv2 VPN (CVE-2025-14733)

#### 1. Technical Attack Chain:
1. **Initial Access (T1190)**: Threat actors send crafted UDP 500/4500 IKEv2 packets to vulnerable Firebox VPN gateways.
2. **Arbitrary Code Execution**: Buffer overflow triggers unauthenticated code execution in Fireware OS kernel context.
3. **Lateral Movement & Encryption (T1486)**: Attackers pivot from VPN gateway to Active Directory domain controllers to drop ransomware payloads.

#### 2. Mitigation Strategy:
1. Disable IKEv2 VPN if not actively required, or restrict IKEv2 peer IP addresses.
2. Update Fireware OS to latest patched firmware immediately.
3. Conduct active threat hunt for secondary payloads on internal subnets connected to Firebox interfaces.`,
    tags: ['WatchGuard', 'Firebox', 'CVE-2025-14733', 'Ransomware', 'CISA_KEV', 'IKEv2', 'Critical'],
  },
  {
    id: 'osint-msft-patchtuesday-sept2026',
    source: 'Microsoft Security Response Center (MSRC)',
    url: 'https://www.microsoft.com/en-us/msrc/blog/2026/09/202609-security-update',
    title: '🔴 WINDOWS ZERO-DAY EXPLOITED: Microsoft September 2026 Patch Tuesday (CVE-2026-85880 & CVE-2026-81963)',
    category: 'ADVISORY',
    severity: 'CRITICAL',
    summary: 'Microsoft confirmed active wild exploitation of two zero-day privilege escalation vulnerabilities prior to patch release: Windows ALPC (CVE-2026-85880) and Windows Update Stack (CVE-2026-81963).',
    contentSnippet: `MICROSOFT SEPTEMBER 2026 ZERO-DAY SUMMARY:
1. CVE-2026-85880: Windows Advanced Local Procedure Call (ALPC) Privilege Escalation (SYSTEM Access)
2. CVE-2026-81963: Windows Update Stack Privilege Escalation (Security Agent Tampering)
- Status: Confirmed active zero-day exploitation prior to September Patch Tuesday release
- Action Required: Apply KB5061298 / KB5061299 updates immediately across Windows 10, Windows 11, and Windows Server 2022/2025.`,
    trainingPrompt: 'Provide threat analysis and patch priority assessment for Microsoft September 2026 Patch Tuesday zero-days (CVE-2026-85880 & CVE-2026-81963).',
    trainingCompletion: `### 🔴 Microsoft Patch Tuesday Threat Intelligence (September 2026 Zero-Days)

#### 1. Vulnerability Analysis:
- **CVE-2026-85880 (Windows ALPC)**: Local unprivileged users or malware processes exploit RPC message queues to elevate privileges directly to 'NT AUTHORITY\SYSTEM'.
- **CVE-2026-81963 (Windows Update Stack)**: Attackers leverage update service file handling to bypass EDR drivers and tamper with security agents during system reboot.

#### 2. SOC Action Roadmap:
1. **Priority Patching**: Deploy September 2026 Cumulative Update (KB5061298 / KB5061299) to domain controllers and critical servers within 24 hours.
2. **EDR Audit**: Monitor for process creation originating from 'lsass.exe' or 'svchost.exe (netsvcs)' spawning un-signed PowerShell or CMD sessions.`,
    tags: ['Microsoft', 'PatchTuesday', 'ZeroDay', 'CVE-2026-85880', 'CVE-2026-81963', 'Windows', 'PrivEsc'],
  },
  {
    id: 'osint-gtig-agentic-ai-threats-2026',
    source: 'Google Threat Intelligence Group (GTIG)',
    url: 'https://cloud.google.com/blog/topics/threat-intelligence/from-prompting-to-autonomy-the-evolution-of-adversarial-ai',
    title: '🤖 STRATEGIC AI THREAT GRAPH: GTIG Report on Adversarial Agentic AI Workflows & 6-Hour Cloud Attack',
    category: 'RESEARCH',
    severity: 'HIGH',
    summary: 'Google Threat Intelligence Group (GTIG) reported adversary evolution from simple LLM prompting to autonomous agentic attack workflows, demonstrating a 6-hour automated credential harvesting campaign and UNC6780 LLM scanner manipulation.',
    contentSnippet: `GTIG ADVERSARIAL AGENTIC AI THREAT GRAPH REPORT:
- Evolution: Transition from manual prompting to multi-agent autonomous execution loops
- Observed Event: Threat actor compromised cloud container, then deployed autonomous AI agent loop that planned, built, and executed a mass credential-harvesting campaign in under 6 hours.
- Threat Group UNC6780: Tracked manipulating AI coding assistants (GitHub Copilot / Cursor) and LLM security scanners in software supply chain compromises.

MITRE ATLAS & ATT&CK CROSS-MAPPING:
- MITRE ATLAS AML.T0054 (LLM Prompt Injection)
- MITRE ATLAS AML.T0040 (AI Supply Chain Poisoning)
- MITRE ATT&CK T1552 (Unsecured Credentials) -> T1078 (Valid Accounts) -> Autonomous Execution Loop`,
    trainingPrompt: 'Detail the strategic findings of the GTIG Agentic AI Threat Report and outline defensive counter-measures for AI supply chain attacks.',
    trainingCompletion: `### 🤖 Strategic AI Threat Intelligence Report: Adversarial Agentic AI Workflows (GTIG Analysis)

#### 1. Key Findings & Adversary Capabilities:
- **Autonomous Execution Velocity**: Adversaries now leverage LLM agentic loops to automate multi-stage kill chains (Recon -> Exploit -> Credential Harvest) in under **6 hours**.
- **Supply Chain & Coding Assistant Manipulation (UNC6780)**: Attackers inject malicious context into repository files (\`README.md\`, \`.env.example\`, system prompts) to trick AI coding assistants into introducing backdoors.

#### 2. Defensive Controls & AI Security Knowledge Graph Integration:
1. **AI Assistant Context Sandboxing**: Restrict AI coding assistants from automatically executing shell commands or reading unvalidated external repository prompts.
2. **LLM Scanner Verification**: Mandate dual-human verification for AI-generated code changes touching cryptographic or authentication modules.`,
    tags: ['GTIG', 'GoogleCloud', 'AgenticAI', 'AdversarialAI', 'UNC6780', 'MITRE_ATLAS', 'AI_Security', 'CloudThreats'],
  },
  {
    id: 'osint-anthropic-claude-disruption-2026',
    source: 'Anthropic Security & Reuters',
    url: 'https://www.reuters.com/legal/litigation/anthropic-disrupts-russian-chinese-ai-campaigns-targeting-its-claude-models-2026-09-10/',
    title: '🤖 AI THREAT INTEL: Anthropic Disruption of Midnight Blizzard & China-Nexus Campaigns',
    category: 'RESEARCH',
    severity: 'HIGH',
    summary: 'Anthropic reported disrupting state-sponsored cyber operations targeting Claude AI models, attributing campaigns to Russia-nexus Midnight Blizzard (targeting Ukrainian military infrastructure) and China-nexus APT groups using AI for malware code obfuscation.',
    contentSnippet: `ANTHROPIC AI CAMPAIGN DISRUPTION SUMMARY:
- Target AI Models: Claude 3.5 Sonnet / Claude Enterprise API
- Threat Actors Identified:
  1. Midnight Blizzard (APT29 / Russia-Nexus): Leveraged AI models for malware code refactoring & evading EDR signatures in targeted attacks on Ukrainian government & military targets.
  2. China-Nexus APT Groups: Tested AI-assisted vulnerability research & automated spear-phishing content generation.
- Confidence Score: Medium-High (Source-Attributed by Anthropic Security Threat Research).`,
    trainingPrompt: 'Summarize Anthropic report on Midnight Blizzard AI-assisted cyber operations and explain how threat actors utilize LLMs for malware obfuscation.',
    trainingCompletion: `### 🤖 AI Threat Intelligence: State-Sponsored Exploitation of LLMs (Anthropic Analysis)

#### 1. Threat Actor TTPs & AI Usage:
- **Midnight Blizzard (APT29)**: Utilized AI models to automate C++ / C# code obfuscation, renaming variable symbols and inserting polymorphic code blocks to bypass static signature detection.
- **China-Nexus Actors**: Conducted automated multi-lingual spear-phishing generation tailored to defense contractor personnel.

#### 2. Provenance & Confidence Scoring:
- **Confidence Rating**: **85% (High)** — Verified via Anthropic API audit logs and correlated with CISA / Microsoft threat intelligence indicators.`,
    tags: ['Anthropic', 'Claude', 'MidnightBlizzard', 'APT29', 'AI_Security', 'MalwareObfuscation', 'ThreatIntel'],
  },
  {
    id: 'osint-zscaler-cve-2026-31431-and-mapp-protection',
    source: 'Zscaler Security Advisories & Zscaler Trust Portal',
    url: 'https://www.zscaler.com/security-advisories',
    title: '🛡️ ZSCALER THREAT GRAPH & ADVISORY: CVE-2026-31431 (Kernel LPE) & Dual Relationship Graph Architecture',
    category: 'ADVISORY',
    severity: 'HIGH',
    summary: 'Zscaler Security Advisory covering Linux Kernel LPE (CVE-2026-31431) affecting ZPA App Connector/PSE/PCC/ZTB (ZIA Not Impacted) and proactive MAPP protection for Microsoft Windows September 2026 CVEs. Defines CyberMind OS dual-relationship graph ontology (AFFECTS vs PROTECTED_BY).',
    contentSnippet: `ZSCALER SECURITY ADVISORIES & DUAL RELATIONSHIP ARCHITECTURE:
1. Zscaler Infrastructure Vulnerability:
   - CVE-2026-31431: Linux kernel Local Privilege Escalation (kernel >=4.14)
   - Status: Patched/Mitigated across Zscaler Cloud nodes.
   - Affected Components: ZPA App Connector, Network Connector, Private Service Edge (PSE), Private Cloud Controller (PCC), Zero Trust Branch (ZTB).
   - Unaffected: ZIA (Zscaler Internet Access) distributed products.

2. Zscaler Protective Coverage (MAPP Program):
   - CVE-2026-69779 (Windows Remote Code Execution)
   - CVE-2026-69274 (Windows RPC Privilege Escalation)
   - CVE-2026-68876 (Windows MSHTML Info Disclosure)
   - CVE-2026-68846 (SmartScreen Security Bypass)
   - Zscaler Role: Proactive protection deployed across ZIA/ZPA inline IPS & Sandbox.

3. CyberMind Threat Graph Ontology:
   - Vulnerability -- AFFECTS --> Target Product / Infrastructure Component
   - Vulnerability -- PROTECTED_BY --> Security Platform / Inline IPS Vendor
   - Distinguishes 'Zscaler HAS CVE-2026-31431' from 'Zscaler PROTECTS AGAINST Microsoft CVE-2026-69779'.`,
    trainingPrompt: 'Explain the dual-relationship model in CyberMind Threat Graph for Zscaler Security Advisories (CVE-2026-31431 vs MAPP Windows CVE protections).',
    trainingCompletion: `### 🛡️ Zscaler Security Advisories & Dual Relationship Threat Graph

#### 1. Zscaler Infrastructure Advisory (CVE-2026-31431):
- **Vulnerability**: Linux Kernel Local Privilege Escalation (LPE) affecting kernel 4.14+.
- **Component Impact**:
  - **AFFECTS**: ZPA App Connector, Network Connector, PSE, PCC, ZTB (Patched/Mitigated).
  - **NOT IMPACTED**: Zscaler Internet Access (ZIA) distributed products.

#### 2. Protective Coverage (Microsoft MAPP Program):
- **Vendor Protection**: Zscaler provides proactive inline block signatures for Windows September 2026 CVEs (CVE-2026-69779, CVE-2026-69274, CVE-2026-68876, CVE-2026-68846).

#### 3. Dual Relationship Graph Rules:
- **Rule 1 (AFFECTS)**: Use 'AFFECTS' when a vulnerability resides in the vendor product code.
- **Rule 2 (PROTECTED_BY)**: Use 'PROTECTED_BY' when a security vendor delivers inline inspection/mitigation for a third-party product.`,
    tags: ['Zscaler', 'SecurityAdvisory', 'CVE-2026-31431', 'ZPA', 'PSE', 'ZTB', 'MAPP', 'ThreatGraph', 'DualRelationship'],
  },
  {
    id: 'osint-claude-ai-agent-cyberattacks-2026',
    source: 'CyberMind Threat Intelligence & Google Share',
    url: 'https://share.google/L2u2sNbqLhseTkQPs',
    title: '🤖 CRITICAL AI THREAT INTEL: Hackers Use Claude AI Agents to Automate Cyberattacks, Develop Zero-Days and Evade Detection',
    category: 'RESEARCH',
    severity: 'CRITICAL',
    summary: 'Threat research reveals adversary exploitation of Claude AI Agents (Anthropic Claude 3.5 Sonnet / Claude Code / API agentic loops) to fully automate multi-stage cyberattacks, discover Zero-Day software vulnerabilities, generate polymorphic malware, and evade traditional EDR/XDR detection engines.',
    contentSnippet: `CLAUDE AI AGENT CYBERATTACK AUTOMATION REPORT:
- Threat Objective: Fully automated kill-chain execution using Anthropic Claude AI Agents.
- Capabilities Demonstrated:
  1. Automated Zero-Day Discovery: LLM agent loops fuzzing, analyzing source code repositories, and generating working exploit primitives for zero-day vulnerabilities in under hours.
  2. Autonomous Cyberattack Automation: Agents execute command-and-control (C2) flows, network scanning, credential harvesting, and privilege escalation without human intervention.
  3. EDR & XDR Evasion: Dynamic refactoring of exploit payloads using natural language instructions, bypassing static signatures and behavior heuristics.
- ATT&CK & ATLAS Mapping:
  - MITRE ATLAS AML.T0054 (LLM Prompt Injection & Jailbreaking)
  - MITRE ATLAS AML.T0040 (AI Agent Tool Hijacking)
  - MITRE ATT&CK T1059 (Command & Scripting Interpreter)
  - MITRE ATT&CK T1027 (Obfuscated/Encrypted Files or Information)
  - MITRE ATT&CK T1562 (Impair Defenses / EDR Evasion)
- Mitigation: AI Agent API monitoring, strict tool execution sandboxing, behavior-based SOC alerts for agentic API calls.`,
    trainingPrompt: 'Detail how hackers utilize Claude AI Agents to automate cyberattacks, develop zero-days, and evade EDR detection, and outline SOC defensive countermeasures.',
    trainingCompletion: `### 🤖 Critical Threat Report: Hacker Exploitation of Claude AI Agents for Automated Attacks & Zero-Day Discovery

#### 1. Threat Overview & Technical Vector:
Modern adversary groups have evolved from using LLMs for simple code completion to constructing **autonomous AI agent loops** (powered by Claude 3.5 Sonnet, Claude API, and agentic CLI tools). These agents execute complex cyberattacks end-to-end:
- **Zero-Day Development**: AI agents continuously review open-source & enterprise code bases, construct AST parsers, discover unpatched buffer overflows and RCE vulnerabilities, and author zero-day PoCs.
- **Automated Kill Chain Execution**: Agents autonomously map networks, run port scans, harvest credentials from memory, and pivot across subnets.
- **EDR & Security Evasion**: Agents rewrite malware source code in real time (polymorphic generation), obfuscate API calls, and adjust execution speed to stay below EDR/SIEM anomaly thresholds.

#### 2. MITRE ATT&CK & ATLAS Mapping:
| Framework | Technique ID | Technique Name | Technical Details |
| :--- | :--- | :--- | :--- |
| **MITRE ATLAS** | \`AML.T0054\` | LLM Prompt Injection / Jailbreak | Bypassing safety filters to extract exploit payloads. |
| **MITRE ATLAS** | \`AML.T0040\` | AI Agent Tool Hijacking | Tricking agents into executing arbitrary system commands. |
| **MITRE ATT&CK** | \`T1027\` | Polymorphic Obfuscation | AI agent refactoring code to invalidate YARA/EDR signatures. |
| **MITRE ATT&CK** | \`T1562\` | Impair Defenses | AI agents detecting EDR drivers and altering execution paths. |

#### 3. Defensive Countermeasures for SOC & Security Teams:
1. **AI API Telemetry Monitoring**: Audit corporate AI API usage for anomalous prompt structures involving exploit generation, shell injection, or zero-day discovery keywords.
2. **Strict Agentic Sandboxing**: Enforce isolated container environments with network egress restrictions for all developer AI coding agents.
3. **Behavioral EDR & Process Auditing**: Shift detection logic from static file hashes to runtime process tree anomalies (e.g., non-standard subprocesses spawned by node/python AI runtimes).`,
    tags: ['Claude', 'AIAgents', 'ZeroDay', 'CyberattackAutomation', 'EDREvasion', 'Anthropic', 'MITRE_ATLAS', 'ThreatIntel'],
  },
  {
    id: 'osint-master-16-cybersecurity-domains-guide',
    source: 'CyberMind OS Master Architectural Matrix',
    url: 'https://cybermind.local/architecture/16-domains',
    title: '🌐 MASTER CYBERSECURITY MATRIX: Complete Architectural Reference Across All 16 Security Domains',
    category: 'RESEARCH',
    severity: 'CRITICAL',
    summary: 'Comprehensive 16-domain cybersecurity architectural knowledge framework covering SOC Operations, NOC & Network Security, Cloud Security, Zero Trust, Vulnerability Management, CTI & OSINT, DFIR, Malware Analysis, AppSec & DevSecOps, IAM, Endpoint/Email Sec, OT/ICS SCADA, GRC, Cryptography, AI Security, and Detection Engineering.',
    contentSnippet: `CYBERMIND OS 16-DOMAIN CYBERSECURITY KNOWLEDGE MATRIX:
1. SOC & Security Operations: SIEM (Splunk, Sentinel), EDR/XDR (CrowdStrike, Defender for Endpoint), SOAR Playbooks, Alert Triage, Log Parsing (KQL, SPL).
2. NOC & Network Security: Perimeter Firewalls (FortiGate, Palo Alto, Cisco, Check Point), BGP/OSPF Routing, IPsec/SSL VPN, DNS Security, Wireshark PCAP Inspection.
3. Cloud Security: AWS, Azure, GCP, CSPM (Wiz, Prisma Cloud), CWPP, Kubernetes & Docker Container Hardening, IAM Policies, Terraform Guardrails.
4. Zero Trust & Edge Security: Zscaler ZIA, ZPA, ZDX, ZCC, SWG, CASB, SASE, Identity-Centric Access, Microsegmentation.
5. Vulnerability Management: CVE Analysis, CVSS v3.1/v4.0 Metrics, CISA KEV Exploited Vulnerability Prioritization, Patch Deployment, SLA Remediation.
6. Threat Intelligence & OSINT: STIX 2.1 / TAXII, Shodan, Censys, VirusTotal, AbuseIPDB, AlienVault OTX, MITRE ATT&CK & ATLAS Framework Mapping.
7. Digital Forensics & Incident Response (DFIR): NIST SP 800-61 Lifecycle (PICERL), Volatility Memory Analysis, Autopsy Disk Forensics, Root Cause Timeline.
8. Malware Analysis & Reverse Engineering: Static & Dynamic Sandbox Analysis, YARA Rule Writing, Sigma Rules, Obfuscation & De-packaging.
9. Application Security & DevSecOps: OWASP Top 10 (Web, API, LLM), SAST/DAST/SCA Tools, Secure Code Review, CI/CD Pipeline Enforcement.
10. Identity & Access Management (IAM): Active Directory / Entra ID, Kerberos, NTLM, SAML 2.0, OAuth 2.0, SCIM, MFA, Privileged Access Management (PAM).
11. Email & Endpoint Security: SPF, DKIM, DMARC Authentication, Anti-Phishing Ingest, DLP Data Loss Prevention, CIS Hardening Benchmarks.
12. OT / ICS / SCADA Security: Purdue Model (Levels 0-5), Modbus, DNP3, IEC 60870-5-104, Industrial Firewall Segmentation, Air-Gapped Network Sec.
13. Governance, Risk & Compliance (GRC): ISO 27001:2022, NIST CSF 2.0, NIST SP 800-53 Rev 5, SOC 2 Type II, PCI-DSS v4.0, GDPR Data Privacy.
14. Cryptography & Security Engineering: Public Key Infrastructure (PKI), TLS 1.3, IPsec, Hardware Security Modules (HSM), Post-Quantum Cryptography (PQC).
15. Artificial Intelligence Security: MITRE ATLAS, OWASP Top 10 for LLMs, Adversarial Prompt Injection Defense, Model Poisoning, AI Agent Telemetry Audit.
16. Detection Engineering & Threat Hunting: Custom YARA, Sigma, Snort, Suricata Rule Authoring, KQL/SPL Threat Hunting Queries, Hypothesis Hunting.`,
    trainingPrompt: 'Provide a complete architectural response covering all 16 cybersecurity domains and explain how CyberMind OS integrates cross-domain intelligence.',
    trainingCompletion: `### 🌐 CyberMind OS Master Cybersecurity Architectural Matrix (16 Domains)

#### 1. Domain Coverage & Technical Scope:
CyberMind AI provides end-to-end diagnostic, troubleshooting, and engineering capabilities across all 16 cybersecurity domains:
- **SOC & SIEM/EDR**: Triage alerts, author KQL/SPL queries, and execute incident response playbooks.
- **NOC & Network Security**: Configure FortiGate, Palo Alto, Cisco, and Check Point firewalls; analyze PCAPs; optimize VPN/SD-WAN.
- **Cloud & Container Security**: Enforce CSPM/CWPP controls on AWS/Azure/GCP and harden Docker/Kubernetes clusters.
- **Zero Trust Architecture**: Deploy Zscaler ZIA, ZPA, ZDX, and ZCC with granular access policies and SAML/SCIM identity.
- **Vulnerability Management**: Correlate NIST NVD CVEs with CISA KEV active exploitation lists and enforce patching SLAs.
- **Threat Intelligence & OSINT**: Parse STIX 2.1 feeds and leverage Shodan, Censys, VirusTotal, and AbuseIPDB for passive recon.
- **Digital Forensics & IR**: Execute NIST SP 800-61 incident handler workflows and analyze Volatility memory artifacts.
- **Malware Analysis & Detection**: Author YARA rules, Sigma detection rules, and Snort signatures for sandbox telemetry.
- **Application Security & DevSecOps**: Remediate OWASP Top 10 (Web/API/LLM) vulnerabilities and secure CI/CD pipelines.
- **Identity & Access Management**: Secure Active Directory, Entra ID, Kerberos, SAML 2.0, OAuth 2.0, and PAM solutions.
- **Email & Endpoint Security**: Implement DMARC/DKIM/SPF, DLP policies, and CIS Benchmark host hardening.
- **OT/ICS/SCADA Security**: Enforce Purdue Model network segmentation and secure Modbus/DNP3 industrial protocols.
- **Governance, Risk & Compliance**: Align security controls with ISO 27001, NIST CSF 2.0, NIST 800-53, SOC 2, and PCI-DSS v4.0.
- **Cryptography & Security Engineering**: Manage PKI certificate lifecycles, HSMs, TLS 1.3, and Post-Quantum Cryptography transition.
- **AI Security & Threat Defense**: Monitor MITRE ATLAS techniques, defend against prompt injection, and audit AI API agent loops.
- **Detection Engineering & Threat Hunting**: Formulate hypothesis-driven threat hunts and write multi-SIEM detection rules.`,
    tags: ['MasterMatrix', '16Domains', 'SOC', 'NOC', 'CloudSec', 'ZeroTrust', 'DFIR', 'Malware', 'AppSec', 'IAM', 'OT_ICS', 'GRC', 'Cryptography', 'AISecurity', 'DetectionEngineering'],
  },
];



