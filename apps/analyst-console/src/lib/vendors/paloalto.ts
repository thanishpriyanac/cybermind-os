import { CheckControl } from '../firewall-store';

export const paloaltoControls: CheckControl[] = [
  // Administration
  { id: 'FH-PA-A01', category: 'Administration', name: 'Admin MFA enabled', description: 'Ensure multi-factor authentication is required for all administrative access.', expectedConfig: 'set mgt-config authentication profile ...', severity: 'HIGH', reference: 'CIS Palo Alto 1.1' },
  { id: 'FH-PA-A02', category: 'Administration', name: 'Management interface restricted', description: 'Ensure administrative access is restricted to specific trusted IP addresses or subnets.', expectedConfig: 'set deviceconfig system permitted-ip ...', severity: 'HIGH', reference: 'CIS Palo Alto 1.2' },
  { id: 'FH-PA-A03', category: 'Administration', name: 'Idle timeout configured', description: 'Ensure idle administrative sessions are automatically terminated.', expectedConfig: 'set deviceconfig system idle-timeout ...', severity: 'MEDIUM', reference: 'CIS Palo Alto 1.3' },
  { id: 'FH-PA-A04', category: 'Administration', name: 'Strong password profile applied', description: 'Ensure complex password requirements are enforced for administrative accounts.', expectedConfig: 'set mgt-config password-profile ...', severity: 'MEDIUM', reference: 'CIS Palo Alto 1.4' },

  // Security Policies
  { id: 'FH-PA-P01', category: 'Security Policies', name: 'No any/any allow rules', description: 'Ensure there are no overly permissive firewall rules allowing any source to any destination.', expectedConfig: 'Review policies for any/any allow', severity: 'CRITICAL', reference: 'Best Practice' },
  { id: 'FH-PA-P02', category: 'Security Policies', name: 'Log at session end enabled', description: 'Ensure traffic logging is enabled at the end of sessions for accurate volume reporting.', expectedConfig: 'set rulebase security rules ... log-end yes', severity: 'HIGH', reference: 'Best Practice' },
  { id: 'FH-PA-P03', category: 'Security Policies', name: 'Application-based rules utilized', description: 'Ensure App-ID is used instead of service-based rules where possible.', expectedConfig: 'Review policies for App-ID usage', severity: 'HIGH', reference: 'Best Practice' },
  { id: 'FH-PA-P04', category: 'Security Policies', name: 'Interzone default drop', description: 'Ensure the intrazone-default and interzone-default rules are set to drop/deny.', expectedConfig: 'set rulebase default-security-rules ... action deny', severity: 'MEDIUM', reference: 'Best Practice' },

  // Security Profiles
  { id: 'FH-PA-SP01', category: 'Security Profiles', name: 'Antivirus profile applied', description: 'Ensure Antivirus profile is applied to relevant security policies.', expectedConfig: 'set rulebase security rules ... profile-setting group ...', severity: 'HIGH', reference: 'Best Practice' },
  { id: 'FH-PA-SP02', category: 'Security Profiles', name: 'Vulnerability Protection applied', description: 'Ensure Vulnerability Protection (IPS) profile is applied to policies.', expectedConfig: 'set rulebase security rules ... profile-setting group ...', severity: 'HIGH', reference: 'Best Practice' },
  { id: 'FH-PA-SP03', category: 'Security Profiles', name: 'Anti-Spyware applied', description: 'Ensure Anti-Spyware profile is applied, particularly for outbound internet access.', expectedConfig: 'set rulebase security rules ... profile-setting group ...', severity: 'HIGH', reference: 'Best Practice' },
  { id: 'FH-PA-SP04', category: 'Security Profiles', name: 'URL Filtering enabled', description: 'Ensure URL filtering is applied to restrict web access.', expectedConfig: 'set rulebase security rules ... profile-setting group ...', severity: 'MEDIUM', reference: 'Best Practice' },
  { id: 'FH-PA-SP05', category: 'Security Profiles', name: 'WildFire Analysis configured', description: 'Ensure WildFire Analysis profile is applied to analyze unknown files.', expectedConfig: 'set rulebase security rules ... profile-setting group ...', severity: 'MEDIUM', reference: 'Best Practice' },

  // VPN
  { id: 'FH-PA-V01', category: 'VPN', name: 'GlobalProtect MFA enabled', description: 'Ensure GlobalProtect VPN requires MFA.', expectedConfig: 'set global-protect global-protect-portal ...', severity: 'HIGH', reference: 'Best Practice' },
  { id: 'FH-PA-V02', category: 'VPN', name: 'IPsec strong crypto profiles', description: 'Ensure strong encryption algorithms are used for IPsec VPNs.', expectedConfig: 'set network ike crypto-profile ...', severity: 'HIGH', reference: 'Best Practice' },
  { id: 'FH-PA-V03', category: 'VPN', name: 'GlobalProtect split tunnel secure', description: 'Ensure split tunneling is configured securely or disabled.', expectedConfig: 'Review GlobalProtect gateway split tunnel settings', severity: 'MEDIUM', reference: 'Best Practice' },

  // Logging
  { id: 'FH-PA-L01', category: 'Logging', name: 'Log forwarding profile applied', description: 'Ensure log forwarding profiles are applied to all security rules.', expectedConfig: 'set rulebase security rules ... log-setting ...', severity: 'HIGH', reference: 'Best Practice' },
  { id: 'FH-PA-L02', category: 'Logging', name: 'Syslog server configured', description: 'Ensure a Syslog server is configured for log forwarding.', expectedConfig: 'set shared log-settings syslog ...', severity: 'HIGH', reference: 'Best Practice' },
  { id: 'FH-PA-L03', category: 'Logging', name: 'System and Config logs forwarded', description: 'Ensure system and configuration changes are logged and forwarded.', expectedConfig: 'set shared log-settings system ...', severity: 'MEDIUM', reference: 'Best Practice' },
  { id: 'FH-PA-L04', category: 'Logging', name: 'Threat logs forwarded to SIEM', description: 'Ensure threat logs are forwarded to SIEM.', expectedConfig: 'set shared log-settings threat ...', severity: 'MEDIUM', reference: 'Best Practice' },
];
