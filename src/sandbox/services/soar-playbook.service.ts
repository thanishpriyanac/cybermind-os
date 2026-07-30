import { Injectable, Logger } from '@nestjs/common';
import { SoarTemplateEngine, ExtractedIoc } from './soar-template.engine';

export interface SoarPlaybook {
  sigmaRule: string;
  splunkQuery: string;
}

@Injectable()
export class SoarPlaybookService {
  private readonly logger = new Logger(SoarPlaybookService.name);

  constructor(private readonly templateEngine: SoarTemplateEngine) {}

  generatePlaybook(iocs: ExtractedIoc[], investigationId: string): SoarPlaybook {
    this.logger.log(`Generating SOAR playbook artifacts for investigation ${investigationId}`);
    
    // Deduplicate IOCs
    const uniqueIocs = Array.from(new Map(iocs.map(item => [item.value, item])).values());

    return {
      sigmaRule: this.templateEngine.generateSigmaRule(uniqueIocs, `Investigation ${investigationId} Auto-Rule`),
      splunkQuery: this.templateEngine.generateSplunkSpl(uniqueIocs)
    };
  }
}
