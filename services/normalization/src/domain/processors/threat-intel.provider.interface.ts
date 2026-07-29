export interface ThreatIntelResult {
  hit: boolean;
  iocType?: string;
  confidence?: string;
  tags?: string[];
}

export interface ThreatIntelProvider {
  name: string;
  checkIp(ip: string): Promise<ThreatIntelResult>;
  checkDomain(domain: string): Promise<ThreatIntelResult>;
  checkHash(hash: string): Promise<ThreatIntelResult>;
}
