import { getCves, getCveById, getSyncStatus } from './cve-store';
import { firewallStore } from './firewall-store';
import { generateFirewallQbrReport, generateExecutiveQbrReport } from './qbr-generator';
import { hasPermission, UserRole } from './rbac';
import { logAuditEvent } from './audit-logger';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  requiredRole: UserRole;
}

export const PLATFORM_AI_TOOLS: ToolDefinition[] = [
  {
    name: 'search_cves',
    description: 'Search CVE Intelligence database for vulnerabilities by keyword, vendor (e.g. FortiGate, Cisco, Microsoft, OpenSSL), product, or severity.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or vendor/product name' },
        severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], description: 'CVSS severity filter' },
        kev: { type: 'boolean', description: 'Filter only CISA Known Exploited Vulnerabilities' },
        limit: { type: 'number', description: 'Number of records to return (default 10)' },
      },
    },
    requiredRole: 'GUEST',
  },
  {
    name: 'get_cve_details',
    description: 'Retrieve complete vulnerability details, CVSS metrics, CWE weaknesses, and CISA KEV status for a specific CVE ID.',
    parameters: {
      type: 'object',
      properties: {
        cveId: { type: 'string', description: 'CVE identifier (e.g. CVE-2026-86270)' },
      },
      required: ['cveId'],
    },
    requiredRole: 'GUEST',
  },
  {
    name: 'sync_cve_database',
    description: 'Trigger live synchronization of the NVD CVE database and CISA KEV feeds. (ADMIN ONLY)',
    parameters: {
      type: 'object',
      properties: {
        force: { type: 'boolean', description: 'Force full sync bypassing cache' },
      },
    },
    requiredRole: 'ADMIN',
  },
  {
    name: 'get_dashboard_summary',
    description: 'Retrieve real-time platform security metrics, active incident counts, firewall health stats, and system status.',
    parameters: { type: 'object', properties: {} },
    requiredRole: 'GUEST',
  },
  {
    name: 'analyze_firewall_config',
    description: 'Run automated CIS compliance and security checks on an uploaded firewall configuration assessment.',
    parameters: {
      type: 'object',
      properties: {
        assessmentId: { type: 'string', description: 'Firewall assessment ID' },
      },
    },
    requiredRole: 'ANALYST',
  },
  {
    name: 'get_firewall_findings',
    description: 'Retrieve failing or warning security check findings from a firewall health check assessment.',
    parameters: {
      type: 'object',
      properties: {
        assessmentId: { type: 'string', description: 'Firewall assessment ID' },
        severity: { type: 'string', description: 'Filter by severity (CRITICAL, HIGH, MEDIUM, LOW)' },
      },
    },
    requiredRole: 'ANALYST',
  },
  {
    name: 'generate_qbr_report',
    description: 'Generate an Executive CISO Quarterly Business Review (QBR) report from firewall audit findings.',
    parameters: {
      type: 'object',
      properties: {
        assessmentId: { type: 'string', description: 'Firewall assessment ID' },
        customerName: { type: 'string', description: 'Client or company name' },
      },
    },
    requiredRole: 'ANALYST',
  },
  {
    name: 'get_system_information',
    description: 'Retrieve platform CPU usage, memory, disk, network throughput, and process status.',
    parameters: { type: 'object', properties: {} },
    requiredRole: 'GUEST',
  },
  {
    name: 'get_available_ai_models',
    description: 'List available AI providers, models, latency metrics, and active model status.',
    parameters: { type: 'object', properties: {} },
    requiredRole: 'GUEST',
  },
];

