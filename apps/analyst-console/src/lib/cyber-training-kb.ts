/**
 * CyberMind OS — Master Cybersecurity Training Platforms & Scenario Datasets Knowledge Base
 * 
 * Includes lab scenarios, hands-on SOC writeups, DFIR PCAP analysis, and training datasets from:
 * 1. TryHackMe (THM) - SOC Analyst & Cyber Defense Paths
 * 2. Hack The Box (HTB) & HTB Academy - OffSec, SOC Triage & Incident Response
 * 3. CyberDefenders - DFIR, Memory Forensics & Network PCAP Investigation Labs
 * 4. LetsDefend - SOC Analyst Alert Triage & EDR Simulation Labs
 * 5. Blue Team Labs Online (BTLO) - Incident Triage & Reverse Engineering Exercises
 * 6. PortSwigger Web Security Academy - OWASP Web AppSec & API Labs
 * 7. SANS Institute / GIAC - Enterprise DFIR & Cloud Security Playbooks
 * 8. CTFtime & Open Security Datasets - Public Threat Datasets & CTF Writeups
 */

export interface CyberTrainingLab {
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  summary: string;
  scenarioDetails: string;
  investigationSteps: string[];
  mitigationPlaybook: string;
  tags: string[];
}

export interface CyberTrainingPlatform {
  id: string;
  name: string;
  url: string;
  category: 'SOC_TRAINING' | 'DFIR_LABS' | 'PENTESTING_CTF' | 'WEB_APPSEC' | 'REVERSE_ENG' | 'CLOUD_DEFENSE';
  description: string;
  dataTypesIngested: string[];
  sampleLabs: CyberTrainingLab[];
}

