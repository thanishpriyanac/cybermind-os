export type SecurityObjectType = 
  | 'IP' 
  | 'DOMAIN' 
  | 'URL' 
  | 'HASH' 
  | 'USER' 
  | 'HOST' 
  | 'PORT' 
  | 'CVE' 
  | 'LOG_EVENT' 
  | 'IOC' 
  | 'FIREWALL_RULE';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface SecurityObjectRelationship {
  targetId: string;
  targetType: SecurityObjectType;
  targetValue: string;
  relationType: 'DISCOVERED_BY' | 'EXPOSED_VIA' | 'RESOLVES_TO' | 'MATCHES_RULE' | 'ASSOCIATED_CVE' | 'FOUND_IN_LOG' | 'BELONGS_TO';
}

export interface SecurityObject {
  id: string;
  type: SecurityObjectType;
  value: string;
  source: string;
  timestamp: string;
  risk: RiskLevel;
  confidence: number; // 0 - 100
  tags: string[];
  metadata?: Record<string, any>;
  relationships?: SecurityObjectRelationship[];
}

export interface ToolResultSummary {
  totalObjects: number;
  highRiskCount: number;
  riskScore: number; // 0 - 100
  executiveSummary: string;
}

export interface ToolResult<T = any> {
  toolId: string;
  toolName: string;
  timestamp: string;
  target: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  summary: ToolResultSummary;
  extractedObjects: SecurityObject[];
  data: T;
}

export interface ToolkitHistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  target: string;
  timestamp: string;
  risk: RiskLevel;
  summaryText: string;
  data: any;
}

export interface CorrelationContext {
  primaryObject?: SecurityObject;
  relatedObjects: SecurityObject[];
  existingAlertsCount?: number;
  existingInvestigationsCount?: number;
  relatedCveIds?: string[];
  firewallRulesCount?: number;
  logEventsCount?: number;
}
