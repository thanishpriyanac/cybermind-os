import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';

const INDEX_TEMPLATE_NAME = 'cybermind-events-template';
const ILM_POLICY_NAME = 'cybermind-events-ilm';
const WRITE_ALIAS = 'cybermind-events-write';
const READ_ALIAS = 'cybermind-events-read';

@Injectable()
export class IndexTemplateManager implements OnModuleInit {
  private readonly logger = new Logger(IndexTemplateManager.name);

  constructor(private readonly client: Client) {}

  async onModuleInit() {
    await this.bootstrapIlmPolicy();
    await this.bootstrapIndexTemplate();
    await this.bootstrapInitialIndex();
  }

  private async bootstrapIlmPolicy() {
    try {
      await this.client.transport.request({
        method: 'PUT',
        path: `/_plugins/_ism/policies/${ILM_POLICY_NAME}`,
        body: {
          policy: {
            description: 'CYBERMIND events index lifecycle',
            default_state: 'hot',
            states: [
              {
                name: 'hot',
                actions: [{ rollover: { min_index_age: '7d', min_size: '50gb' } }],
                transitions: [{ state_name: 'warm', conditions: { min_index_age: '7d' } }],
              },
              {
                name: 'warm',
                actions: [{ read_only: {} }, { force_merge: { max_num_segments: 1 } }],
                transitions: [{ state_name: 'cold', conditions: { min_index_age: '30d' } }],
              },
              {
                name: 'cold',
                actions: [{ read_only: {} }],
                transitions: [{ state_name: 'delete', conditions: { min_index_age: '90d' } }],
              },
              { name: 'delete', actions: [{ delete: {} }], transitions: [] },
            ],
          },
        },
      });
      this.logger.log('ILM policy bootstrapped');
    } catch (e: any) {
      // Policy already exists — safe to ignore
      if (!e?.message?.includes('already exists') && e?.statusCode !== 409) {
        this.logger.warn(`ILM policy bootstrap warning: ${e?.message}`);
      }
    }
  }

  private async bootstrapIndexTemplate() {
    try {
      await this.client.indices.putIndexTemplate({
        name: INDEX_TEMPLATE_NAME,
        body: {
          index_patterns: ['cybermind-events-*'],
          template: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 1,
              'plugins.index_state_management.policy_id': ILM_POLICY_NAME,
            },
            mappings: {
              dynamic_templates: [
                { strings_as_keywords: { match_mapping_type: 'string', mapping: { type: 'keyword' } } },
                { text_fields: { match: '*_text', mapping: { type: 'text', analyzer: 'standard' } } },
                { date_fields: { match: '*_at', mapping: { type: 'date' } } },
                { count_fields: { match: '*_count', mapping: { type: 'integer' } } },
              ],
              properties: {
                event_id:             { type: 'keyword' },
                tenant_id:            { type: 'keyword' },
                event_time:           { type: 'date' },
                ingested_at:          { type: 'date' },
                indexed_at:           { type: 'date' },
                source:               { type: 'keyword' },
                category:             { type: 'keyword' },
                normalized_severity:  { type: 'keyword' },
                confidence_score:     { type: 'integer' },
                ingestion_latency_ms: { type: 'long' },
                pipeline_version:     { type: 'keyword' },
                schema_version:       { type: 'keyword' },
                correlation_id:       { type: 'keyword' },
                asset: {
                  properties: {
                    id:          { type: 'keyword' },
                    type:        { type: 'keyword' },
                    environment: { type: 'keyword' },
                    risk_profile:{ type: 'keyword' },
                  },
                },
                mitre: {
                  type: 'nested',
                  properties: {
                    id:      { type: 'keyword' },
                    tactic:  { type: 'keyword' },
                    technique: { type: 'keyword' },
                  },
                },
                threat_intel: {
                  type: 'nested',
                  properties: {
                    hit:      { type: 'boolean' },
                    ioc_type: { type: 'keyword' },
                    provider: { type: 'keyword' },
                  },
                },
                normalized_data:      { type: 'flattened' },
                enrichment_metadata:  { type: 'object', enabled: false },
                raw_payload:          { type: 'binary' },
              },
            },
            aliases: {
              [READ_ALIAS]: {},
            },
          },
        },
      });
      this.logger.log('Index template bootstrapped');
    } catch (e: any) {
      this.logger.warn(`Index template bootstrap warning: ${e?.message}`);
    }
  }

  private async bootstrapInitialIndex() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
    const initialIndex = `cybermind-events-${today}`;
    try {
      const exists = await this.client.indices.exists({ index: initialIndex });
      if (!exists.body) {
        await this.client.indices.create({
          index: initialIndex,
          body: { aliases: { [WRITE_ALIAS]: { is_write_index: true } } },
        });
        this.logger.log(`Initial index ${initialIndex} created with write alias`);
      }
    } catch (e: any) {
      this.logger.warn(`Initial index bootstrap warning: ${e?.message}`);
    }
  }
}
