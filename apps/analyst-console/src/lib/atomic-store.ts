import fs from 'fs';
import path from 'path';

/**
 * CyberMind OS — Atomic Storage Helper
 *
 * Provides real persistent filesystem storage for stores:
 * (copilot, firewall, qbr, ip, vapt, alerts, cve)
 */

export function getDataFilePath(filename: string): string {
  // Resolve data directory: check process.cwd()/data or parent levels
  const candidates = [
    path.join(process.cwd(), 'data'),
    path.join(process.cwd(), 'apps', 'analyst-console', 'data'),
    path.join(__dirname, '..', '..', '..', '..', 'data'),
    path.join(__dirname, '..', '..', '..', 'data'),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return path.join(dir, filename);
    }
  }

  // Fallback: create data directory in process.cwd()
  const defaultDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
  } catch {
    // ignore
  }
  return path.join(defaultDir, filename);
}

export function readJsonStore<T>(filename: string, fallback: T): T {
  try {
    const filePath = getDataFilePath(filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.trim()) {
        return JSON.parse(content) as T;
      }
    }
  } catch (err) {
    console.error(`[AtomicStore] Failed to read ${filename}:`, err);
  }
  return fallback;
}

export function writeJsonAtomic(filePath: string, data: unknown): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`[AtomicStore] Failed atomic write to ${filePath}:`, err);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (directErr) {
      console.error(`[AtomicStore] Direct write fallback failed for ${filePath}:`, directErr);
      return false;
    }
  }
}

export function validateTenantHeader(tenantIdHeader?: string | null): string {
  if (!tenantIdHeader || tenantIdHeader.trim() === '') {
    return 'cybermind-master-tenant';
  }
  return tenantIdHeader.trim();
}
