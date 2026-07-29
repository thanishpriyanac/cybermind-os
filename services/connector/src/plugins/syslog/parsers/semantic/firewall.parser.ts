import { DeviceParser } from './device.parser.interface';
import { StructuredSyslog } from '../../structured-syslog.interface';
import { ParsedEvent } from '../../../../domain/plugins/connector.plugin';

export class FirewallParser implements DeviceParser {
  supports(message: StructuredSyslog): boolean {
    // Check common generic firewall keywords
    return message.message.includes('Connection allowed') || 
           message.message.includes('Connection denied') ||
           message.message.includes('DROP') || 
           message.message.includes('ACCEPT');
  }

  parse(message: StructuredSyslog): ParsedEvent {
    let action = 'UNKNOWN';
    
    if (message.message.includes('allowed') || message.message.includes('ACCEPT')) {
      action = 'CONNECTION_ALLOWED';
    } else if (message.message.includes('denied') || message.message.includes('DROP')) {
      action = 'CONNECTION_BLOCKED';
    }

    // Naive IP extraction
    const srcIpMatch = message.message.match(/SRC=([0-9\.]+)/);
    const dstIpMatch = message.message.match(/DST=([0-9\.]+)/);

    return {
      originalPayload: message.rawPayload,
      extractedFields: {
        category: 'NETWORK',
        action,
        sourceIp: srcIpMatch ? srcIpMatch[1] : undefined,
        destIp: dstIpMatch ? dstIpMatch[1] : undefined,
      },
      hostname: message.hostname,
      ipAddress: srcIpMatch ? srcIpMatch[1] : undefined,
      assetResolved: false,
    };
  }
}