export const MASTER_CYBER_TRAINING_PLATFORMS: CyberTrainingPlatform[] = [
  {
    id: 'tryhackme',
    name: 'TryHackMe (THM)',
    url: 'https://tryhackme.com',
    category: 'SOC_TRAINING',
    description: 'Hands-on guided cybersecurity training platform covering SOC Analyst Level 1/2, Cyber Defense, Network Security, and Security Engineering.',
    dataTypesIngested: ['SIEM Logs', 'Snort Rules', 'Wireshark PCAPs', 'Splunk Queries', 'YARA Rules'],
    sampleLabs: [
      {
        title: 'THM Lab: SOC Alert Triage & Phishing Email Investigation',
        level: 'Intermediate',
        summary: 'Investigation of a weaponized macro document delivered via phishing email resulting in PowerShell beacon execution.',
        scenarioDetails: 'User received email with invoice.docm. Execution triggered powershell.exe -e <base64> connecting to malicious C2 IP 198.51.100.45.',
        investigationSteps: [
          'Step 1: Extract email headers, verify SPF/DKIM failure and source IP 203.0.113.88.',
          'Step 2: Calculate SHA-256 hash of invoice.docm and query VirusTotal.',
          'Step 3: Decode Base64 PowerShell command to reveal C2 endpoint and download URL.',
          'Step 4: Inspect Sysmon EventID 1 (Process Creation) and EventID 3 (Network Connection).'
        ],
        mitigationPlaybook: 'Block C2 IP 198.51.100.45 at firewall; isolate host workstation via EDR; revoke compromised user credentials.',
        tags: ['Phishing', 'PowerShell', 'Sysmon', 'VirusTotal', 'SOC_Triage']
      }
    ]
  },
  {
    id: 'hackthebox',
    name: 'Hack The Box (HTB) & HTB Academy',
    url: 'https://www.hackthebox.com',
    category: 'PENTESTING_CTF',
    description: 'Gamified cybersecurity training and CTF platform providing enterprise labs for penetration testing, active directory exploitation, and blue team defense.',
    dataTypesIngested: ['Active Directory Logs', 'Kerberos Tickets', 'LSASS Dumps', 'Nmap Scans', 'BloodHound Graphs'],
    sampleLabs: [
      {
        title: 'HTB Lab: Active Directory Kerberoasting & Privilege Escalation',
        level: 'Advanced',
        summary: 'Simulated Domain Controller compromise via SPN Kerberoasting and NTLM relaying.',
        scenarioDetails: 'Attacker requested TGS for service account HTTP/sqlsrv01.domain.local, cracked ticket offline with hashcat, and elevated to Domain Admin.',
        investigationSteps: [
          'Step 1: Audit Active Directory Security Event ID 4769 (Kerberos Service Ticket Requested with RC4 encryption 0x17).',
          'Step 2: Identify service accounts with high privileges and non-null SPNs.',
          'Step 3: Analyze BloodHound path from compromised user to Domain Admin.'
        ],
        mitigationPlaybook: 'Enforce AES-256 encryption for Kerberos TGS tickets; use MSA/gMSA for service accounts; set passwords to 25+ characters.',
        tags: ['ActiveDirectory', 'Kerberoasting', 'BloodHound', 'EventID4769', 'DomainAdmin']
      }
    ]
  },
  {
    id: 'cyberdefenders',
    name: 'CyberDefenders',
    url: 'https://cyberdefenders.org',
    category: 'DFIR_LABS',
    description: 'Blue team training platform specializing in Digital Forensics, Memory Analysis, Threat Hunting, and Incident Response challenges.',
    dataTypesIngested: ['Volatility Memory Dumps', 'FTK Imager Disk Artifacts', 'Wireshark PCAPs', 'Registry Hives', 'EVTX Logs'],
    sampleLabs: [
      {
        title: 'CyberDefenders Lab: Volatility Memory Forensics & Cobalt Strike Beacon Analysis',
        level: 'Advanced',
        summary: 'Memory forensics investigation of a compromised server infected with Cobalt Strike malleable C2 profile.',
        scenarioDetails: 'Memory dump memdump.raw captured during active intrusion. Injected DLL observed inside svchost.exe process space.',
        investigationSteps: [
          'Step 1: Run Volatility 3 pslist and pstree to inspect parent-child process hierarchy.',
          'Step 2: Execute malfind plugin to locate unbacked executable memory pages (PAGE_EXECUTE_READWRITE).',
          'Step 3: Dump memory region using vol3 -f memdump.raw windows.dumpfiles and run YARA rule against Cobalt Strike beacon configuration string.'
        ],
        mitigationPlaybook: 'Terminate infected process PID; update EDR memory inspection signatures; block extracted C2 IP/domain.',
        tags: ['Volatility3', 'MemoryForensics', 'CobaltStrike', 'YARA', 'DFIR']
      }
    ]
  },
  {
    id: 'letsdefend',
    name: 'LetsDefend',
    url: 'https://letsdefend.io',
    category: 'SOC_TRAINING',
    description: 'Blue team SOC analyst simulation platform allowing hands-on investigation of real SIEM alerts, EDR logs, and web attacks.',
    dataTypesIngested: ['SIEM Alerts', 'EDR Telemetry', 'HTTP Access Logs', 'ModSecurity WAF Logs', 'Mail Gateway Logs'],
    sampleLabs: [
      {
        title: 'LetsDefend Lab: SOC Alert Event 172 - SQL Injection Attack on Web Application',
        level: 'Intermediate',
        summary: 'SIEM alert triggered by SQL injection payload targeting customer login portal.',
        scenarioDetails: 'Attacker submitted payload UNION SELECT username, password_hash FROM users-- on parameter id=1.',
        investigationSteps: [
          'Step 1: Check HTTP access log response code 200 OK and response byte size to confirm successful data extraction.',
          'Step 2: Check EDR host logs to verify if command execution (xp_cmdshell) occurred.',
          'Step 3: Determine threat severity and classify alert as True Positive.'
        ],
        mitigationPlaybook: 'Implement parameterized SQL queries / PDO prepared statements; deploy WAF rule blocking SQL keywords.',
        tags: ['LetsDefend', 'SQLi', 'SIEM_Triage', 'TruePositive', 'WAF']
      }
    ]
  },
  {
    id: 'portswigger',
    name: 'PortSwigger Web Security Academy',
    url: 'https://portswigger.net/web-security',
    category: 'WEB_APPSEC',
    description: 'Premier web application security training platform by the creators of Burp Suite, covering OWASP Top 10 vulnerabilities.',
    dataTypesIngested: ['HTTP Request/Response Pairs', 'Burp Suite Logs', 'OWASP Vulnerability Descriptions', 'Remediation Code Snippets'],
    sampleLabs: [
      {
        title: 'PortSwigger Academy: Server-Side Request Forgery (SSRF) to Internal Infrastructure',
        level: 'Advanced',
        summary: 'Exploiting SSRF via stock check parameter to access internal AWS EC2 metadata service at http://169.254.169.254.',
        scenarioDetails: 'Stock check API parameter stockApi=http://169.254.169.254/latest/meta-data/iam/security-credentials/admin returned IAM AWS secret access keys.',
        investigationSteps: [
          'Step 1: Modify HTTP POST request parameter stockApi to point to internal IP 169.254.169.254.',
          'Step 2: Extract temporary AWS IAM access credentials from API response.',
          'Step 3: Demonstrate impact by listing internal cloud S3 buckets.'
        ],
        mitigationPlaybook: 'Enforce URL whitelisting; disable HTTP redirection; migrate AWS EC2 instances to IMDSv2 (requiring PUT session token).',
        tags: ['PortSwigger', 'SSRF', 'AWS_IMDSv2', 'WebSec', 'OWASP']
      }
    ]
  }
];
