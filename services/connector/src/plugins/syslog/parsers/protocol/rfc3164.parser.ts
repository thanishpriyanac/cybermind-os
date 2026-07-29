import { StructuredSyslog } from '../../structured-syslog.interface';

export class RFC3164Parser {
  // Very simplistic MVP regex for <PRI>TIMESTAMP HOSTNAME TAG: MSG
  private readonly regex = /^<(\d+)>([A-Z][a-z]{2}\s+\d+\s\d+:\d+:\d+)\s+([a-zA-Z0-9_\-\.]+)\s+([^:]+):\s+(.*)$/;

  parse(raw: string): StructuredSyslog | null {
    const match = raw.match(this.regex);
    if (!match) return null;

    const prival = parseInt(match[1], 10);
    const facility = Math.floor(prival / 8);
    const severity = prival % 8;

    return {
      rawPayload: raw,
      facility,
      severity,
      timestamp: match[2],
      hostname: match[3],
      appName: match[4].replace(/\[\d+\]$/, ''), // strip pid
      message: match[5],
    };
  }
}
