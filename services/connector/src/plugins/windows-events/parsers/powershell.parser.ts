import { ParsedEvent } from '../../../domain/plugins/connector.plugin';

export class PowerShellParser {
  // Handles 4104
  parse(rawEvent: any): ParsedEvent {
    const eventData = rawEvent?.Event?.EventData?.Data || [];
    const getField = (name: string) => {
      if (Array.isArray(eventData)) {
        const field = eventData.find(d => d['_attributes']?.Name === name);
        return field ? field['_text'] : undefined;
      }
      return eventData[name];
    };

    const scriptBlockText = getField('ScriptBlockText') || 'UNKNOWN';
    const computer = rawEvent?.Event?.System?.Computer || rawEvent?.Computer || 'UNKNOWN';

    return {
      originalPayload: rawEvent,
      extractedFields: {
        eventId: 4104,
        category: 'SCRIPT',
        action: 'POWERSHELL_EXECUTION',
        scriptBlockText,
      },
      hostname: typeof computer === 'object' ? computer['_text'] : computer,
      assetResolved: false,
    };
  }
}
