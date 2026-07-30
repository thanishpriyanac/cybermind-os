import { Injectable, Logger } from '@nestjs/common';
import { StaticAnalysisResult } from './static-analysis.service';

export type IocType = 'IP' | 'DOMAIN' | 'URL' | 'HASH' | 'EMAIL' | 'MUTEX' | 'REGISTRY_KEY' | 'FILENAME';

export interface TypedIoc {
  type: IocType;
  value: string;
}

@Injectable()
export class IocExtractionService {
  private readonly logger = new Logger(IocExtractionService.name);

  async extract(analysisResult: StaticAnalysisResult): Promise<TypedIoc[]> {
    this.logger.log(`Extracting Typed IOCs...`);
    const iocs: TypedIoc[] = [];

    // Simple RegEx patterns for mock extraction
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]\b/g;

    for (const str of analysisResult.strings) {
      const ips = str.match(ipRegex);
      if (ips) {
        ips.forEach(ip => iocs.push({ type: 'IP', value: ip }));
      }
      
      const domains = str.match(domainRegex);
      if (domains) {
        domains.forEach(domain => {
          // exclude common false positives or generic IPs captured as domains
          if (!domain.match(ipRegex) && !['localhost', 'example.com'].includes(domain)) {
             iocs.push({ type: 'DOMAIN', value: domain });
          }
        });
      }
    }

    // Deduplicate IOCs
    const uniqueIocs = Array.from(new Set(iocs.map(i => JSON.stringify(i)))).map(s => JSON.parse(s));
    
    return uniqueIocs;
  }
}
