/**
 * CyberMind OS — Multi-SIEM Detection Translator Module
 * 
 * Translates threat telemetry into 6 security detection formats:
 * 1. Sigma HQ (YAML)
 * 2. Microsoft Sentinel (KQL)
 * 3. Splunk ES (SPL)
 * 4. Elastic Security (EQL)
 * 5. Suricata IDS (Rules)
 * 6. YARAify (File Signatures)
 */

export interface TranslatedRules {
  title: string;
  targetTopic: string;
  sigmaYaml: string;
  microsoftKql: string;
  splunkSpl: string;
  elasticEql: string;
  suricataRule: string;
  yaraRule: string;
}

export function translateThreatToMultiSiem(title: string, indicator: string): TranslatedRules {
  const safeName = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const safeTerm = indicator || 'powershell.exe';

  const sigmaYaml = `title: ${title}
id: ${Date.now()}
status: production
description: Detects threat activity relating to ${title}
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        CommandLine|contains: '${safeTerm}'
    condition: selection
falsepositives:
    - Authorized Administrative Activity
level: high`;

  const microsoftKql = `// Microsoft Sentinel KQL Rule: ${title}
SecurityEvent
| where TimeGenerated > ago(24h)
| where ProcessCommandLine has "${safeTerm}" or EventID == 4688
| summarize EventCount = count() by Computer, Account, ProcessCommandLine
| sort by EventCount desc`;

  const splunkSpl = `# Splunk Enterprise Security SPL Query: ${title}
index=windows sourcetype=WinEventLog:Security EventCode=4688
| search Process_Command_Line="*${safeTerm}*"
| stats count by host, User, Process_Command_Line`;

  const elasticEql = `process where event.type == "start" and process.command_line : "*${safeTerm}*"`;

  const suricataRule = `alert http $HOME_NET any -> $EXTERNAL_NET any (msg:"CYBERMIND Threat Detection: ${title}"; content:"${safeTerm}"; sid:9900001; rev:1;)`;

  const yaraRule = `rule Detect_${safeName} {
    meta:
        description = "Detects binary payload for ${title}"
        author = "CyberMind AI Detection Engine"
        date = "${new Date().toISOString().split('T')[0]}"
    strings:
        $s1 = "${safeTerm}" ascii wide
    condition:
        $s1
}`;

  return {
    title,
    targetTopic: safeTerm,
    sigmaYaml,
    microsoftKql,
    splunkSpl,
    elasticEql,
    suricataRule,
    yaraRule,
  };
}
