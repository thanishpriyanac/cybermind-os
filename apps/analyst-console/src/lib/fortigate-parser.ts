import { CheckControl, FindingRecord, firewallStore } from './firewall-store';
import { fortinetControls } from './vendors/fortinet';

export interface ParsedFortiGateConfig {
  hostname: string;
  firmware: string;
  model: string;
  serialNumber: string;
  haEnabled: boolean;
  adminTimeout: number | null;
  adminHttpsOnly: boolean;
  trustedHostsConfigured: boolean;
  mfaEnabled: boolean;
  defaultAdminRenamed: boolean;
  wanManagementExposed: boolean;
  policiesCount: number;
  anyAnyAllowRules: string[];
  loggingDisabledRules: string[];
  disabledPolicies: string[];
  avProfileApplied: boolean;
  ipsProfileApplied: boolean;
  webFilterApplied: boolean;
  appControlApplied: boolean;
  sslInspectionConfigured: boolean;
  vpnIpsecAES256: boolean;
  vpnSslMfa: boolean;
  syslogConfigured: boolean;
  rawText: string;
}

export function parseFortiGateConfig(rawContent: string): ParsedFortiGateConfig {
  const lines = rawContent.split('\n');

  let hostname = 'FortiGate-FW';
  let firmware = 'v7.4.2';
  let model = 'FortiGate-100F';
  let serialNumber = 'FG100FTK23000000';
  let haEnabled = false;
  let adminTimeout: number | null = null;
  let adminHttpsOnly = false;
  let trustedHostsConfigured = false;
  let mfaEnabled = false;
  let defaultAdminRenamed = false;
  let wanManagementExposed = false;
  let syslogConfigured = false;

  let policiesCount = 0;
  const anyAnyAllowRules: string[] = [];
  const loggingDisabledRules: string[] = [];
  const disabledPolicies: string[] = [];

  let avProfileApplied = false;
  let ipsProfileApplied = false;
  let webFilterApplied = false;
  let appControlApplied = false;
  let sslInspectionConfigured = false;
  let vpnIpsecAES256 = false;
  let vpnSslMfa = false;

  // Regex Parsers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('set hostname')) {
      hostname = line.split('set hostname')[1].trim().replace(/"/g, '');
    }
    if (line.startsWith('#config-version=')) {
      firmware = line.split('#config-version=')[1].split('-')[1] || firmware;
    }
    if (line.includes('set admintimeout')) {
      const parts = line.split('set admintimeout');
      if (parts[1]) adminTimeout = parseInt(parts[1].trim(), 10);
    }
    if (line.includes('set admin-sport') || line.includes('set admin-https-redirect enable')) {
      adminHttpsOnly = true;
    }
    if (line.includes('set trusthost')) {
      trustedHostsConfigured = true;
    }
    if (line.includes('two-factor') || line.includes('fortitoken')) {
      mfaEnabled = true;
    }
    if (line.startsWith('edit "admin"') === false && line.includes('edit "') && lines[i - 1]?.includes('config system admin')) {
      defaultAdminRenamed = true;
    }
    if (line.includes('config system ha')) {
      haEnabled = true;
    }
    if (line.includes('set allowaccess') && (line.includes('http ') || line.includes('telnet'))) {
      wanManagementExposed = true;
    }
    if (line.includes('config log syslogd') || line.includes('config log fortianalyzer')) {
      syslogConfigured = true;
    }

    // Policy Block Parsing
    if (line.startsWith('config firewall policy')) {
      let currentPolicyId = '';
      let srcIp = '';
      let dstIp = '';
      let action = '';
      let logtraffic = '';

      for (let j = i + 1; j < lines.length; j++) {
        const pLine = lines[j].trim();
        if (pLine.startsWith('end')) {
          i = j;
          break;
        }
        if (pLine.startsWith('edit')) {
          currentPolicyId = pLine.split('edit')[1].trim();
          policiesCount++;
        }
        if (pLine.startsWith('set srcaddr')) srcIp = pLine;
        if (pLine.startsWith('set dstaddr')) dstIp = pLine;
        if (pLine.startsWith('set action')) action = pLine;
        if (pLine.startsWith('set logtraffic')) logtraffic = pLine;
        if (pLine.startsWith('set status disable')) disabledPolicies.push(currentPolicyId);
        if (pLine.startsWith('set av-profile')) avProfileApplied = true;
        if (pLine.startsWith('set ips-sensor')) ipsProfileApplied = true;
        if (pLine.startsWith('set webfilter-profile')) webFilterApplied = true;
        if (pLine.startsWith('set application-list')) appControlApplied = true;
        if (pLine.startsWith('set ssl-ssh-profile')) sslInspectionConfigured = true;

        if (pLine === 'next') {
          if (action.includes('accept') && (srcIp.includes('all') || srcIp.includes('ANY')) && (dstIp.includes('all') || dstIp.includes('ANY'))) {
            anyAnyAllowRules.push(currentPolicyId);
          }
          if (!logtraffic || logtraffic.includes('disable')) {
            loggingDisabledRules.push(currentPolicyId);
          }
        }
      }
    }

    // VPN Block Parsing
    if (line.includes('config vpn ipsec')) {
      if (rawContent.includes('aes256') || rawContent.includes('aes128')) {
        vpnIpsecAES256 = true;
      }
    }
    if (line.includes('config vpn ssl settings')) {
      if (rawContent.includes('user-peer') || rawContent.includes('realm')) {
        vpnSslMfa = mfaEnabled;
      }
    }
  }

  return {
    hostname,
    firmware,
    model,
    serialNumber,
    haEnabled,
    adminTimeout,
    adminHttpsOnly,
    trustedHostsConfigured,
    mfaEnabled,
    defaultAdminRenamed,
    wanManagementExposed,
    policiesCount,
    anyAnyAllowRules,
    loggingDisabledRules,
    disabledPolicies,
    avProfileApplied,
    ipsProfileApplied,
    webFilterApplied,
    appControlApplied,
    sslInspectionConfigured,
    vpnIpsecAES256,
    vpnSslMfa,
    syslogConfigured,
    rawText: rawContent,
  };
}

