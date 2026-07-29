import { CanonicalEvent } from '../connector/canonical-event';

export interface EnrichmentMetadata {
  stage: string;
  status: 'SUCCESS' | 'FAILURE' | 'SKIPPED';
  reason?: string;
  timestamp: string;
}

export interface EnrichedEvent {
  canonicalEvent: CanonicalEvent;
  
  // Enriched Entities
  asset?: {
    id: string;
    type: string;
    businessService?: string;
    environment?: string;
    riskProfile?: string;
    owner?: string;
    tags?: string[];
  };
  
  geo?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  
  dns?: {
    resolvedNames?: string[];
  };
  
  mitre?: {
    tactic: string;
    technique: string;
    id: string;
  }[];
  
  threatIntel?: {
    provider: string;
    hit: boolean;
    iocType?: string;
    confidence?: string;
    tags?: string[];
  }[];
  
  // Normalization
  normalizedSeverity: 'INFORMATIONAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidenceScore: number; // 0-100 scale
  
  // Tracing
  enrichmentMetadata: EnrichmentMetadata[];
}
