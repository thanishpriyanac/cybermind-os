import { Injectable } from '@nestjs/common';

export interface ExtractedIoc {
  type: 'IP' | 'DOMAIN' | 'HASH';
  value: string;
}

@Injectable()
export class SoarTemplateEngine {
  
  generateSigmaRule(iocs: ExtractedIoc[], title: string): string {
    if (iocs.length === 0) return '';
    
    const conditionTokens = iocs.map((ioc, idx) => `ioc_${idx}`).join(' or ');
    const selections = iocs.map((ioc, idx) => {
        return `    ioc_${idx}:\n        ${this.mapSigmaField(ioc.type)}: '${ioc.value}'`;
    }).join('\n');

    return `
title: ${title}
status: experimental
description: Automatically generated Sigma rule from CYBERMIND Investigation
logsource:
    category: network_connection
    product: windows
detection:
${selections}
    condition: ${conditionTokens}
`.trim();
  }

  generateSplunkSpl(iocs: ExtractedIoc[]): string {
    if (iocs.length === 0) return '';
    
    const conditions = iocs.map(ioc => {
        const field = this.mapSplunkField(ioc.type);
        return `${field}="${ioc.value}"`;
    }).join(' OR ');

    return `index=* (${conditions}) | stats count by src_ip, dest_ip, url, file_hash`;
  }

  private mapSigmaField(type: string): string {
      switch(type) {
          case 'IP': return 'DestinationIp';
          case 'DOMAIN': return 'QueryName';
          case 'HASH': return 'Hashes';
          default: return 'Image';
      }
  }

  private mapSplunkField(type: string): string {
      switch(type) {
          case 'IP': return 'dest_ip';
          case 'DOMAIN': return 'url';
          case 'HASH': return 'file_hash';
          default: return 'unknown';
      }
  }
}
