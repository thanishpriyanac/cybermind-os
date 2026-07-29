import { Controller, Post, Body, Headers, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { AiGatewayService } from '../gateway/ai-gateway.service';

@Controller('v1/ai/copilot')
export class CopilotController {
  private readonly logger = new Logger(CopilotController.name);

  constructor(private readonly gateway: AiGatewayService) {}

  @Post('explain-alert')
  async explainAlert(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: { alert: any; events: any[] }
  ) {
    return this.runSafeQuery(tenantId, userId, 
      `Explain this security alert in plain English, analyzing the events that triggered it. Alert: ${JSON.stringify(body.alert)} Events: ${JSON.stringify(body.events)}`
    );
  }

  @Post('summarize-case')
  async summarizeCase(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: { investigationId: string; evidence: any[]; notes: any[] }
  ) {
    return this.runSafeQuery(tenantId, userId, 
      `Summarize this investigation case for an executive report. Evidence: ${JSON.stringify(body.evidence)} Notes: ${JSON.stringify(body.notes)}`
    );
  }

  @Post('mitigation-steps')
  async mitigationSteps(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: { alert: any; mitreTechniques: string[] }
  ) {
    return this.runSafeQuery(tenantId, userId, 
      `Provide concrete mitigation and remediation steps for this alert based on the associated MITRE ATT&CK techniques: ${body.mitreTechniques.join(', ')}. Alert: ${JSON.stringify(body.alert)}`
    );
  }

  @Post('explain-rule')
  async explainRule(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: { ruleContent: string }
  ) {
    return this.runSafeQuery(tenantId, userId, 
      `Analyze this Sigma rule. Explain the detection logic, the MITRE mapping, describe why it might fire, and suggest tuning opportunities to reduce false positives. Rule: ${body.ruleContent}`
    );
  }

  @Post('timeline')
  async generateTimeline(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: { items: any[] }
  ) {
    return this.runSafeQuery(tenantId, userId, 
      `Generate a chronological, narrative timeline from these investigation items (events, alerts, notes): ${JSON.stringify(body.items)}`
    );
  }

  private async runSafeQuery(tenantId: string, userId: string, prompt: string) {
    if (!tenantId || !userId) throw new UnauthorizedException();
    if (!prompt) throw new BadRequestException('Empty prompt');

    const traceId = crypto.randomUUID();
    const systemPrompt = `You are the CYBERMIND Analyst Copilot. Provide accurate, professional, and actionable cybersecurity insights. Never output raw sensitive PII or credentials.`;

    const start = Date.now();
    const response = await this.gateway.complete(tenantId, userId, {
      modelKey: 'auto',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });
    const latency = Date.now() - start;

    return {
      content: response.content,
      metadata: {
        model: response.modelKey,
        provider: response.provider,
        confidence: this.calculateConfidence(response.content),
        generatedAt: new Date().toISOString(),
        traceId,
        latencyMs: latency,
        costUsd: response.costUsd,
      }
    };
  }

  /**
   * Calculates a heuristic confidence score based on the model's response.
   * Looks for expressions of uncertainty or hedging.
   */
  private calculateConfidence(text: string): number {
    const lowerText = text.toLowerCase();
    const uncertaintyKeywords = ['might', 'could', 'possibly', 'unsure', 'unclear', 'maybe', 'likely', 'potential', 'unknown'];
    
    let penalty = 0;
    for (const word of uncertaintyKeywords) {
      if (lowerText.includes(word)) {
        penalty += 0.05;
      }
    }
    
    // Cap penalty at 0.4 so confidence never drops below 0.6 just from keywords
    penalty = Math.min(penalty, 0.4);
    
    // Base confidence is high (0.98), penalized by uncertainty
    return Number(Math.max(0.1, 0.98 - penalty).toFixed(2));
  }
}
