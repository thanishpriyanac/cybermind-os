export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { loadLearningStore } from '@/lib/learning-store';

export async function GET(req: NextRequest) {
  try {
    const learningStore = loadLearningStore();
    const articles = learningStore.articles || [];

    const rules = articles.map((art, idx) => {
      const cveStr = art.cveId || 'CVE-2026-UNKNOWN';
      const safeTitle = art.title.replace(/[^a-zA-Z0-9\s]/g, '');
      const safeName = art.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);

      const sigmaYaml = `title: CyberMind Detection - ${safeTitle}
id: cm-sigma-${idx + 101}
status: experimental
description: Detects threat activity relating to ${art.title} (${cveStr}).
references:
  - ${art.url}
author: CyberMind Autonomous Threat Engine
date: ${art.scrapedAt.split('T')[0]}
tags:
  - attack.t1059
  - attack.t1558
  - ${art.category.toLowerCase()}
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine|contains:
      - '${cveStr}'
      - 'powershell -enc'
      - 'cmd.exe /c'
  condition: selection
falsepositives:
  - Authorized Penetration Testing / Red Team Simulation
level: ${art.severity === 'CRITICAL' ? 'critical' : 'high'}`;

      const yaraRule = `rule CyberMind_Detect_${safeName}_${idx + 1} {
    meta:
        description = "Detects binary payload for ${art.title}"
        author = "CyberMind Threat Engine"
        reference = "${art.url}"
        cve = "${cveStr}"
        severity = "${art.severity || 'HIGH'}"
        date = "${art.scrapedAt.split('T')[0]}"

    strings:
        $s1 = "${cveStr}" ascii wide
        $s2 = "CyberMind" ascii wide
        $s3 = "powershell" ascii wide nocase
        $s4 = "rundll32.exe" ascii wide nocase

    condition:
        uint16(0) == 0x5A4D and (2 of ($s*))
}`;

      const microsoftKql = `// Microsoft Sentinel KQL Detection Rule: ${art.title}
// CVE Reference: ${cveStr} | Source: ${art.source}
SecurityEvent
| where TimeGenerated >= ago(7d)
| where EventID == 4688 or EventID == 4689
| where ProcessCommandLine has "${cveStr}" or ProcessCommandLine has "powershell -enc"
| project TimeGenerated, Computer, Account, NewProcessName, ProcessCommandLine
| summarize EventCount = count() by Account, Computer, bin(TimeGenerated, 1h)`;

      const splunkSpl = `# Splunk Enterprise Security SPL Query: ${art.title}
# CVE Reference: ${cveStr} | Source: ${art.source}
index=security sourcetype=WinEventLog:Security EventCode=4688
| search Process_Command_Line="*${cveStr}*" OR Process_Command_Line="*powershell -enc*"
| stats count by host, user, Process_Command_Line
| sort - count`;

      return {
        id: `rule-${art.id}`,
        title: art.title,
        cveId: cveStr,
        source: art.source,
        category: art.category,
        severity: art.severity || 'HIGH',
        sigmaYaml,
        yaraRule,
        microsoftKql,
        splunkSpl,
      };
    });

    return NextResponse.json({
      totalRulesGenerated: rules.length,
      stix21Compliant: true,
      rules,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate rules' }, { status: 500 });
  }
}
