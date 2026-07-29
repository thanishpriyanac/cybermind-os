import { Injectable } from '@nestjs/common';
import { ActionRunner, ActionContext, ActionResult } from '../engine/engine.interface';

@Injectable()
export class WebhookRunner implements ActionRunner {
  readonly actionName = 'webhook';

  async execute(context: ActionContext): Promise<ActionResult> {
    const url = context.inputs.url;
    const method = context.inputs.method ?? 'POST';
    const payload = context.inputs.payload;
    const headers = context.inputs.headers ?? {};

    if (!url) return { status: 'FAILED', error: 'Missing webhook URL' };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: ['POST', 'PUT', 'PATCH'].includes(method) ? JSON.stringify(payload) : undefined,
      });

      if (!response.ok) {
        return { status: 'FAILED', error: `HTTP ${response.status}: ${response.statusText}`, retryable: true };
      }

      let responseData: any = {};
      try { responseData = await response.json(); } catch { /* ignore non-JSON */ }

      return { status: 'SUCCESS', outputs: { statusCode: response.status, data: responseData } };
    } catch (e: any) {
      return { status: 'FAILED', error: e.message, retryable: true };
    }
  }
}
