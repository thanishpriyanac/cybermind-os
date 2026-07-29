import { StructuredSyslog } from '../../structured-syslog.interface';

export class RFC5424Parser {
  // Simplistic MVP regex for <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG
  private readonly regex = /^<(\d+)>(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S|-)\s+(.*)$/;

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
      version: parseInt(match[2], 10),
      timestamp: match[3] === '-' ? undefined : match[3],
      hostname: match[4] === '-' ? undefined : match[4],
      appName: match[5] === '-' ? undefined : match[5],
      procId: match[6] === '-' ? undefined : match[6],
      msgId: match[7] === '-' ? undefined : match[7],
      message: match[9],
    };
  }
}
