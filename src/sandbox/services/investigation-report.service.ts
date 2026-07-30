import { Injectable, Logger } from '@nestjs/common';
import { ChatToGraphService } from '../../retrieval/services/chat-to-graph.service';
import { FileMetadata } from './file-identification.service';
import { StaticAnalysisResult } from './static-analysis.service';
import { TypedIoc } from './ioc-extraction.service';
import { SoarPlaybookService } from './soar-playbook.service';

@Injectable()
export class InvestigationReportService {
  private readonly logger = new Logger(InvestigationReportService.name);

  constructor(
      private readonly chatToGraph: ChatToGraphService,
      private readonly soarPlaybookService: SoarPlaybookService
  ) {}

  async generateReport(
    investigationId: string, 
    fileMeta: FileMetadata, 
    analysis: StaticAnalysisResult, 
    iocs: TypedIoc[]
  ): Promise<string> {
    this.logger.log(`Generating AI Investigation Report for ${investigationId}...`);

    // We use the retrieval pipeline to correlate these IOCs against CTI knowledge
    let contextStr = "No significant correlations found.";
    
    if (iocs.length > 0) {
      // Create a search query based on the most critical extracted IOCs
      // Just taking the first 3 IPs/Domains for a mock query
      const topIocs = iocs.slice(0, 3).map(i => i.value).join(' OR ');
      const query = `Find any vulnerabilities, malware, or threat actors linked to: ${topIocs}`;
      
      try {
        const askResult = await this.chatToGraph.processNaturalLanguageQuery(query);
        contextStr = `Found ${askResult.results.length} related records in graph.`;
      } catch (err) {
        this.logger.error(`Retrieval pipeline failed during investigation: ${err.message}`);
      }
    }

    // Generate SOAR Playbook
    const playbook = this.soarPlaybookService.generatePlaybook(
        iocs.map(ioc => ({ type: ioc.type as any, value: ioc.value })), 
        investigationId
    );

    // Output a structured investigation report
    return `
# AI Investigation Report
**Investigation ID:** ${investigationId}
**Date:** ${new Date().toISOString()}

## 1. Summary
Automated static analysis and IOC extraction completed for file \`${fileMeta.originalName}\`.

## 2. File Metadata
- **MIME Type:** ${fileMeta.mimeType}
- **Size:** ${fileMeta.sizeBytes} bytes
- **SHA-256:** ${fileMeta.hashes.sha256}
- **MD5:** ${fileMeta.hashes.md5}

## 3. Extracted IOCs
${iocs.length > 0 ? iocs.map(i => `- **${i.type}**: ${i.value}`).join('\n') : '*No IOCs extracted.*'}

## 4. Threat Intelligence Matches
*Synthesized via Hybrid Retrieval*

${contextStr}

## 5. YARA Matches
${analysis.yaraMatches.length > 0 ? analysis.yaraMatches.join(', ') : '*None*'}

## 6. Recommendations
- Review the matched threat intelligence for potential indicators of compromise.
- Block the extracted IPs/Domains in the perimeter firewall if linked to known threats.

## 7. SOAR Automated Playbook
Automatically generated rules based on extracted IOCs for immediate deployment.

### Sigma Rule
\`\`\`yaml
${playbook.sigmaRule}
\`\`\`

### Splunk Query
\`\`\`spl
${playbook.splunkQuery}
\`\`\`
`;
  }
}
