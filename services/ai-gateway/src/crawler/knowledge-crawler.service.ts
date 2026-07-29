import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../app/prisma.service';
import { KnowledgeGraphService } from '../knowledge-graph/knowledge-graph.service';
import { EmbeddingProvider } from '../providers/provider.interface';

@Injectable()
export class KnowledgeCrawlerService {
  private readonly logger = new Logger(KnowledgeCrawlerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeGraph: KnowledgeGraphService,
    private readonly embedder: EmbeddingProvider,
  ) {}

  /** Crawl NVD for recent CVEs every 6 hours */
  @Cron('0 */6 * * *')
  async crawlNvd() {
    this.logger.log('Crawling NVD for recent CVEs...');
    try {
      const url = 'https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=20&startIndex=0';
      const res = await fetch(url, { headers: { 'User-Agent': 'CYBERMIND/1.0' } });
      if (!res.ok) { this.logger.warn(`NVD fetch failed: ${res.statusText}`); return; }

      const data: any = await res.json();
      for (const item of data.vulnerabilities ?? []) {
        const cve = item.cve;
        const cveId: string = cve.id;
        const description: string = cve.descriptions?.find((d: any) => d.lang === 'en')?.value ?? '';
        const severity: string = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity ?? 'UNKNOWN';
        const publishedAt = cve.published ? new Date(cve.published) : undefined;

        // Upsert into KnowledgeArticle
        await this.prisma.knowledgeArticle.upsert({
          where: { externalId: cveId },
          create: {
            source: 'nvd', externalId: cveId,
            title: cveId, summary: description.slice(0, 500),
            content: description, severity, tags: [severity],
            publishedAt,
          },
          update: { summary: description.slice(0, 500), severity, updatedAt: new Date() },
        });

        // Add to Knowledge Graph
        await this.knowledgeGraph.upsertNode(cveId, 'CVE', { severity, description: description.slice(0, 200) });
      }
      this.logger.log(`NVD crawl complete — processed ${data.vulnerabilities?.length ?? 0} CVEs`);
    } catch (e: any) {
      this.logger.error(`NVD crawl error: ${e.message}`);
    }
  }

  /** Crawl CISA KEV every 12 hours */
  @Cron('0 */12 * * *')
  async crawlCisaKev() {
    this.logger.log('Crawling CISA Known Exploited Vulnerabilities...');
    try {
      const res = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
      if (!res.ok) return;
      const data: any = await res.json();

      for (const vuln of (data.vulnerabilities ?? []).slice(0, 30)) {
        await this.prisma.knowledgeArticle.upsert({
          where: { externalId: `CISA-${vuln.cveID}` },
          create: {
            source: 'cisa', externalId: `CISA-${vuln.cveID}`,
            title: `CISA KEV: ${vuln.cveID}`,
            summary: vuln.shortDescription ?? '',
            content: `${vuln.vendorProject} ${vuln.product}: ${vuln.shortDescription}`,
            severity: 'HIGH', tags: ['kev', 'actively-exploited'],
            publishedAt: vuln.dateAdded ? new Date(vuln.dateAdded) : undefined,
          },
          update: { updatedAt: new Date() },
        });
        // Link CVE node → CISA KEV flag
        await this.knowledgeGraph.upsertNode(vuln.cveID, 'CVE', { kevListed: true, vendor: vuln.vendorProject });
      }
      this.logger.log(`CISA KEV crawl complete — ${data.vulnerabilities?.length ?? 0} entries`);
    } catch (e: any) {
      this.logger.error(`CISA crawl error: ${e.message}`);
    }
  }
}
