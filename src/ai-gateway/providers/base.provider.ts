import { Logger } from '@nestjs/common';
import { IAIProviderAdapter, ProviderExecutionContext, ProviderExecutionResult } from '../interfaces/provider.adapter';
import { CostEngineService } from '../cost-engine/cost-engine.service';

export abstract class BaseProviderAdapter implements IAIProviderAdapter {
  protected readonly logger = new Logger(this.constructor.name);

  abstract readonly providerName: string;

  constructor(protected readonly costEngine: CostEngineService) {}

  abstract execute(ctx: ProviderExecutionContext, apiKey?: string): Promise<ProviderExecutionResult>;

  /**
   * System Prompt Injection Baseline (§7 Cyber Security System Prompt)
   */
  protected getFormattedSystemPrompt(customPrompt?: string): string {
    const baseSecurityPrompt = `You are CYBERMIND AI, an elite cybersecurity intelligence assistant.
Your answers MUST be technical, precise, and actionable. Include relevant MITRE ATT&CK technique IDs, CVE references, and remediation commands (Bash, PowerShell, Snort/YARA) where applicable. Never output vague security advice.`;

    if (!customPrompt) return baseSecurityPrompt;
    return `${baseSecurityPrompt}\n\n${customPrompt}`;
  }
}
