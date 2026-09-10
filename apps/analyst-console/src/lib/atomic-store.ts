/**
 * CyberMind OS — Atomic Storage & Robust Path Resolution Helper
 * 
 * Provides crash-safe atomic writes using write-to-temp + rename pattern.
 * Prevents zero-byte corrupted JSON/JSONL store files during PM2 restarts or power failures.
 */

import fs from 'fs';
import path from 'path';

export function getDataFilePath(filename: string): string {
  const cwd = process.cwd();
  
  // Dynamic candidate list to resolve data/ directory across dev, nx monorepo, and standalone next.js server
  const candidates = [
    path.join(cwd, 'data', filename),
    path.join(cwd, '..', 'data', filename),
    path.join(cwd, '..', '..', 'data', filename),
    path.join(cwd, '..', '..', '..', 'data', filename),
    path.resolve(__dirname, '../../../../data', filename),
  ];

  // 1. Return candidate if file already exists
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // 2. Return candidate if data directory exists
  for (const candidate of candidates) {
    const parentDir = path.dirname(candidate);
    if (fs.existsSync(parentDir)) {
      if (!fs.existsSync(parentDir)) {
        try { fs.mkdirSync(parentDir, { recursive: true }); } catch { /* skip */ }
      }
      return candidate;
    }
  }

  // 3. Absolute fallback to project root data directory
  const fallback = path.join(cwd, 'data', filename);
  try {
    const dir = path.dirname(fallback);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch { /* skip */ }
  return fallback;
}

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
