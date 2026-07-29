import { ParsedEvent } from '../../../domain/plugins/connector.plugin';

export class ProcessParser {
  // Handles 4688
  parse(rawEvent: any): ParsedEvent {
    const eventData = rawEvent?.Event?.EventData?.Data || [];
    const getField = (name: string) => {
      if (Array.isArray(eventData)) {
        const field = eventData.find(d => d['_attributes']?.Name === name);
        return field ? field['_text'] : undefined;
      }
      return eventData[name];
    };

    const newProcessName = getField('NewProcessName') || 'UNKNOWN';
    const commandLine = getField('CommandLine');
    const subjectUser = getField('SubjectUserName') || 'UNKNOWN';
    const computer = rawEvent?.Event?.System?.Computer || rawEvent?.Computer || 'UNKNOWN';

    return {
      originalPayload: rawEvent,
      extractedFields: {
        eventId: 4688,
        category: 'PROCESS',
        action: 'PROCESS_CREATED',
        processName: newProcessName,
        commandLine,
        user: subjectUser,
      },
      hostname: typeof computer === 'object' ? computer['_text'] : computer,
      assetResolved: false,
    };
  }
}
