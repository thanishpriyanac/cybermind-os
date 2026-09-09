import { NextResponse } from 'next/server';
import os from 'os';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const cpus1 = os.cpus();
    setTimeout(() => {
      const cpus2 = os.cpus();
      let totalIdle = 0, totalTick = 0;
      for (let i = 0; i < cpus1.length; i++) {
        const c1 = cpus1[i].times;
        const c2 = cpus2[i].times;
        const idle = c2.idle - c1.idle;
        const total = Object.values(c2).reduce((a, b) => a + b, 0) -
                      Object.values(c1).reduce((a, b) => a + b, 0);
        totalIdle += idle;
        totalTick += total;
      }
      resolve(Math.round((1 - totalIdle / totalTick) * 100));
    }, 300);
  });
}

function getMemoryInfo() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    totalMB: Math.round(total / 1024 / 1024),
    usedMB: Math.round(used / 1024 / 1024),
    freeMB: Math.round(free / 1024 / 1024),
    usedPct: Math.round((used / total) * 100),
  };
}

function getDiskInfo() {
  try {
    const statSync = fs.statfsSync('/');
    const total = statSync.bsize * statSync.blocks;
    const free = statSync.bsize * statSync.bfree;
    const used = total - free;
    return {
      totalGB: (total / 1024 / 1024 / 1024).toFixed(1),
      usedGB: (used / 1024 / 1024 / 1024).toFixed(1),
      freeGB: (free / 1024 / 1024 / 1024).toFixed(1),
      usedPct: Math.round((used / total) * 100),
    };
  } catch {
    return { totalGB: 'N/A', usedGB: 'N/A', freeGB: 'N/A', usedPct: 0 };
  }
}

function getUptimeInfo() {
  const uptimeSecs = os.uptime();
  const days = Math.floor(uptimeSecs / 86400);
  const hours = Math.floor((uptimeSecs % 86400) / 3600);
  const mins = Math.floor((uptimeSecs % 3600) / 60);
  return `${days}d ${hours}h ${mins}m`;
}

async function checkAiProviders() {
  const providers = [
    { name: 'Groq', url: 'https://api.groq.com/openai/v1/models', key: process.env.GROQ_API_KEY },
    { name: 'NVIDIA NIM', url: 'https://integrate.api.nvidia.com/v1/models', key: process.env.NVIDIA_API_KEY_PRO },
    { name: 'xAI Grok', url: 'https://api.x.ai/v1/models', key: process.env.XAI_API_KEY },
  ];

  const results = await Promise.allSettled(
    providers.map(async (p) => {
      if (!p.key) return { name: p.name, status: 'not_configured' };
      const start = Date.now();
      const res = await fetch(p.url, {
        headers: { Authorization: `Bearer ${p.key}` },
        signal: AbortSignal.timeout(4000),
      });
      return {
        name: p.name,
        status: res.ok ? 'operational' : 'degraded',
        latencyMs: Date.now() - start,
      };
    })
  );

  return results.map((r, i) => {
    if (r.status === 'fulfilled') {
      return r.value;
    }
    return { name: providers[i].name, status: 'error' };
  });
}

function getNodeProcessInfo() {
  const mem = process.memoryUsage();
  return {
    pid: process.pid,
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    rssMB: Math.round(mem.rss / 1024 / 1024),
    uptimeSeconds: Math.round(process.uptime()),
    nodeVersion: process.version,
  };
}

function getDataStoreInfo() {
  const dataDir = path.resolve(process.cwd(), 'data');
  const stores: Record<string, { exists: boolean; sizeKB?: number; records?: number }> = {};
  const storeFiles = ['copilot_store.json', 'cve_store.json', 'ip_store.json', 'firewall_store.json', 'qbr_store.json'];
  
  for (const file of storeFiles) {
    const fp = path.join(dataDir, file);
    try {
      if (fs.existsSync(fp)) {
        const stat = fs.statSync(fp);
        const content = JSON.parse(fs.readFileSync(fp, 'utf-8'));
        const records = Array.isArray(content) ? content.length :
          (content.conversations?.length || content.cves?.length || content.investigations?.length ||
           content.assessments?.length || content.reports?.length || 0);
        stores[file] = { exists: true, sizeKB: Math.round(stat.size / 1024), records };
      } else {
        stores[file] = { exists: false };
      }
    } catch {
      stores[file] = { exists: false };
    }
  }
  return stores;
}

export async function GET() {
  const [cpuPct, aiProviders] = await Promise.all([
    getCpuUsage(),
    checkAiProviders(),
  ]);

  const memory = getMemoryInfo();
  const disk = getDiskInfo();
  const uptime = getUptimeInfo();
  const nodeProcess = getNodeProcessInfo();
  const dataStores = getDataStoreInfo();
  const loadAvg = os.loadavg();
  const cpuCount = os.cpus().length;
  const cpuModel = os.cpus()[0]?.model || 'Unknown';

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    server: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime,
      loadAvg: loadAvg.map(l => l.toFixed(2)),
      cpuCount,
      cpuModel,
    },
    cpu: { usagePct: cpuPct, count: cpuCount },
    memory,
    disk,
    nodeProcess,
    aiProviders,
    dataStores,
  });
}
