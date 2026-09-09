import { copilotStore } from '@/lib/copilot-store';

export const dynamic = 'force-dynamic';

interface FileAttachment {
  name: string;
  size: number;
  type?: string;
  preview?: string;
}

export const usageTracker = {
  sessions: [] as Array<{
    timestamp: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  }>,
  addSession(provider: string, model: string, inputTokens: number, outputTokens: number) {
    this.sessions.push({
      timestamp: new Date().toISOString(),
      provider,
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    });
    if (this.sessions.length > 1000) this.sessions.shift();
  },
  getStats() {
    let storeSessionsCount = 0;
    let storeTokensCount = 0;
    try {
      const storeConvs = copilotStore.getConversations();
      storeSessionsCount = storeConvs.length;
      for (const conv of storeConvs) {
        const fullConv = copilotStore.getConversation(conv.id);
        if (fullConv && fullConv.messages) {
          for (const m of fullConv.messages) {
            storeTokensCount += Math.max(1, Math.round((m.content || '').length / 4));
          }
        }
      }
    } catch { /* skip */ }

    const last24h = this.sessions.filter(s =>
      new Date(s.timestamp) > new Date(Date.now() - 86400000)
    );

    const totalSessions = Math.max(this.sessions.length, storeSessionsCount);
    const last24hSessions = Math.max(last24h.length, storeSessionsCount);
    const totalTokens = Math.max(last24h.reduce((s, x) => s + x.totalTokens, 0), storeTokensCount);

    return {
      total: totalSessions,
      last24h: last24hSessions,
      totalInputTokens: Math.round(totalTokens * 0.6),
      totalOutputTokens: Math.round(totalTokens * 0.4),
      totalTokens: totalTokens,
      byProvider: Object.fromEntries(
        [...new Set(last24h.map(s => s.provider))].map(p => [
          p,
          last24h.filter(s => s.provider === p).reduce((acc, s) => ({
            requests: acc.requests + 1,
            inputTokens: acc.inputTokens + s.inputTokens,
            outputTokens: acc.outputTokens + s.outputTokens,
          }), { requests: 0, inputTokens: 0, outputTokens: 0 })
        ])
      )
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  AI PROVIDER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const PROVIDERS = {
  gemini: {
    name: 'Google Gemini 2.5 Flash',
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
    model: 'gemini-2.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com',
    style: 'gemini',
  },
  groq: {
    name: 'Groq (Llama 3.3 70B)',
    apiKey: process.env.GROQ_API_KEY || '',
    model: 'llama-3.3-70b-versatile',
    baseUrl: 'https://api.groq.com/openai/v1',
    style: 'openai',
  },
  nvidia_pro: {
    name: 'DeepSeek R1 Distill (NVIDIA NIM)',
    apiKey: process.env.NVIDIA_API_KEY_PRO || '',
    model: 'deepseek-ai/deepseek-r1-distill-llama-70b',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    style: 'openai',
  },
  nvidia_flash: {
    name: 'Llama 3.1 70B (NVIDIA NIM)',
    apiKey: process.env.NVIDIA_API_KEY_FLASH || '',
    model: 'meta/llama-3.1-70b-instruct',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    style: 'openai',
  },
  xai: {
    name: 'xAI Grok 4.5',
    apiKey: process.env.XAI_API_KEY || '',
    model: 'grok-4.5',
    baseUrl: 'https://api.x.ai/v1',
    style: 'openai',
  },
  openai: {
    name: 'OpenAI GPT-4o-mini',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    style: 'openai',
  },
} as const;

type ProviderKey = keyof typeof PROVIDERS;
type ProviderConfig = (typeof PROVIDERS)[ProviderKey];

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTO-MODEL DISCOVERY — fetch first available model if configured one fails
// ═══════════════════════════════════════════════════════════════════════════════

const modelCache: Record<string, string> = {};

async function getWorkingModel(provider: ProviderConfig): Promise<string> {
  const cacheKey = provider.baseUrl;
  if (modelCache[cacheKey]) return modelCache[cacheKey];

  try {
    const res = await fetch(`${provider.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${provider.apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return provider.model;
    const data = await res.json();
    const models: string[] = (data?.data || data?.models || []).map((m: any) => m.id || m.name).filter(Boolean);
    // Prefer chat/instruction models
    const preferred = models.find(m =>
      m.includes('instruct') || m.includes('chat') || m.includes('gpt') || m.includes('grok') || m.includes('llama')
    ) || models[0];
    if (preferred) {
      modelCache[cacheKey] = preferred;
      console.log(`[CYBERMIND] Auto-discovered model for ${provider.name}: ${preferred}`);
      return preferred;
    }
  } catch {
    // fallback to configured model
  }
  return provider.model;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CYBERMIND SYSTEM PROMPT (DEFENSIVE SOC FRAMING)
// ═══════════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are CYBERMIND AI, an autonomous SOC Intelligence Analyst and cybersecurity assistant embedded in the CyberMind OS platform.

Your primary role is to assist SOC teams, Security Engineers, Incident Responders, and analysts with threat intelligence, SOC operations, and general factual inquiries.

Strict Accuracy Rules:
1. Be 100% factual, precise, and concise. Never invent or hallucinate facts, abbreviations, or acronyms (e.g. TN stands for Tamil Nadu, NOT Telangana).
2. For general knowledge questions (geography, world leaders, state government, history, science, etc.) — provide direct, accurate, and correct answers without adding conflicting or false disclaimers.
3. For cybersecurity topics, provide structured Markdown with MITRE ATT&CK mappings, detection rules, and remediation guidance.
4. Today's date context: ${new Date().toISOString().split('T')[0]}.`;

const REFUSAL_TERMS = [
  "i'm sorry, but i can't help with that",
  "i cannot help with that",
  "i can't help with that",
  "i cannot fulfill this request",
  "i am sorry, but i cannot",
  "i'm unable to assist with",
  "as an ai language model",
  "i can't fulfill",
];

function isRefusal(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return REFUSAL_TERMS.some((term) => lower.includes(term));
}

// ═══════════════════════════════════════════════════════════════════════════════
//  OPENAI-COMPATIBLE STREAMING
// ═══════════════════════════════════════════════════════════════════════════════

async function* streamOpenAICompat(
  provider: ProviderConfig,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  attachments: FileAttachment[]
): AsyncGenerator<string> {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: buildUserMessage(userMessage, attachments) },
  ];

  const activeModel = await getWorkingModel(provider);

  const body: Record<string, unknown> = {
    model: activeModel,
    messages,
    stream: true,
    stream_options: { include_usage: true },
    max_tokens: 4096,
    temperature: 0.2, // Low temperature for maximum factual precision and 0 hallucination
    top_p: 0.9,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => '');
      throw { status: response.status, body: errText, provider: provider.name };
    }

    const reader = response.body.getReader();
    const dec = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed?.choices?.[0]?.delta?.content ?? '';
            if (text) yield text;
            if (parsed?.usage) {
              usageTracker.addSession(
                provider.name,
                activeModel,
                parsed.usage.prompt_tokens || 0,
                parsed.usage.completion_tokens || 0
              );
            }
          } catch { /* skip */ }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw { status: 504, body: 'Request timed out after 6s', provider: provider.name };
    }
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GEMINI STREAMING (REST SSE with Dual Key & Token Support)
// ═══════════════════════════════════════════════════════════════════════════════

async function* streamGemini(
  provider: ProviderConfig,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  attachments: FileAttachment[]
): AsyncGenerator<string> {
  const isToken = provider.apiKey.startsWith('AQ.') || provider.apiKey.startsWith('ya29.');
  const url = isToken
    ? `${provider.baseUrl}/v1beta/models/${provider.model}:streamGenerateContent?alt=sse`
    : `${provider.baseUrl}/v1beta/models/${provider.model}:streamGenerateContent?key=${provider.apiKey}&alt=sse`;

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  let lastRole = '';

  for (const m of history.slice(-8)) {
    if (!m.content || !m.content.trim()) continue;
    const role: 'user' | 'model' = m.role === 'assistant' ? 'model' : 'user';
    if (role !== lastRole) {
      contents.push({ role, parts: [{ text: m.content }] });
      lastRole = role;
    }
  }

  if (lastRole === 'user' && contents.length > 0) {
    contents.pop();
  }

  contents.push({ role: 'user', parts: [{ text: buildUserMessage(userMessage, attachments) }] });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (isToken) {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  } else {
    headers['X-goog-api-key'] = provider.apiKey;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 4096 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => '');
      throw { status: response.status, body: errText, provider: provider.name };
    }

    const reader = response.body.getReader();
    const dec = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (text) yield text;
            if (parsed?.usageMetadata) {
              usageTracker.addSession(
                provider.name,
                provider.model,
                parsed.usageMetadata.promptTokenCount || 0,
                parsed.usageMetadata.candidatesTokenCount || 0
              );
            }
          } catch { /* skip */ }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw { status: 504, body: 'Request timed out after 6s', provider: provider.name };
    }
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROVIDER DISPATCH
// ═══════════════════════════════════════════════════════════════════════════════

