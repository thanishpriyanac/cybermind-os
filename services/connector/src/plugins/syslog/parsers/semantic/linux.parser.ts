import { DeviceParser } from './device.parser.interface';
import { StructuredSyslog } from '../../structured-syslog.interface';
import { ParsedEvent } from '../../../../domain/plugins/connector.plugin';

export class LinuxParser implements DeviceParser {
  supports(message: StructuredSyslog): boolean {
    return ['sshd', 'sudo', 'su', 'pam_unix'].includes(message.appName || '');
  }

  parse(message: StructuredSyslog): ParsedEvent {
    let action = 'UNKNOWN';
    let targetUser = 'UNKNOWN';
    
    if (message.message.includes('Accepted password') || message.message.includes('session opened')) {
      action = 'LOGIN_SUCCESS';
    } else if (message.message.includes('Failed password') || message.message.includes('authentication failure')) {
      action = 'LOGIN_FAILURE';
    }

    // Rough extraction for MVP
    const userMatch = message.message.match(/for (?:invalid user )?(\w+)/);
    if (userMatch) targetUser = userMatch[1];

    return {
      originalPayload: message.rawPayload,
      extractedFields: {
        category: 'AUTHENTICATION',
        action,
        targetUser,
      },
      hostname: message.hostname,
      assetResolved: false,
    };
  }
}
