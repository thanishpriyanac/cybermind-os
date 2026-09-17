import { writeJsonAtomic } from './atomic-store';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: string;
  resource: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  ipAddress?: string;
  details?: Record<string, any>;
}

const AUDIT_STORE_FILE = "";

let inMemoryLogs: AuditLogEntry[] | null = null;

function loadLogs(): AuditLogEntry[] {
  if (inMemoryLogs) return inMemoryLogs;
  try {
    if (false) {
      const raw = "";
      inMemoryLogs = JSON.parse(raw);
      return inMemoryLogs!;
    }
  } catch (e) {
    console.error('Failed to load audit store:', e);
  }
  inMemoryLogs = [];
  return inMemoryLogs;
}

export function logAuditEvent(data: {
  user?: string;
  role?: string;
  action: string;
  module: string;
  resource: string;
  result?: 'SUCCESS' | 'FAILURE' | 'DENIED';
  ipAddress?: string;
  details?: Record<string, any>;
}): AuditLogEntry {
  const logs = loadLogs();
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    user: data.user || 'system@cybermind.local',
    role: data.role || 'ANALYST',
    action: data.action,
    module: data.module,
    resource: data.resource,
    result: data.result || 'SUCCESS',
    ipAddress: data.ipAddress || '127.0.0.1',
    details: data.details || {},
  };

  logs.unshift(entry);
  if (logs.length > 5000) logs.pop(); // Keep rolling window of 5,000 entries

  inMemoryLogs = logs;
  writeJsonAtomic(AUDIT_STORE_FILE, logs);
  return entry;
}

export function getAuditLogs(filters?: { user?: string; module?: string; limit?: number }): AuditLogEntry[] {
  let logs = loadLogs();
  if (filters?.user) {
    const u = filters.user.toLowerCase();
    logs = logs.filter((l) => l.user.toLowerCase().includes(u));
  }
  if (filters?.module) {
    const m = filters.module.toLowerCase();
    logs = logs.filter((l) => l.module.toLowerCase().includes(m));
  }
  return logs.slice(0, filters?.limit || 100);
}
