export interface StructuredSyslog {
  rawPayload: string;
  facility: number;
  severity: number;
  version?: number; // Present in 5424
  timestamp?: string;
  hostname?: string;
  appName?: string;
  procId?: string;
  msgId?: string;
  structuredData?: any; // Present in 5424
  message: string;
}
