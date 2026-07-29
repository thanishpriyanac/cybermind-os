import { ParsedEvent } from '../../../domain/plugins/connector.plugin';

export class AuthenticationParser {
  // Handles 4624 (Success) and 4625 (Failure)
  parse(rawEvent: any): ParsedEvent {
    const eventId = rawEvent?.Event?.System?.EventID;
    
    // Fallbacks for JSON structures depending on the WEF parser upstream
    const extractedId = typeof eventId === 'object' ? eventId['_text'] : eventId;
    const isSuccess = extractedId === 4624 || extractedId === '4624';

    const eventData = rawEvent?.Event?.EventData?.Data || [];
    // Helper to safely extract Windows XML EventData
    const getField = (name: string) => {
      if (Array.isArray(eventData)) {
        const field = eventData.find(d => d['_attributes']?.Name === name);
        return field ? field['_text'] : undefined;
      }
      return eventData[name]; // If JSON is already flattened
    };

    const targetUser = getField('TargetUserName') || 'UNKNOWN';
    const targetDomain = getField('TargetDomainName') || 'UNKNOWN';
    const ipAddress = getField('IpAddress');
    const computer = rawEvent?.Event?.System?.Computer || rawEvent?.Computer || 'UNKNOWN';

    return {
      originalPayload: rawEvent,
      extractedFields: {
        eventId: extractedId,
        category: 'AUTHENTICATION',
        action: isSuccess ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
        targetUser,
        targetDomain,
        ipAddress,
      },
      hostname: typeof computer === 'object' ? computer['_text'] : computer,
      ipAddress: typeof ipAddress === 'object' ? ipAddress['_text'] : ipAddress,
      assetResolved: false,
    };
  }
}
