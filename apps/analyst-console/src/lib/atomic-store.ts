/**
 * CyberMind OS — Atomic Storage Helper
 * 
 * Provides crash-safe atomic writes using write-to-temp + rename pattern.
 * Prevents zero-byte corrupted JSON/JSONL store files during PM2 restarts or power failures.
 */

import fs from 'fs';
import path from 'path';

export function writeJsonAtomic(filePath: string, data: any): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tempPath = `${filePath}.tmp.${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    
    fs.writeFileSync(tempPath, content, 'utf-8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`[CYBERMIND ATOMIC STORE] Atomic write failed for ${filePath}:`, err);
    return false;
  }
}

export function validateTenantHeader(tenantIdHeader?: string | null): string {
  if (!tenantIdHeader || tenantIdHeader.trim() === '') {
    return 'cybermind-master-tenant';
  }
  return tenantIdHeader.trim();
}
