import fs from 'fs';
import path from 'path';

export interface AlertItem {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'investigating' | 'resolved' | 'closed';
  source: string;
  createdAt: string;
  asset: string;
}

const PROJECT_ROOT = path.resolve(process.cwd(), '../../../../');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const STORE_FILE = path.join(DATA_DIR, 'alert_store.json');

let inMemoryAlerts: AlertItem[] | null = null;

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'alt-9821-rc',
    title: 'Ransomware Canary Honey-Token Accessed',
    severity: 'critical',
    status: 'new',
    source: 'File Integrity & Canary Sensor',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    asset: 'DB-01.corp.local',
  },
  {
    id: 'alt-8412-sh',
    title: 'Distributed SSH Brute Force Against Perimeter Gateway',
    severity: 'high',
    status: 'investigating',
    source: 'Perimeter Firewall EDR',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    asset: 'gw-ext-01.vellprint.in',
  },
  {
    id: 'alt-7301-ps',
    title: 'Suspicious Obfuscated PowerShell Execution',
    severity: 'high',
    status: 'new',
    source: 'CrowdStrike Falcon Sensor',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    asset: 'WKSTN-FIN-09',
  },
  {
    id: 'alt-5120-lg',
    title: 'Anomalous Multi-Geo Concurrent Authentication',
    severity: 'medium',
    status: 'investigating',
    source: 'Okta Identity Provider',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    asset: 'dev-iam-proxy',
  },
  {
    id: 'alt-3419-dn',
    title: 'High-Volume DNS TXT Query Exfiltration Canary',
    severity: 'medium',
    status: 'resolved',
    source: 'CoreDNS Resolver Logs',
    createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    asset: 'k8s-dns-coredns-7c9f',
  },
  {
    id: 'alt-1092-sc',
    title: 'Internal Subnet Port 445 SMB Reconnaissance Probe',
    severity: 'low',
    status: 'closed',
    source: 'Zeek Network Monitor',
    createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    asset: 'internal-vlan-20',
  },
];

export function loadAlerts(): AlertItem[] {
  if (inMemoryAlerts) return inMemoryAlerts;

  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      inMemoryAlerts = JSON.parse(raw);
      return inMemoryAlerts!;
    }
  } catch (err) {
    console.error('Failed to read alert store file', err);
  }

  inMemoryAlerts = [...INITIAL_ALERTS];
  saveAlerts(inMemoryAlerts);
  return inMemoryAlerts;
}

export function saveAlerts(alerts: AlertItem[]) {
  inMemoryAlerts = alerts;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(alerts, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write alert store file', err);
  }
}

export function acknowledgeAllAlerts(): AlertItem[] {
  const alerts = loadAlerts();
  const updated = alerts.map(a => ({
    ...a,
    status: a.status === 'new' ? ('investigating' as const) : a.status,
  }));
  saveAlerts(updated);
  return updated;
}

export function updateAlertStatus(id: string, status: AlertItem['status']): AlertItem | null {
  const alerts = loadAlerts();
  const target = alerts.find(a => a.id === id);
  if (!target) return null;
  target.status = status;
  saveAlerts(alerts);
  return target;
}
