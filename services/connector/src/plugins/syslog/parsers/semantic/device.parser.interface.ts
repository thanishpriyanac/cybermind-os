import { StructuredSyslog } from '../../structured-syslog.interface';
import { ParsedEvent } from '../../../../domain/plugins/connector.plugin';

export interface DeviceParser {
  supports(message: StructuredSyslog): boolean;
  parse(message: StructuredSyslog): ParsedEvent;
}
