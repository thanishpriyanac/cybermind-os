import { Injectable, Logger } from '@nestjs/common';
import { LlmProvider, LlmRequest } from '../providers/provider.interface';

/**
 * SmartProviderRouter
 *
 * Routes each request to the optimal provider based on:
 *  1. Query intent detection (keywords / categories)
 *  2. Model capability matching
 *  3. Cost preference (local vs cloud)
 *  4. Provider health state
 *
 * Routing rules (in priority order):
 *  PCAP / binary / malware analysis → claude-3-5-sonnet (best reasoning)
 *  Code / scripting / PowerShell    → qwen2.5-coder (local first)
 *  Threat research / live intel     → gpt-4o
 *  CVE / vulnerability lookup       → claude-3-5-haiku (fast + cheap)
 *  General security Q&A             → llama3.1 (local, zero cost)
 */

const ROUTING_RULES: Array<{
  pattern: RegExp;
  preferredModel: string;
  fallback: string;
}> = [
  { pattern: /pcap|wireshark|packet capture|hex dump|binary analysis/i, preferredModel: 'claude-3-5-sonnet-20241022', fallback: 'gpt-4o' },
  { pattern: /powershell|python script|bash|shellcode|code review|source code/i, preferredModel: 'qwen2.5-coder',       fallback: 'gpt-4o-mini' },
  { pattern: /cve-\d{4}-\d+|vulnerability|patch|nvd|exploit/i,              preferredModel: 'claude-3-5-haiku-20241022', fallback: 'gpt-4o-mini' },
  { pattern: /apt\d+|threat actor|campaign|attribution|ioc feed/i,           preferredModel: 'gpt-4o',                  fallback: 'claude-3-5-sonnet-20241022' },
  { pattern: /syslog|windows event|evtx|event id \d+/i,                      preferredModel: 'qwen2.5-coder',            fallback: 'gpt-4o-mini' },
];

const DEFAULT_MODEL = 'llama3.1';

@Injectable()
export class SmartProviderRouter {
  private readonly logger = new Logger(SmartProviderRouter.name);

  constructor(private readonly providers: Map<string, LlmProvider>) {}

  route(request: LlmRequest): { modelKey: string; provider: LlmProvider } {
    // Use explicit model if specified
    if (request.modelKey && request.modelKey !== 'auto') {
      const provider = this.findProviderForModel(request.modelKey);
      if (provider) return { modelKey: request.modelKey, provider };
    }

    // Intent detection from last user message
    const lastUserMessage = [...request.messages].reverse().find(m => m.role === 'user')?.content ?? '';

    for (const rule of ROUTING_RULES) {
      if (rule.pattern.test(lastUserMessage)) {
        const provider = this.findProviderForModel(rule.preferredModel)
          ?? this.findProviderForModel(rule.fallback);
        if (provider) {
          this.logger.debug(`Routing to ${rule.preferredModel} via pattern ${rule.pattern}`);
          return { modelKey: rule.preferredModel, provider };
        }
      }
    }

    // Default to local model
    const defaultProvider = this.findProviderForModel(DEFAULT_MODEL);
    if (defaultProvider) return { modelKey: DEFAULT_MODEL, provider: defaultProvider };

    throw new Error('No available provider found for request');
  }

  private findProviderForModel(modelKey: string): LlmProvider | null {
    for (const provider of this.providers.values()) {
      if (provider.supportedModels.includes(modelKey)) return provider;
    }
    return null;
  }

  getAvailableModels(): string[] {
    const models: string[] = [];
    for (const provider of this.providers.values()) {
      models.push(...provider.supportedModels);
    }
    return [...new Set(models)];
  }
}
