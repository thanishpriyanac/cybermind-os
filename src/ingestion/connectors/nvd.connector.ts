import { Injectable, Logger } from '@nestjs/common';
import { DocumentProcessorService, RawDocument } from '../services/document-processor.service';

@Injectable()
export class NvdConnector {
  private readonly logger = new Logger(NvdConnector.name);

  constructor(private readonly processor: DocumentProcessorService) {}

  async fetchAndProcess() {
    this.logger.log('Fetching CVEs from NVD...');
    
    // In a real implementation, we would use axios or native fetch to get data from https://services.nvd.nist.gov/rest/json/cves/2.0
    // Mocking the ingestion of one CVE
    const mockCve: RawDocument = {
      title: 'CVE-2023-34362 (MOVEit Transfer)',
      content: 'SQL injection vulnerability in the MOVEit Transfer web application that could allow an unauthenticated attacker to gain unauthorized access to MOVEit Transfer database.',
      url: 'https://nvd.nist.gov/vuln/detail/CVE-2023-34362',
      source: 'NVD',
      sourceType: 'CVE',
      publishedAt: new Date('2023-06-02T00:00:00Z'),
    };

    await this.processor.process(mockCve);
  }
}
