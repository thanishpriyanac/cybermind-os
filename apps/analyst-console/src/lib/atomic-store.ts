/**
 * CyberMind OS — Atomic Storage Helper (Edge-compatible stub)
 *
 * In-memory only. No filesystem access (not available in Cloudflare Workers edge runtime).
 */

export function getDataFilePath(filename: string): string {
  // No filesystem on edge runtime — return a stub path (unused)
  return `/data/${filename}`;
}

export function writeJsonAtomic(_filePath: string, _data: unknown): boolean {
  // No-op on edge runtime — data is kept in-memory
  return true;
}

export function validateTenantHeader(tenantIdHeader?: string | null): string {
  if (!tenantIdHeader || tenantIdHeader.trim() === '') {
    return 'cybermind-master-tenant';
  }
  return tenantIdHeader.trim();
}
