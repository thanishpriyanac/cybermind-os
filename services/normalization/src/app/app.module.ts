import { Module } from '@nestjs/common';
import { NormalizationEngine } from '../domain/services/normalization-engine.service';
import { TimestampNormalizer } from '../domain/processors/timestamp.normalizer';
import { SeverityNormalizer } from '../domain/processors/severity.normalizer';
import { AssetEnricher } from '../domain/processors/asset.enricher';
import { MitreMapper } from '../domain/processors/mitre.mapper';
import { ThreatIntelEnricher } from '../domain/processors/threat-intel.enricher';
import { ConfidenceCalculator } from '../domain/processors/confidence.calculator';
import { LocalIocCacheProvider } from '../infrastructure/threat-intel/local-ioc-cache.provider';
import { EventPlatformModule } from '../../../../packages/sdk/event-client/src/nestjs-integration';
import { CybermindAssetClient } from '../../../../packages/sdk/asset-client/src/asset-client';

@Module({
  imports: [
    EventPlatformModule.forRoot({
      clientId: 'normalization-service',
      brokers: ['localhost:9092'],
      sourceName: '/cybermind/normalization',
    }),
  ],
  providers: [
    NormalizationEngine,
    TimestampNormalizer,
    SeverityNormalizer,
    AssetEnricher,
    MitreMapper,
    ThreatIntelEnricher,
    ConfidenceCalculator,
    CybermindAssetClient,
    {
      provide: 'THREAT_INTEL_PROVIDERS',
      useFactory: () => [
        new LocalIocCacheProvider({
          // Seed known-bad IOCs here or load from env/config
          ips: (process.env.IOC_BLOCKLIST_IPS ?? '').split(',').filter(Boolean),
          domains: (process.env.IOC_BLOCKLIST_DOMAINS ?? '').split(',').filter(Boolean),
        }),
      ],
    },
  ],
})
export class AppModule {
  constructor(
    private readonly engine: NormalizationEngine,
    private readonly timestampNormalizer: TimestampNormalizer,
    private readonly severityNormalizer: SeverityNormalizer,
    private readonly assetEnricher: AssetEnricher,
    private readonly mitreMapper: MitreMapper,
    private readonly threatIntelEnricher: ThreatIntelEnricher,
    private readonly confidenceCalculator: ConfidenceCalculator
  ) {
    // 1. Register the sequential enrichment pipeline
    this.engine.registerProcessors([
      this.timestampNormalizer,
      this.severityNormalizer,
      this.assetEnricher,
      this.threatIntelEnricher,
      this.mitreMapper,
      this.confidenceCalculator // Run last to compute final score
    ]);
  }
}
