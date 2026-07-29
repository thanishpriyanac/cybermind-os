import { Injectable, Logger } from '@nestjs/common';
import { CybermindKafkaPublisher } from '../../../../packages/sdk/event-client/src/kafka-publisher';
import { Alert } from '../../../../packages/schemas/src/siem/alert';

const ALERTS_TOPIC = 'siem.alerts';

@Injectable()
export class AlertPublisher {
  private readonly logger = new Logger(AlertPublisher.name);

  constructor(private readonly publisher: CybermindKafkaPublisher) {}

  async publish(alert: Alert): Promise<void> {
    await this.publisher.publish(
      ALERTS_TOPIC,
      'AlertGenerated',
      alert,
      { tenantId: alert.tenantId, correlationId: alert.id }
    );
    this.logger.log(`Published alert ${alert.id} to ${ALERTS_TOPIC}`);
  }
}
