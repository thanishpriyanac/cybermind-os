import fs from 'fs';
import path from 'path';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: {
    model?: string;
    provider?: string;
    confidence?: number;
    latencyMs?: number;
    traceId?: string;
  };
}

export interface CopilotConversation {
  id: string;
  title: string;
  model: string;
  modelKey: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  tenantId: string;
  userId: string;
  messages: CopilotMessage[];
}

const STORE_FILE = path.join(process.cwd(), 'copilot_store.json');

// Default seeded conversations for security analysts
const DEFAULT_CONVERSATIONS: CopilotConversation[] = [
  {
    id: 'conv-seeded-1',
    title: 'Ransomware Canary Triggered - DB-01',
    model: 'Auto (Smart Router)',
    modelKey: 'auto',
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    lastMessageAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    tenantId: 'cybermind-master-tenant',
    userId: 'admin@cybermind.local',
    messages: [
      {
        id: 'msg-1-1',
        role: 'user',
        content: 'Explain the Ransomware Canary alert triggered on host DB-01.',
        createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      },
      {
        id: 'msg-1-2',
        role: 'assistant',
        content: `### 🚨 Incident Summary: Ransomware Canary Decoy Accessed

**Host**: \`DB-01.corp.local\` (10.0.4.12)  
**Severity**: **CRITICAL** (Score: 9.8/10)  
**MITRE ATT&CK Mapping**: 
- **T1486** — *Data Encrypted for Impact*
- **T1059.001** — *PowerShell Execution*
- **T1078** — *Valid Accounts*

#### Findings
1. **Canary Trap Breach**: A honey-token file \`/var/data/shared/finance_canary.xlsx\` was opened and modified by unauthorized process \`svchost_update.exe\` (PID 4912).
2. **Entropy Anomaly**: File modification telemetry detected high entropy (7.98/8.0), characteristic of AES-CBC encryption.
3. **Outbound C2**: Process established outbound connection to \`185.220.101.5:443\` (Known Tor Exit Node).

#### Recommended Immediate Actions:
1. 🛡️ **Network Quarantine**: Execute SOAR playbook \`PB-ISOLATE-HOST\` to isolate DB-01.
2. 🔑 **Revoke Credentials**: Force password reset and session invalidation for service account \`svc_backup\`.
3. 💾 **Volume Snapshot**: Take forensic snapshot of EBS volume \`vol-098df23a\` before memory wipe.`,
        createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
        metadata: {
          model: 'Auto (Smart Router)',
          provider: 'CYBERMIND Security Model',
          confidence: 0.98,
          latencyMs: 142,
        },
      },
    ],
  },
  {
    id: 'conv-seeded-2',
    title: 'SSH Brute Force Threat Intelligence',
    model: 'Auto (Smart Router)',
    modelKey: 'auto',
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
    lastMessageAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
    tenantId: 'cybermind-master-tenant',
    userId: 'admin@cybermind.local',
    messages: [
      {
        id: 'msg-2-1',
        role: 'user',
        content: 'What is the risk assessment for IP 198.51.100.23 attacking edge gateway?',
        createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
      },
      {
        id: 'msg-2-2',
        role: 'assistant',
        content: `### 🌐 Threat Intel Report: 198.51.100.23

- **Classification**: Malicious Botnet Node (Mirai / Medusa variant)
- **Threat Score**: **88/100 (HIGH RISK)**
- **Geo-Location**: Frankfurt, Germany (AS20473)
- **Observed Behavior**: 1,420 failed SSH authentication attempts across 3 minutes targeting user accounts \`root\`, \`admin\`, \`ubuntu\`, \`deploy\`.

#### Automated Response:
- Edge gateway firewall dynamically injected temporary IP drop rule for 24 hours.
- Fail2ban jail \`sshd-ddos\` active. No breaches detected.`,
        createdAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
        metadata: {
          model: 'Auto (Smart Router)',
          provider: 'CyberMind GeoIP & Threat Intel',
          confidence: 0.96,
          latencyMs: 89,
        },
      },
    ],
  },
];

let inMemoryStore: CopilotConversation[] | null = null;

