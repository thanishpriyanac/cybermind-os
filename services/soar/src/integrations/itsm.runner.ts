import { Injectable } from '@nestjs/common';
import { ActionRunner, ActionContext, ActionResult } from '../engine/engine.interface';

@Injectable()
export class JiraRunner implements ActionRunner {
  readonly actionName = 'jira';

  async execute(context: ActionContext): Promise<ActionResult> {
    const { url, email, apiToken, projectKey, summary, description, issueType } = context.inputs;

    if (!url || !email || !apiToken || !projectKey || !summary) {
      return { status: 'FAILED', error: 'Missing required Jira inputs' };
    }

    try {
      const response = await fetch(`${url}/rest/api/2/issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            project: { key: projectKey },
            summary,
            description,
            issuetype: { name: issueType ?? 'Task' },
          }
        }),
      });

      if (!response.ok) return { status: 'FAILED', error: `Jira error: ${response.status}`, retryable: true };
      
      const data: any = await response.json();
      return { status: 'SUCCESS', outputs: { issueId: data.id, issueKey: data.key } };
    } catch (e: any) {
      return { status: 'FAILED', error: e.message, retryable: true };
    }
  }
}

@Injectable()
export class ServiceNowRunner implements ActionRunner {
  readonly actionName = 'servicenow';

  async execute(context: ActionContext): Promise<ActionResult> {
    const { instanceUrl, username, password, short_description, description, caller_id } = context.inputs;

    if (!instanceUrl || !username || !password || !short_description) {
      return { status: 'FAILED', error: 'Missing required ServiceNow inputs' };
    }

    try {
      const response = await fetch(`${instanceUrl}/api/now/table/incident`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ short_description, description, caller_id }),
      });

      if (!response.ok) return { status: 'FAILED', error: `ServiceNow error: ${response.status}`, retryable: true };
      
      const data: any = await response.json();
      return { status: 'SUCCESS', outputs: { incidentId: data.result.sys_id, incidentNumber: data.result.number } };
    } catch (e: any) {
      return { status: 'FAILED', error: e.message, retryable: true };
    }
  }
}
