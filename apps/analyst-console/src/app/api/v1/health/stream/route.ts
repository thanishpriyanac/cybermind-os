export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function getRealCpuUsage(): Promise<number> {
  function cpuAvg() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    for (const cpu of cpus) {
      for (const type of Object.keys(cpu.times) as Array<keyof typeof cpu.times>) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
  }
  const start = cpuAvg();
  await new Promise((r) => setTimeout(r, 100));
  const end = cpuAvg();
  const idleDiff = end.idle - start.idle;
  const totalDiff = end.total - start.total;
  if (totalDiff === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - idleDiff / totalDiff) * 100)));
}

async function getRealDiskStats() {
  try {
    const { stdout } = await execAsync("df -k / --output=size,used,avail,pcent 2>/dev/null | tail -1");
    const parts = stdout.trim().split(/\s+/);
    if (parts.length >= 4) {
      const totalKB = parseInt(parts[0], 10);
      const usedKB = parseInt(parts[1], 10);
      const freeKB = parseInt(parts[2], 10);
      const pct = parseInt(parts[3].replace('%', ''), 10);
      return {
        totalGB: (totalKB / 1024 / 1024).toFixed(1),
        usedGB: (usedKB / 1024 / 1024).toFixed(1),
        freeGB: (freeKB / 1024 / 1024).toFixed(1),
        usedPct: isNaN(pct) ? 0 : pct,
      };
    }
  } catch { /* skip */ }
  return { totalGB: '?', usedGB: '?', freeGB: '?', usedPct: 0 };
}

async function getRealNetworkStats() {
  const ifaces = os.networkInterfaces();
  const interfaces: Array<{ name: string; ip: string; rxMB: number; txMB: number }> = [];
  let rxBytesTotal = 0;
  let txBytesTotal = 0;
  try {
    const { stdout } = await execAsync("cat /proc/net/dev 2>/dev/null");
    const lines = stdout.split('\n').slice(2);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 10) continue;
      const ifaceName = parts[0].replace(':', '');
      if (ifaceName === 'lo') continue;
      const rxBytes = parseInt(parts[1], 10) || 0;
      const txBytes = parseInt(parts[9], 10) || 0;
      rxBytesTotal += rxBytes;
      txBytesTotal += txBytes;
      const osIface = ifaces[ifaceName];
      const ip = osIface?.find((a) => a.family === 'IPv4')?.address || 'N/A';
      interfaces.push({ name: ifaceName, ip, rxMB: Math.round(rxBytes / 1024 / 1024), txMB: Math.round(txBytes / 1024 / 1024) });
    }
  } catch {
    for (const [name, addrs] of Object.entries(ifaces)) {
      if (name === 'lo' || !addrs) continue;
      const v4 = addrs.find((a) => a.family === 'IPv4');
      if (v4) interfaces.push({ name, ip: v4.address, rxMB: 0, txMB: 0 });
    }
  }
  return {
    rxBytes: rxBytesTotal,
    txBytes: txBytesTotal,
    rxGB: (rxBytesTotal / 1024 / 1024 / 1024).toFixed(2),
    txGB: (txBytesTotal / 1024 / 1024 / 1024).toFixed(2),
    totalConsumptionGB: ((rxBytesTotal + txBytesTotal) / 1024 / 1024 / 1024).toFixed(2),
    totalConsumptionMB: Math.round((rxBytesTotal + txBytesTotal) / 1024 / 1024),
    downloadSpeed: '—',
    uploadSpeed: '—',
    interfaces: interfaces.slice(0, 5),
  };
}

async function getProcessCount(): Promise<number> {
  try {
    const { stdout } = await execAsync("ps -e --no-headers 2>/dev/null | wc -l");
    return parseInt(stdout.trim(), 10) || 0;
  } catch { return 0; }
}

async function getDistroName(): Promise<string> {
  try {
    const { stdout } = await execAsync("grep PRETTY_NAME /etc/os-release 2>/dev/null | cut -d= -f2 | tr -d '\"'");
    return stdout.trim() || os.type();
  } catch { return os.type(); }
}

function getDataStoreStatus(): Record<string, { exists: boolean; sizeKB?: number; records?: number }> {
  const dataDir = path.join(process.cwd(), 'data');
  const storeFiles = ['copilot_store.json', 'cve_store.json', 'ip_store.json', 'firewall_store.json', 'qbr_store.json', 'vapt_store.json', 'learning_store.json'];
  const result: Record<string, { exists: boolean; sizeKB?: number; records?: number }> = {};
  for (const file of storeFiles) {
    try {
      const stat = fs.statSync(path.join(dataDir, file));
      const sizeKB = Math.round(stat.size / 1024);
      let records: number | undefined;
      try {
        const parsed = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
        const arr = parsed.cves || parsed.conversations || parsed.items || parsed.assessments || parsed.articles || null;
        if (Array.isArray(arr)) records = arr.length;
      } catch { /* skip */ }
      result[file] = { exists: true, sizeKB, records };
    } catch {
      result[file] = { exists: false };
    }
  }
  return result;
}

export async function GET(_req: NextRequest) {
  const [cpuUsage, diskStats, networkStats, processCount, distro] = await Promise.all([
    getRealCpuUsage(),
    getRealDiskStats(),
    getRealNetworkStats(),
    getProcessCount(),
    getDistroName(),
  ]);

  const cpus = os.cpus();
  const totalMemBytes = os.totalmem();
  const freeMemBytes = os.freemem();
  const usedMemBytes = totalMemBytes - freeMemBytes;
  const loadAvg = os.loadavg();
  const mem = process.memoryUsage();
  const uptimeSecs = os.uptime();
  const days = Math.floor(uptimeSecs / 86400);
  const hours = Math.floor((uptimeSecs % 86400) / 3600);
  const mins = Math.floor((uptimeSecs % 3600) / 60);
  const uptimeStr = days > 0 ? `${days}d ${hours}h ${mins}m` : `${hours}h ${mins}m`;
  const dataStores = getDataStoreStatus();

  const snapshot = JSON.stringify({
    timestamp: new Date().toISOString(),
    server: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: uptimeStr,
      loadAvg: loadAvg.map((l) => l.toFixed(2)),
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model || 'Unknown',
      distro,
      kernel: os.release(),
    },
    cpu: { usagePct: cpuUsage, count: cpus.length },
    memory: {
      totalMB: Math.round(totalMemBytes / 1024 / 1024),
      usedMB: Math.round(usedMemBytes / 1024 / 1024),
      freeMB: Math.round(freeMemBytes / 1024 / 1024),
      usedPct: Math.round((usedMemBytes / totalMemBytes) * 100),
      availableMB: Math.round(freeMemBytes / 1024 / 1024),
    },
    disk: diskStats,
    systemProcesses: { totalProcesses: processCount },
    network: networkStats,
    networkSpeed: { latencyMs: null, status: 'LIVE', note: 'Real /proc/net/dev metrics' },
    nodeProcess: {
      pid: process.pid,
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
    },
    aiProviders: [
      { name: 'Google Gemini', status: process.env.GEMINI_API_KEY ? 'operational' : 'not_configured' },
      { name: 'Groq (Llama-3)', status: process.env.GROQ_API_KEY ? 'operational' : 'not_configured' },
      { name: 'Anthropic Claude', status: process.env.ANTHROPIC_API_KEY ? 'operational' : 'not_configured' },
    ],
    dataStores,
  });

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(`data: ${snapshot}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
