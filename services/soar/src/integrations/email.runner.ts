import { Injectable, Logger } from '@nestjs/common';
import { ActionRunner, ActionContext, ActionResult } from '../engine/engine.interface';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailRunner implements ActionRunner {
  readonly actionName = 'email';
  private readonly logger = new Logger(EmailRunner.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'user',
        pass: process.env.SMTP_PASS || 'pass',
      },
    });
  }

  async execute(context: ActionContext): Promise<ActionResult> {
    const to = context.inputs.to;
    const subject = context.inputs.subject;
    const body = context.inputs.body;

    if (!to || !subject || !body) {
      return { status: 'FAILED', error: 'Missing required inputs: to, subject, body' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Cybermind OS" <no-reply@cybermind.local>',
        to,
        subject,
        text: body,
      });
      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return { status: 'SUCCESS', outputs: { deliveredTo: to, messageId: info.messageId } };
    } catch (e: any) {
      this.logger.error(`Failed to send email to ${to}: ${e.message}`);
      return { status: 'FAILED', error: e.message, retryable: true };
    }
  }
}
