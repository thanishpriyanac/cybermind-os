export interface PlaybookStep {
  id: string;
  action: string;
  config: Record<string, any>;
}

export interface PlaybookData {
  id: string;
  tenantId: string;
  status: string;
  steps: PlaybookStep[];
}

export interface ActionContext {
  executionId: string;
  tenantId: string;
  playbookId: string;
  stepId: string;
  inputs: Record<string, any>;
  state: Record<string, any>; // Accumulated from previous steps
}

export interface ActionResult {
  status: 'SUCCESS' | 'FAILED' | 'WAITING_APPROVAL';
  outputs?: Record<string, any>;
  error?: string;
  retryable?: boolean;
}

export interface ActionRunner {
  readonly actionName: string;
  execute(context: ActionContext): Promise<ActionResult>;
}