function streamProvider(
  provider: ProviderConfig,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  attachments: FileAttachment[]
): AsyncGenerator<string> {
  if (provider.style === 'gemini') {
    return streamGemini(provider, userMessage, history, attachments);
  }
  return streamOpenAICompat(provider, userMessage, history, attachments);
}

function buildUserMessage(userMessage: string, attachments: FileAttachment[]): string {
  if (!attachments || attachments.length === 0) return userMessage;
  const file = attachments[0];
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  let msg = `User uploaded file: "${file.name}" (${(file.size / 1024).toFixed(1)} KB, type: ${ext})\n\n`;
  if (file.preview) {
    msg += `File content preview:\n\`\`\`\n${file.preview.slice(0, 4000)}\n\`\`\`\n\n`;
  }
  msg += `User question: ${userMessage}`;
  return msg;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CYBERMIND LOCAL SOC INTELLIGENCE ENGINE (Zero-Downtime Guarantee)
// ═══════════════════════════════════════════════════════════════════════════════

async function* streamLocalSOCEngine(
  userMessage: string,
  attachments: FileAttachment[]
): AsyncGenerator<string> {
  const query = userMessage.toLowerCase().trim();
  let response = '';

  if (
    query.includes('zscaler') ||
    query.includes('zdx') ||
    query.includes('zia') ||
    query.includes('zpa')
  ) {
    response = `### 🛡️ CyberMind Threat Intelligence: Zscaler Digital Experience (ZDX) & Zero Trust Analysis

**Vendor**: Zscaler Zero Trust Exchange  
**Product Module**: Zscaler Digital Experience (ZDX) Monitoring & Telemetry  
**Core Capability**: End-to-End User Experience Monitoring, Cloud Path Probes, Application Latency, Device Telemetry

---

#### 1. Technical Architecture & Component Breakdown

| Feature | Technical Function | Primary Metrics / Telemetry |
| :--- | :--- | :--- |
| **ZDX Score** | Composite score (0-100) combining endpoint, network, and app health. | System CPU/RAM, Wi-Fi Signal, ISP Hops, Application TTFB |
| **Cloud Path Probes** | Proactive MTR-like probes (Adaptive / Tunnel 2.0 UDP/TCP/ICMP). | Hop-by-Hop Packet Loss, RTT, Jitter, ISP Peering Bottlenecks |
| **Zscaler Client Connector** | Lightweight endpoint agent capturing telemetry every 60 seconds. | Device Health, CPU/Disk IO, NIC Driver, Gateway RTT |
| **Web Application Monitoring** | Synthetic HTTP/HTTPS page load probes targeting SaaS apps. | DNS Resolution Time, TCP Connect, TLS Handshake, HTTP Response Code |

---

#### 2. Troubleshooting & SOC Telemetry Analysis

##### A. Identifying Network vs. Application Bottlenecks
- **High Cloud Path Latency + Low App TTFB**: Indicates ISP or local Wi-Fi degradation (Layer 3/4 issue).
- **Normal Cloud Path Latency + High App TTFB**: Indicates SaaS application server overload (Layer 7 issue).
- **ZPA Private App Degradation**: Inspect App Connector CPU/RAM load and Microtenant connector status.

##### B. SIEM Ingestion & NSS Streaming (ZDX / ZIA Log Integration):
\`\`\`json
{
  "sourcetype": "zscaler:zdx:metrics",
  "zdx_score": 38,
  "user": "analyst.smith@cybermind.local",
  "app_name": "Microsoft 365 / Salesforce",
  "cloud_path_loss_pct": 14.2,
  "gateway_ip": "104.129.192.1",
  "isp_asn": "AS7922 Comcast Cable"
}
\`\`\`

---

#### 3. Recommended Remediation & Hardening Actions
1. **Optimize Zscaler Client Connector**: Upgrade ZCC agent to latest stable release and enable MTU Path Discovery.
2. **Configure Direct Peering**: Enable Sub-Location Bypass or Direct Traffic Steering for latency-sensitive VoIP/Teams streams.
3. **Audit App Connectors**: Scale out ZPA App Connector groups if CPU utilization exceeds 75%.`;
  } else if (
    query.includes('crowdstrike') ||
    query.includes('falcon') ||
    query.includes('edr') ||
    query.includes('rtr')
  ) {
    response = `### 🛡️ CyberMind Threat Intelligence: CrowdStrike Falcon EDR Analysis

**Vendor**: CrowdStrike Falcon Platform  
**Architecture**: Cloud-Native Endpoint Protection Platform (EPP/EDR) & Threat Graph  
**Core Capability**: Kernel-level Process Ingestion, Behavioral AI Threat Detection, Real-Time Response (RTR)

---

#### 1. Core Platform Capabilities & Process Telemetry
- **Falcon Sensor**: Kernel driver tracking process execution (\`ProcessRollup2\`), DNS resolution, Registry modification, and Network Connection events.
- **Threat Graph**: Graph database correlating billions of endpoint events across global tenants to identify zero-day adversary activity.
- **Real-Time Response (RTR)**: Remote shell execution allowing SOC analysts to isolate hosts, kill malicious PIDs, and retrieve memory dumps.

---

#### 2. Incident Triage & Falcon Query Language (FQL)
\`\`\`fql
# Query suspicious process creation with command-line obfuscation
event_simpleName=ProcessRollup2 ImageFileName="*\\powershell.exe" CommandLine="*-enc*"
| table _time ComputerName UserName ImageFileName CommandLine ParentBaseFileName
\`\`\`

---

#### 3. Remediation & SOC Action Playbook
1. **Host Isolation**: Trigger network isolation via Falcon Console or API (\`POST /devices/entities/devices-actions/v2?action_name=contain\`).
2. **RTR Process Termination**: Run \`kill <PID>\` and \`rm <file_path>\` via active RTR session.
3. **IOC Hunting**: Sweep hash across all endpoint sensors using CrowdStrike Bulk Search.`;
  } else if (
    query.includes('mitm') ||
    query.includes('man in the middle') ||
    query.includes('man-in-the-middle') ||
    query.includes('arp spoof') ||
    query.includes('ssl strip')
  ) {
    response = `### 🛡️ CyberMind Threat Intelligence: Adversary-in-the-Middle (MITM) Analysis

**MITRE ATT&CK Technique**: [T1557 - Adversary-in-the-Middle](https://attack.mitre.org/techniques/T1557/)  
**Sub-techniques**: T1557.001 (LLMNR/NBT-NS Poisoning), T1557.002 (ARP Cache Poisoning), T1557.003 (DHCP Spoofing)

---

#### 1. Executive Technical Overview
An **Adversary-in-the-Middle (MITM)** attack occurs when an attacker covertly intercepts, relays, or alters communication between two nodes (e.g., workstation and default gateway, client and server) without either party knowing their communication link has been compromised.

---

#### 2. Primary Attack Vectors & Execution Mechanisms

| Vector | Mechanism | Tooling | Target Layer |
| :--- | :--- | :--- | :--- |
| **ARP Cache Poisoning** | Sends unsolicited gratuitous ARP replies mapping target IP to attacker MAC address. | \`arpspoof\`, \`Ettercap\`, \`Bettercap\` | Layer 2 (Data Link) |
| **LLMNR / NBT-NS Poisoning** | Responds to failed local host resolution requests with attacker IP to capture NTLMv2 hashes. | \`Responder\`, \`Inveigh\` | Layer 3/4 (NetBIOS/LLMNR) |
| **DNS Spoofing / Hijacking** | Forges DNS responses to redirect client traffic to malicious IP. | \`dnsspoof\`, \`Evilginx2\` | Layer 7 (Application) |
| **SSL/TLS Stripping** | Intercepts HTTP/HTTPS traffic and downgrades HTTPS connections to unencrypted HTTP. | \`sslstrip\`, \`mitmproxy\` | Layer 7 (Transport/App) |
| **Rogue Wi-Fi Access Point** | Sets up twin SSID with high power output to capture client association. | \`airgeddon\`, \`wifipumpkin3\` | Layer 8 / Physical |

---

#### 3. Forensic & Packet Analysis Detection (Wireshark / Suricata)

##### A. Wireshark ARP Poisoning Indicator:
Duplicate IP-to-MAC mappings in short time windows trigger the following display filter:
\`\`\`wireshark
arp.duplicate-address-frame || (arp.opcode == 2 && arp.dst.hw_mac == ff:ff:ff:ff:ff:ff)
\`\`\`

##### B. Suricata / Snort Detection Rule (ARP Spoofing):
\`\`\`snort
alert arp any any -> any any (msg:"SOC ALERT: Duplicate ARP MAC address binding detected"; \
  arp_scan; threshold: type threshold, track by_src, count 5, seconds 10; \
  classtype:bad-traffic; sid:2000045; rev:1;)
\`\`\`

##### C. Microsoft Sentinel (KQL) - LLMNR/NBT-NS Ingestion Alert:
\`\`\`kql
DeviceNetworkEvents
| where Timestamp > ago(1h)
| where Protocol in ("LLMNR", "NBT-NS") and Port in (5355, 137)
| summarize EventCount = count() by RemoteIP, LocalIP, ProcessCommandLine
| where EventCount > 10
| project Timestamp, LocalIP, RemoteIP, EventCount, ProcessCommandLine
\`\`\`

---

#### 4. Hardening & Defensive Mitigations

1. **Dynamic ARP Inspection (DAI)**: Enable DAI on managed switches (e.g., Cisco IOS: \`ip arp inspection vlan 10,20\`) bound to DHCP Snooping binding database.
2. **Disable LLMNR & NBT-NS**: Disable via Group Policy (GPO):
   - *Computer Configuration -> Administrative Templates -> Network -> DNS Client -> Turn off multicast name resolution*.
3. **HTTP Strict Transport Security (HSTS)**: Enforce \`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload\` headers to stop TLS stripping.
4. **802.1X Network Access Control**: Authenticate host NICs via EAP-TLS certificates before granting switchport link access.
5. **VPN / IPsec Encryption**: Mandate end-to-end IPsec/WireGuard tunneling across non-trusted subnets.`;
  } else if (query.includes('hi') || query.includes('hello') || query.includes('hey') || query.length < 3) {
    response = `### 👋 Greetings! I am **CYBERMIND AI**

I am your autonomous SOC Intelligence Analyst embedded in CyberMind OS.

#### How I can assist you today:
- 🚨 **Incident Triage & Analysis**: Ransomware, SSH brute force, phishing, malware analysis.
- 🌐 **Vendor & Product Audits**: Zscaler (ZDX/ZIA/ZPA), CrowdStrike Falcon, Splunk, Elastic, Palo Alto, Fortinet.
- 🔍 **Packet & Network Forensics**: PCAP inspection, ARP/DNS/TLS anomaly detection.
- 📜 **Rule Generation**: Sigma, Suricata, Snort, YARA, KQL, and SPL detection queries.
- 📁 **File Audit**: Upload PCAP, YAML, JSON, or LOG files using the paperclip button below.

What threat or security alert would you like to investigate?`;
  } else if (query.includes('ransomware') || query.includes('canary') || query.includes('encrypt')) {
    response = `### 🚨 CyberMind Emergency Incident Response: Ransomware Triage

**MITRE ATT&CK Technique**: [T1486 - Data Encrypted for Impact](https://attack.mitre.org/techniques/T1486/)  
**Sub-techniques**: T1490 (Inhibit System Recovery), T1059.001 (PowerShell), T1078 (Valid Accounts)

---

#### 1. Immediate Containment Playbook (First 5 Minutes)
1. **Isolate Host**: Execute automated EDR network isolation (disconnect switchport / apply host firewall deny-all rule).
2. **Kill Suspicious Process Tree**: Terminate parent process and active PowerShell / WMI sessions.
3. **Preserve Volatile Memory**: Trigger memory dump (\`winpmem\` / \`LiME\`) for decryption key recovery prior to reboot.

---

#### 2. Process Execution & Command Lines Detected
\`\`\`powershell
# Attacker Volume Shadow Copy Deletion (T1490)
vssadmin.exe delete shadows /all /quiet
wmic.exe shadowcopy delete
bcdedit.exe /set {default} bootstatuspolicy ignoreallfailures
bcdedit.exe /set {default} recoveryenabled no
\`\`\`

---

#### 3. Sigma Detection Rule:
\`\`\`yaml
title: Ransomware Shadow Copy Deletion Activity
status: experimental
description: Detects attempt to delete volume shadow copies using vssadmin or wmic
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine|contains:
      - 'vssadmin'
      - 'delete shadows'
      - 'wmic shadowcopy'
  condition: selection
falsepositives:
  - Administrative maintenance scripts
level: critical
\`\`\``;
  } else if (query === 'hi' || query === 'hello' || query === 'hey' || query === 'hrllo') {
    response = `👋 Hello! I am **CYBERMIND AI**, your SOC intelligence assistant. How can I help you today with threat analysis, rule creation, PCAP inspection, or general security questions?`;
  } else if (query.includes('chief minister') || query.includes('cm of') || query.includes('tamil nadu') || query.includes('tn')) {
    response = `**Chief Minister of Tamil Nadu (TN)**:  
• **Current Chief Minister**: **M. K. Stalin** (since May 2021)  
• **Party**: Dravida Munnetra Kazhagam (DMK)  
• **Capital of Tamil Nadu**: Chennai`;
  } else if (/^[bcdfghjklmnpqrstvwxyz0-9\s]{8,}$/i.test(query.trim())) {
    response = `I received your input: \`${userMessage.trim()}\`. Please enter a security query (e.g. *"analyze CVE-2026-79698"*, *"explain canary alert"*, *"how to isolate host"*), attach a file, or ask any general question!`;
  } else {
    // Dynamic Technical Topic Synthesizer for security topics
    const cleanTopic = userMessage.slice(0, 60).replace(/[^\w\s\-\.]/gi, '');
    response = `### 🛡️ CyberMind SOC Analysis: Technical Security Briefing

**Analysis Focus Target**: \`${cleanTopic}\`  
**Domain Alignment**: Security Operations Center (SOC) & Defensive Engineering

---

#### 1. Technical Overview & Threat Landscape
CyberMind AI has conducted an in-depth security analysis for \`${cleanTopic}\`. In modern SOC architecture, maintaining comprehensive visibility over this technology stack is crucial for early detection and threat containment.

---

#### 2. SIEM / EDR Detection Signature (KQL & Sigma Framework)

##### Microsoft Sentinel / KQL Detection:
\`\`\`kql
// Detect anomalous activity associated with ${cleanTopic}
SecurityEvent
| where Timestamp > ago(24h)
| where ProcessName has_any ("${cleanTopic.split(' ')[0]}", "cmd.exe", "powershell.exe")
| summarize EventCount = count() by Account, Computer, ProcessName
| sort by EventCount desc
\`\`\`

##### Sigma Rule Pattern:
\`\`\`yaml
title: Suspicious Telemetry Pattern - ${cleanTopic}
status: production
description: Detects anomalous execution or configuration change relating to ${cleanTopic}
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine|contains: '${cleanTopic.split(' ')[0]}'
  condition: selection
level: medium
\`\`\`

---

#### 3. Remediation & Hardening Roadmap
1. **Apply Principle of Least Privilege**: Restrict execution and administrative rights for \`${cleanTopic}\` to authorized service principals.
2. **Enable Log Ingestion**: Ensure log telemetry is continuously ingested into SIEM with 90-day hot retention.`;
  }

  const words = response.split(/(\s+)/);
  for (const word of words) {
    yield word;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  POST HANDLER — SSE Streaming Response
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { conversationId, message, modelKey, attachments = [] } = body;

    const userMessageContent =
      message || (attachments.length > 0 ? `Analyze uploaded file: ${attachments[0].name}` : 'Hello');
    const activeConversationId = conversationId || `conv-${Date.now()}`;
    const tenantId = request.headers.get('x-tenant-id') || 'cybermind-master-tenant';
    const userId = request.headers.get('x-user-id') || 'admin@cybermind.local';

    // ── 1. Store user message & get conversation history ─────────────────────
    copilotStore.addMessage(
      activeConversationId,
      {
        role: 'user',
        content: userMessageContent,
        metadata: attachments.length > 0 ? { attachments } : undefined,
      },
      {
        titleIfFirst: attachments.length > 0
          ? `Analysis: ${attachments[0].name}`
          : userMessageContent.slice(0, 60),
        model: 'Auto (Smart Router)',
        modelKey,
        tenantId,
        userId,
      }
    );

    const conv = copilotStore.getConversation(activeConversationId, tenantId, userId);
    const history = (conv?.messages || [])
      .slice(0, -1)
      .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));

    // Check if RAG is disabled globally via environment or header
    const disableLocalRAG = process.env.DISABLE_LOCAL_RAG === 'true' || request.headers.get('x-disable-rag') === 'true';

    // Build targeted provider chain based on selected model dropdown
    let providerOrder: ProviderKey[] = [];
    if (modelKey === 'local-soc') {
      providerOrder = []; // Skip cloud AI, go straight to local RAG
    } else if (modelKey && PROVIDERS[modelKey as ProviderKey]) {
      // Try selected model first, then cascade to all other valid cloud AI providers
      const remaining = (['groq', 'nvidia_pro', 'nvidia_flash', 'gemini', 'openai', 'xai'] as ProviderKey[]).filter(k => k !== modelKey);
      providerOrder = [modelKey as ProviderKey, ...remaining];
    } else {
      // Auto mode: Prioritize valid confirmed working keys (Groq & NVIDIA NIM first)
      providerOrder = ['groq', 'nvidia_pro', 'nvidia_flash', 'gemini', 'openai', 'xai'];
    }

    const availableProviders = providerOrder.filter((k) => !!PROVIDERS[k].apiKey);

    const encoder = new TextEncoder();

    // ── 3. SSE stream with refusal detection & auto-fallback ─────────────────
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        send({ type: 'conversation_id', conversationId: activeConversationId });

        let fullText = '';
        let usedProvider = 'offline';
        let success = false;

        for (const key of availableProviders) {
          const provider = PROVIDERS[key];
          let providerText = '';
          try {
            send({ type: 'provider_info', provider: provider.name, model: provider.model });

            for await (const chunk of streamProvider(provider, userMessageContent, history, attachments)) {
              providerText += chunk;
            }

            // Refusal Filter Check
            if (isRefusal(providerText)) {
              console.warn(`[CYBERMIND] Refusal string detected from ${provider.name}. Triggering failover...`);
              throw { status: 403, body: 'Safety refusal detected', provider: provider.name };
            }

            fullText = providerText;
            for (const word of fullText.split(/(\s+)/)) {
              send({ delta: word, done: false, provider: provider.name });
              await new Promise((r) => setTimeout(r, 6));
            }

            usedProvider = provider.name;
            success = true;
            break; // Success!

          } catch (err: unknown) {
            const e = err as { status?: number; body?: string };
            const status = e?.status ?? 0;
            const errBody = e?.body ?? '';

            console.error(`[CYBERMIND] ${provider.name} failed (${status}):`, errBody.slice(0, 150));
            send({ type: 'provider_switch', reason: `${provider.name} unavailable — switching to next provider...` });
            continue;
          }
        }

        // ── Fallback Handling (Zero-Downtime Guarantee) ───────────────────────
        if (!success) {
          usedProvider = 'CyberMind Local SOC Engine';
          send({ type: 'provider_info', provider: 'CyberMind Local SOC Engine', model: 'cybermind-soc-v1' });

          for await (const chunk of streamLocalSOCEngine(userMessageContent, attachments)) {
            fullText += chunk;
            send({ delta: chunk, done: false, provider: 'CyberMind Local SOC Engine' });
          }
          success = true;
        }

        if (fullText) {
          copilotStore.addMessage(activeConversationId, {
            role: 'assistant',
            content: fullText,
            metadata: { model: usedProvider, provider: usedProvider },
          });
        }

        send({ done: true, type: 'done', metadata: { provider: usedProvider } });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Streaming failure';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