function loadStore(): CopilotConversation[] {
  if (inMemoryStore) return inMemoryStore;

  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      inMemoryStore = JSON.parse(raw);
      return inMemoryStore!;
    }
  } catch (err) {
    console.error('Failed to read copilot store file, using defaults', err);
  }

  inMemoryStore = [...DEFAULT_CONVERSATIONS];
  saveStore(inMemoryStore);
  return inMemoryStore;
}

function saveStore(store: CopilotConversation[]) {
  inMemoryStore = store;
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write copilot store file', err);
  }
}

export const copilotStore = {
  getConversations(tenantId?: string, userId?: string) {
    const store = loadStore();
    return store
      .filter((conv) => {
        if (tenantId && conv.tenantId && conv.tenantId !== tenantId) {
          return false;
        }
        if (userId && conv.userId && conv.userId !== userId) {
          return false;
        }
        return true;
      })
      .map((conv) => ({
        id: conv.id,
        title: conv.title,
        model: conv.model,
        modelKey: conv.modelKey,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        lastMessageAt: conv.lastMessageAt,
        messageCount: conv.messages.length,
      }));
  },

  getConversation(id: string, tenantId?: string, userId?: string) {
    const store = loadStore();
    const conv = store.find((c) => c.id === id);
    if (!conv) return null;
    if (tenantId && conv.tenantId && conv.tenantId !== tenantId) return null;
    if (userId && conv.userId && conv.userId !== userId) return null;
    return conv;
  },

  getMessages(conversationId: string, tenantId?: string, userId?: string): CopilotMessage[] {
    const conv = this.getConversation(conversationId, tenantId, userId);
    return conv ? conv.messages : [];
  },

  createConversation(params: {
    id?: string;
    title?: string;
    model?: string;
    modelKey?: string;
    tenantId?: string;
    userId?: string;
  }): CopilotConversation {
    const store = loadStore();
    const id = params.id || `conv-${Date.now()}`;
    const existing = store.find((c) => c.id === id);
    if (existing) return existing;

    const now = new Date().toISOString();
    const newConv: CopilotConversation = {
      id,
      title: params.title || 'New Security Analysis',
      model: params.model || 'Auto (Smart Router)',
      modelKey: params.modelKey || 'auto',
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      tenantId: params.tenantId || 'cybermind-master-tenant',
      userId: params.userId || 'admin@cybermind.local',
      messages: [],
    };

    store.unshift(newConv);
    saveStore(store);
    return newConv;
  },

  addMessage(
    conversationId: string,
    message: {
      role: 'user' | 'assistant' | 'system';
      content: string;
      metadata?: any;
    },
    options?: {
      titleIfFirst?: string;
      model?: string;
      modelKey?: string;
      tenantId?: string;
      userId?: string;
    }
  ): CopilotMessage {
    const store = loadStore();
    let conv = store.find((c) => c.id === conversationId);

    if (!conv) {
      conv = this.createConversation({
        id: conversationId,
        title: options?.titleIfFirst,
        model: options?.model,
        modelKey: options?.modelKey,
        tenantId: options?.tenantId,
        userId: options?.userId,
      });
    }

    const now = new Date().toISOString();
    const newMessage: CopilotMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: message.role,
      content: message.content,
      createdAt: now,
      metadata: message.metadata,
    };

    conv.messages.push(newMessage);
    conv.updatedAt = now;
    conv.lastMessageAt = now;

    if (conv.messages.length === 1 && message.role === 'user') {
      const summaryTitle = message.content.slice(0, 36).trim();
      conv.title = summaryTitle.length < message.content.length ? `${summaryTitle}...` : summaryTitle;
    }

    saveStore(store);
    return newMessage;
  },

  deleteConversation(id: string, tenantId?: string, userId?: string): boolean {
    const store = loadStore();
    const index = store.findIndex((c) => {
      if (c.id !== id) return false;
      if (tenantId && c.tenantId && c.tenantId !== tenantId) return false;
      if (userId && c.userId && c.userId !== userId) return false;
      return true;
    });
    if (index !== -1) {
      store.splice(index, 1);
      saveStore(store);
      return true;
    }
    return false;
  },
};
