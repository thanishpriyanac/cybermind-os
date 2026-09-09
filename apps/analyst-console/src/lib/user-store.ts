import fs from 'fs';
import path from 'path';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  ipAddress: string;
  deviceType: string;
  os: string;
  browser: string;
  networkType: string;
  location: string;
  loginTime: string;
  lastActiveAt: string;
  status: 'ACTIVE_NOW' | 'IDLE' | 'LOGGED_OUT';
  userAgent: string;
}

const PROJECT_ROOT = path.resolve(__dirname, '../../../../../../');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const STORE_FILE = path.join(DATA_DIR, 'user_store.json');

const INITIAL_SESSIONS: UserSession[] = [
  {
    id: 'sess-admin-01',
    email: 'admin@cybermind.local',
    name: 'Master Admin',
    role: 'SUPER_ADMIN',
    tenantId: 'cybermind-master-tenant',
    ipAddress: '127.0.0.1',
    deviceType: 'Desktop PC',
    os: 'Linux x86_64',
    browser: 'Chrome 128.0',
    networkType: 'Wi-Fi / Ethernet Broadband',
    location: 'Chennai Node (Server)',
    loginTime: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    status: 'ACTIVE_NOW',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  },
  {
    id: 'sess-thanish-02',
    email: 'thanishpriyan@gmail.com',
    name: 'Thanish Priyan',
    role: 'SUPER_ADMIN',
    tenantId: 'cybermind-master-tenant',
    ipAddress: '49.207.182.14',
    deviceType: 'Desktop PC',
    os: 'Linux / Parrot OS',
    browser: 'Chrome 128.0',
    networkType: 'Wi-Fi Broadband',
    location: 'Chennai, Tamil Nadu, IN',
    loginTime: new Date(Date.now() - 3600000).toISOString(),
    lastActiveAt: new Date().toISOString(),
    status: 'ACTIVE_NOW',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  },
];

let inMemorySessions: UserSession[] | null = null;

function loadSessions(): UserSession[] {
  if (inMemorySessions) return inMemorySessions;
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      inMemorySessions = JSON.parse(raw);
      return inMemorySessions!;
    }
  } catch (err) {
    console.error('Failed to read user_store.json file', err);
  }
  inMemorySessions = [...INITIAL_SESSIONS];
  saveSessions(inMemorySessions);
  return inMemorySessions;
}

function saveSessions(sessions: UserSession[]) {
  inMemorySessions = sessions;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write user_store.json file', err);
  }
}

export const userStore = {
  getSessions(): UserSession[] {
    return loadSessions();
  },

  recordSession(data: {
    email: string;
    name?: string;
    role?: string;
    tenantId?: string;
    ipAddress: string;
    userAgent: string;
  }): UserSession {
    const sessions = loadSessions();
    const now = new Date().toISOString();

    const ua = data.userAgent || '';
    let deviceType = 'Desktop PC';
    if (/mobile/i.test(ua)) deviceType = 'Mobile Phone';
    else if (/tablet|ipad/i.test(ua)) deviceType = 'Tablet';

    let os = 'Linux OS';
    if (/linux/i.test(ua)) os = 'Linux OS';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
    else if (/windows/i.test(ua)) os = 'Windows OS';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad/i.test(ua)) os = 'iOS';

    let browser = 'Chrome';
    if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/edg/i.test(ua)) browser = 'Edge';

    const rawIp = data.ipAddress || '127.0.0.1';
    const ip = rawIp.replace('::ffff:', '');
    let location = 'Local Platform Node';
    if (ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('192.168.') && !ip.startsWith('10.')) {
      location = `Remote Gateway (${ip})`;
    }

    const networkType = ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '127.0.0.1'
      ? 'Wi-Fi / LAN Connection'
      : 'High-Speed Broadband';

    const existing = sessions.find((s) => s.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      existing.ipAddress = ip;
      existing.deviceType = deviceType;
      existing.os = os;
      existing.browser = browser;
      existing.networkType = networkType;
      existing.location = location;
      existing.lastActiveAt = now;
      existing.status = 'ACTIVE_NOW';
      existing.userAgent = ua;
      saveSessions(sessions);
      return existing;
    }

    const newSession: UserSession = {
      id: `sess-${Date.now()}`,
      email: data.email,
      name: data.name || data.email.split('@')[0],
      role: data.role || 'SOC_ANALYST',
      tenantId: data.tenantId || 'cybermind-master-tenant',
      ipAddress: ip,
      deviceType,
      os,
      browser,
      networkType,
      location,
      loginTime: now,
      lastActiveAt: now,
      status: 'ACTIVE_NOW',
      userAgent: ua,
    };

    sessions.unshift(newSession);
    saveSessions(sessions);
    return newSession;
  },
};
