import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { PrismaService } from '../app/prisma.service';
import { SoarEngine } from '../engine/soar-engine';

@Injectable()
export class AlertConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertConsumer.name);
  private consumer: Consumer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: SoarEngine,
  ) {
    const kafka = new Kafka({
      clientId: 'cybermind-soar',
      brokers: [process.env.KAFKA_BROKER || 'redpanda:29092'],
    });
    this.consumer = kafka.consumer({ groupId: 'soar-trigger-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'siem.alerts', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        try {
          const alert = JSON.parse(message.value.toString());
          await this.handleAlert(alert);
        } catch (e: any) {
          this.logger.error(`Error processing alert: ${e.message}`);
        }
      },
    });
    this.logger.log('Listening for siem.alerts');
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }

  private async handleAlert(alert: any) {
    const tenantId = alert.tenantId;
    if (!tenantId) return;

    // Very naive trigger evaluation: Find enabled playbooks matching the severity
    const playbooks = await this.prisma.playbook.findMany({
      where: { tenantId, status: 'ENABLED', triggerType: 'ALERT' }
    });

    for (const playbook of playbooks) {
      const rule = playbook.triggerRule as any;
      if (!rule) continue;

      let matches = true;
      if (rule.severity && rule.severity !== alert.severity) matches = false;
      if (rule.ruleId && rule.ruleId !== alert.ruleId) matches = false;

      if (matches) {
        this.logger.log(`Alert ${alert.id} triggered Playbook ${playbook.id}`);
        await this.engine.triggerPlaybook(tenantId, playbook.id, 'SYSTEM', { alert });
      }
    }
  }
}
