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

curl -s "https://crt.sh/?q=%25.${TARGET_DOMAIN}&output=json" | \
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
];
