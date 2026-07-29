import { ThreatIntelProvider, ThreatIntelResult } from '../../domain/processors/threat-intel.provider.interface';

/**
 * LocalIocCacheProvider – Release 1.0 threat intelligence provider.
 *
 * This is a simple in-memory IOC cache that can be seeded with known-bad
 * IP addresses, domains, and hashes from manual imports or STIX/TAXII feeds
 * in a future sprint. It implements the ThreatIntelProvider interface so the
 * ThreatIntelEnricher does not care which provider is active.
 */
export class LocalIocCacheProvider implements ThreatIntelProvider {
  name = 'LocalIocCache';

  private readonly ipBlocklist: Set<string>;
  private readonly domainBlocklist: Set<string>;
  private readonly hashBlocklist: Set<string>;

  constructor(config?: { ips?: string[]; domains?: string[]; hashes?: string[] }) {
    this.ipBlocklist = new Set(config?.ips ?? []);
    this.domainBlocklist = new Set(config?.domains ?? []);
    this.hashBlocklist = new Set(config?.hashes ?? []);
  }

  async checkIp(ip: string): Promise<ThreatIntelResult> {
    if (this.ipBlocklist.has(ip)) {
      return { hit: true, iocType: 'ip', confidence: 'HIGH', tags: ['blocklist'] };
    }
    return { hit: false };
  }

  async checkDomain(domain: string): Promise<ThreatIntelResult> {
    if (this.domainBlocklist.has(domain)) {
      return { hit: true, iocType: 'domain', confidence: 'HIGH', tags: ['blocklist'] };
    }
    return { hit: false };
  }

  async checkHash(hash: string): Promise<ThreatIntelResult> {
    if (this.hashBlocklist.has(hash)) {
      return { hit: true, iocType: 'hash', confidence: 'HIGH', tags: ['blocklist'] };
    }
    return { hit: false };
  }
}