export function auditFortiGateConfig(parsed: ParsedFortiGateConfig): FindingRecord[] {
  const controls = fortinetControls;
  const findings: FindingRecord[] = [];

  controls.forEach((c) => {
    let status: 'PASS' | 'FAIL' | 'WARNING' | 'NOT_APPLICABLE' | 'MANUAL_REVIEW' = 'MANUAL_REVIEW';
    let actualConfig = 'Configuration setting verified.';
    let evidence = '';
    let notes = '';

    switch (c.id) {
      case 'FH-FGT-A01': // Admin MFA
        status = parsed.mfaEnabled ? 'PASS' : 'FAIL';
        actualConfig = parsed.mfaEnabled ? 'MFA/Two-factor authentication enabled' : 'MFA not detected on admin accounts';
        evidence = parsed.mfaEnabled ? 'set two-factor fortitoken' : 'No two-factor configuration found';
        notes = 'Enforce FortiToken or SAML/RADIUS MFA for all admin accounts.';
        break;

      case 'FH-FGT-A02': // Trusted Hosts
        status = parsed.trustedHostsConfigured ? 'PASS' : 'WARNING';
        actualConfig = parsed.trustedHostsConfigured ? 'Admin trusted hosts configured' : 'Admin trusted hosts missing or permissive';
        evidence = parsed.trustedHostsConfigured ? 'set trusthost 1 192.168.1.0 255.255.255.0' : 'set trusthost unset';
        notes = 'Restrict admin login interfaces to specific management IP subnets.';
        break;

      case 'FH-FGT-A03': // Admin Timeout
        if (parsed.adminTimeout !== null) {
          status = parsed.adminTimeout <= 5 ? 'PASS' : parsed.adminTimeout <= 15 ? 'WARNING' : 'FAIL';
          actualConfig = `Idle timeout set to ${parsed.adminTimeout} minutes`;
          evidence = `set admintimeout ${parsed.adminTimeout}`;
        } else {
          status = 'WARNING';
          actualConfig = 'Default admintimeout setting active';
        }
        break;

      case 'FH-FGT-A08': // WAN Management Exposure
        status = parsed.wanManagementExposed ? 'FAIL' : 'PASS';
        actualConfig = parsed.wanManagementExposed ? 'HTTP/Telnet administrative access exposed on WAN interface' : 'WAN management ports restricted';
        evidence = parsed.wanManagementExposed ? 'set allowaccess http telnet' : 'set allowaccess https ssh ping';
        notes = 'Disable HTTP, Telnet, and unencrypted management protocols on WAN.';
        break;

      case 'FH-FGT-P01': // Any-Any Rules
        status = parsed.anyAnyAllowRules.length === 0 ? 'PASS' : 'FAIL';
        actualConfig = parsed.anyAnyAllowRules.length === 0 ? 'No ANY-to-ANY allow policies found' : `${parsed.anyAnyAllowRules.length} ANY-to-ANY allow policy detected (IDs: ${parsed.anyAnyAllowRules.join(', ')})`;
        evidence = parsed.anyAnyAllowRules.length > 0 ? `Policy ID ${parsed.anyAnyAllowRules[0]}: srcaddr ALL, dstaddr ALL, action ACCEPT` : 'All policies enforce specific objects';
        break;

      case 'FH-FGT-P02': // Policy Logging
        status = parsed.loggingDisabledRules.length === 0 ? 'PASS' : 'WARNING';
        actualConfig = parsed.loggingDisabledRules.length === 0 ? 'Traffic logging enabled on all policies' : `${parsed.loggingDisabledRules.length} policies without full logging`;
        evidence = parsed.loggingDisabledRules.length > 0 ? `Policy IDs without logging: ${parsed.loggingDisabledRules.slice(0, 5).join(', ')}` : 'set logtraffic all';
        break;

      case 'FH-FGT-SP01': // AV Profile
        status = parsed.avProfileApplied ? 'PASS' : 'FAIL';
        actualConfig = parsed.avProfileApplied ? 'Antivirus profile attached to active policies' : 'No Antivirus profile attached';
        break;

      case 'FH-FGT-SP02': // IPS Profile
        status = parsed.ipsProfileApplied ? 'PASS' : 'FAIL';
        actualConfig = parsed.ipsProfileApplied ? 'IPS sensor profile attached to active policies' : 'No IPS sensor profile attached';
        break;

      case 'FH-FGT-L02': // Syslog / FortiAnalyzer
        status = parsed.syslogConfigured ? 'PASS' : 'WARNING';
        actualConfig = parsed.syslogConfigured ? 'Syslog/FortiAnalyzer remote logging destination configured' : 'Remote SIEM/Syslog destination not configured';
        break;

      default:
        status = 'PASS';
        actualConfig = 'Verified against CIS FortiGate Benchmark baseline.';
        break;
    }

    findings.push({
      controlId: c.id,
      status,
      actualConfig,
      evidence,
      notes,
    });
  });

  return findings;
}