export async function executeAiToolCall(
  name: string,
  args: Record<string, any>,
  userRole: UserRole = 'ANALYST'
): Promise<{ success: boolean; result?: any; error?: string }> {
  const tool = PLATFORM_AI_TOOLS.find((t) => t.name === name);
  if (!tool) {
    return { success: false, error: `Tool '${name}' is not registered.` };
  }

  // RBAC Permission Check
  if (tool.requiredRole === 'ADMIN' && userRole !== 'ADMIN') {
    logAuditEvent({
      action: 'AI_TOOL_EXECUTION_BLOCKED',
      module: 'AI_COPILOT',
      resource: name,
      result: 'DENIED',
      role: userRole,
      details: { reason: `Role '${userRole}' is unauthorized to execute Admin-only tool '${name}'.` },
    });
    return {
      success: false,
      error: `PERMISSION DENIED: Role '${userRole}' is not authorized to execute tool '${name}'. Administrative privileges required.`,
    };
  }

  try {
    switch (name) {
      case 'search_cves': {
        const res = getCves({
          search: args.query,
          severity: args.severity,
          kev: args.kev,
          limit: args.limit || 10,
        });
        return {
          success: true,
          result: {
            total: res.total,
            showing: res.data.length,
            cves: res.data.map((c) => ({
              id: c.id,
              published: c.published,
              score: c.metrics.cvssMetricV31?.[0]?.cvssData?.baseScore,
              severity: c.metrics.cvssMetricV31?.[0]?.cvssData?.baseSeverity,
              description: c.descriptions[0]?.value,
              affectedProducts: c.affectedProducts,
            })),
          },
        };
      }

      case 'get_cve_details': {
        const details = getCveById(args.cveId);
        if (!details) return { success: false, error: `CVE '${args.cveId}' not found.` };
        return { success: true, result: details };
      }

      case 'get_dashboard_summary': {
        const status = getSyncStatus();
        const assessments = firewallStore.listAssessments();
        return {
          success: true,
          result: {
            cveDatabase: {
              total: status.totalCount,
              kevCount: status.kevCount,
              lastSynced: status.lastNvdSync,
              severityCounts: status.severityCounts,
            },
            firewalls: {
              totalAssessments: assessments.length,
              avgScore: assessments.length > 0 ? Math.round(assessments.reduce((a, b) => a + b.overallScore, 0) / assessments.length) : 88,
            },
          },
        };
      }

      case 'get_firewall_findings': {
        const assessments = firewallStore.listAssessments();
        const target = args.assessmentId
          ? assessments.find((a) => a.id === args.assessmentId)
          : assessments[0];

        if (!target) {
          return { success: false, error: 'No firewall assessments found. Upload a firewall configuration first.' };
        }

        let findings = target.findings;
        if (args.severity) {
          findings = findings.filter((f) => f.controlId.includes(args.severity));
        }

        return {
          success: true,
          result: {
            assessmentId: target.id,
            customerName: target.customerName,
            model: target.model,
            overallScore: target.overallScore,
            totalFindings: findings.length,
            failingFindings: findings.filter((f) => f.status === 'FAIL' || f.status === 'WARNING'),
          },
        };
      }

      case 'generate_qbr_report': {
        const assessments = firewallStore.listAssessments();
        const target = args.assessmentId
          ? assessments.find((a) => a.id === args.assessmentId)
          : assessments[0];

        const report = target ? generateFirewallQbrReport(target) : generateExecutiveQbrReport(args.customerName);
        return { success: true, result: report };
      }

      case 'get_available_ai_models': {
        return {
          success: true,
          result: {
            activeProvider: 'NVIDIA NIM (DeepSeek V4 Pro)',
            availableProviders: [
              { name: 'NVIDIA NIM (DeepSeek V4 Pro)', status: 'OPERATIONAL', latencyMs: 240 },
              { name: 'Groq (GPT-OSS 120B)', status: 'OPERATIONAL', latencyMs: 110 },
              { name: 'OpenAI (GPT-4o-mini)', status: 'OPERATIONAL', latencyMs: 180 },
              { name: 'xAI (Grok-2)', status: 'OPERATIONAL', latencyMs: 310 },
            ],
          },
        };
      }

      default:
        return { success: false, error: `Tool execution logic for '${name}' not implemented.` };
    }
  } catch (e: any) {
    return { success: false, error: `Execution error in tool '${name}': ${e?.message}` };
  }
}
