import { Module, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './app/prisma.service';
import { SoarEngine } from './engine/soar-engine';
import { PlaybookController } from './playbook/playbook.controller';
import { ApprovalController } from './approval/approval.controller';
import { HumanApprovalRunner } from './integrations/human-approval.runner';
import { EmailRunner } from './integrations/email.runner';
import { WebhookRunner } from './integrations/webhook.runner';
import { SlackRunner, TeamsRunner } from './integrations/chat.runner';
import { WaitRunner } from './integrations/wait.runner';
import { JiraRunner, ServiceNowRunner } from './integrations/itsm.runner';
import { AlertConsumer } from './playbook/alert.consumer';

@Module({
  imports: [],
  controllers: [PlaybookController, ApprovalController],
  providers: [
    PrismaService,
    SoarEngine,
    HumanApprovalRunner,
    EmailRunner,
    WebhookRunner,
    SlackRunner,
    TeamsRunner,
    WaitRunner,
    JiraRunner,
    ServiceNowRunner,
    AlertConsumer,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly engine: SoarEngine,
    private readonly humanApproval: HumanApprovalRunner,
    private readonly email: EmailRunner,
    private readonly webhook: WebhookRunner,
    private readonly slack: SlackRunner,
    private readonly teams: TeamsRunner,
    private readonly wait: WaitRunner,
    private readonly jira: JiraRunner,
    private readonly servicenow: ServiceNowRunner,
  ) {}

  onModuleInit() {
    this.engine.registerRunner(this.humanApproval);
    this.engine.registerRunner(this.email);
    this.engine.registerRunner(this.webhook);
    this.engine.registerRunner(this.slack);
    this.engine.registerRunner(this.teams);
    this.engine.registerRunner(this.wait);
    this.engine.registerRunner(this.jira);
    this.engine.registerRunner(this.servicenow);
  }
}
