import { Injectable } from '@nestjs/common';
import { ActionRunner, ActionContext, ActionResult } from '../engine/engine.interface';

@Injectable()
export class SlackRunner implements ActionRunner {
  readonly actionName = 'slack';

  async execute(context: ActionContext): Promise<ActionResult> {
    const webhookUrl = context.inputs.webhookUrl;
    const message = context.inputs.message;

    if (!webhookUrl || !message) return { status: 'FAILED', error: 'Missing webhookUrl or message' };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
      if (!response.ok) return { status: 'FAILED', error: `Slack API error: ${response.status}`, retryable: true };
      return { status: 'SUCCESS' };
    } catch (e: any) {
      return { status: 'FAILED', error: e.message, retryable: true };
    }
  }
}

@Injectable()
export class TeamsRunner implements ActionRunner {
  readonly actionName = 'teams';

  async execute(context: ActionContext): Promise<ActionResult> {
    const webhookUrl = context.inputs.webhookUrl;
    const message = context.inputs.message;

    if (!webhookUrl || !message) return { status: 'FAILED', error: 'Missing webhookUrl or message' };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
      if (!response.ok) return { status: 'FAILED', error: `Teams API error: ${response.status}`, retryable: true };
      return { status: 'SUCCESS' };
    } catch (e: any) {
      return { status: 'FAILED', error: e.message, retryable: true };
    }
  }
}

