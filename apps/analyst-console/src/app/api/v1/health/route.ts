export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

/** Real CPU usage: sample idle ticks over 100ms and compute percentage */
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
  const usagePct = Math.round((1 - idleDiff / totalDiff) * 100);
  return Math.max(0, Math.min(100, usagePct));
}

/** Real disk usage via `df -k /` */
async function getRealDiskStats(): Promise<{ totalGB: string; usedGB: string; freeGB: string; usedPct: number; primaryDisk?: string }> {
  try {
    const { stdout } = await execAsync("df -k / --output=size,used,avail,pcent,target 2>/dev/null | tail -1");
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
        primaryDisk: parts[4] || '/',
      };
    }
  } catch {
    // fallback: try /proc/mounts style
  }
  // Fallback to statvfs equivalent via /proc
  try {
    const { stdout } = await execAsync("df -BG / 2>/dev/null | tail -1");
    const parts = stdout.trim().split(/\s+/);
    if (parts.length >= 4) {
      const total = parseInt(parts[1].replace('G', ''), 10);
      const used = parseInt(parts[2].replace('G', ''), 10);
      const free = parseInt(parts[3].replace('G', ''), 10);
      const pct = total > 0 ? Math.round((used / total) * 100) : 0;
      return { totalGB: String(total), usedGB: String(used), freeGB: String(free), usedPct: pct };
    }
  } catch { /* skip */ }
  return { totalGB: '?', usedGB: '?', freeGB: '?', usedPct: 0 };
}

/** Real network interface I/O by reading /proc/net/dev */
async function getRealNetworkStats() {
  const ifaces = os.networkInterfaces();
  const interfaces: Array<{ name: string; ip: string; rxMB: number; txMB: number }> = [];

  // Read /proc/net/dev for real byte counters
  let rxBytesTotal = 0;
  let txBytesTotal = 0;
  try {
    const { stdout } = await execAsync("cat /proc/net/dev 2>/dev/null");
    const lines = stdout.split('\n').slice(2); // skip headers
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 10) continue;
      const ifaceName = parts[0].replace(':', '');
      if (ifaceName === 'lo') continue;
      const rxBytes = parseInt(parts[1], 10) || 0;
      const txBytes = parseInt(parts[9], 10) || 0;
      rxBytesTotal += rxBytes;
      txBytesTotal += txBytes;

      // Find IP from os.networkInterfaces()
      const osIface = ifaces[ifaceName];
      const ip = osIface?.find((a) => a.family === 'IPv4')?.address || 'N/A';
      interfaces.push({
        name: ifaceName,
        ip,
        rxMB: Math.round(rxBytes / 1024 / 1024),
        txMB: Math.round(txBytes / 1024 / 1024),
      });
    }
  } catch {
    // fallback: build from os.networkInterfaces() without byte counts
    for (const [name, addrs] of Object.entries(ifaces)) {
      if (name === 'lo' || !addrs) continue;
      const v4 = addrs.find((a) => a.family === 'IPv4');
      if (v4) interfaces.push({ name, ip: v4.address, rxMB: 0, txMB: 0 });
    }
  }

  const rxGB = (rxBytesTotal / 1024 / 1024 / 1024).toFixed(2);
  const txGB = (txBytesTotal / 1024 / 1024 / 1024).toFixed(2);
  const totalGB = ((rxBytesTotal + txBytesTotal) / 1024 / 1024 / 1024).toFixed(2);

  return {
    rxBytes: rxBytesTotal,
    txBytes: txBytesTotal,
    rxGB,
    txGB,
    totalConsumptionGB: totalGB,
    totalConsumptionMB: Math.round((rxBytesTotal + txBytesTotal) / 1024 / 1024),
    downloadSpeed: '—',
    uploadSpeed: '—',
    interfaces: interfaces.slice(0, 5),
  };
}

/** Get total running processes count */
async function getProcessCount(): Promise<number> {
  try {
    const { stdout } = await execAsync("ps -e --no-headers 2>/dev/null | wc -l");
    return parseInt(stdout.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

/** Linux distro name from /etc/os-release */
async function getDistroName(): Promise<string> {
  try {
    const { stdout } = await execAsync("grep PRETTY_NAME /etc/os-release 2>/dev/null | cut -d= -f2 | tr -d '\"'");
    return stdout.trim() || os.type();
  } catch {
    return os.type();
  }
}

/** Ping AI providers and measure real latency */
async function checkAiProviders(): Promise<Array<{ name: string; status: string; latencyMs?: number }>> {
  const providers: Array<{ name: string; url: string; envKey: string }> = [
    { name: 'Google Gemini', url: 'https://generativelanguage.googleapis.com/v1beta/models', envKey: 'GEMINI_API_KEY' },
    { name: 'Groq (Llama-3)', url: 'https://api.groq.com/openai/v1/models', envKey: 'GROQ_API_KEY' },
    { name: 'Anthropic Claude', url: 'https://api.anthropic.com/v1/models', envKey: 'ANTHROPIC_API_KEY' },
    { name: 'OpenAI (GPT-4)', url: 'https://api.openai.com/v1/models', envKey: 'OPENAI_API_KEY' },
  ];

  const results = await Promise.all(
    providers.map(async (p) => {
      const key = process.env[p.envKey];
      if (!key) return { name: p.name, status: 'not_configured' };

      const t0 = Date.now();
      try {
        const headers: Record<string, string> = { 'User-Agent': 'CyberMind-OS/2.0' };
        if (p.envKey === 'ANTHROPIC_API_KEY') {
          headers['x-api-key'] = key;
          headers['anthropic-version'] = '2023-06-01';
        } else if (p.envKey !== 'GEMINI_API_KEY') {
          headers['Authorization'] = `Bearer ${key}`;
        }

        const res = await fetch(`${p.url}?key=${p.envKey === 'GEMINI_API_KEY' ? key : ''}`, {
          headers,
          signal: AbortSignal.timeout(5000),
        });
        const latencyMs = Date.now() - t0;
        return { name: p.name, status: res.ok ? 'operational' : 'degraded', latencyMs };
      } catch {
        const latencyMs = Date.now() - t0;
        return { name: p.name, status: 'error', latencyMs };
      }
    })
  );

  return results;
}

/** Check data store files on disk */
function getDataStoreStatus(): Record<string, { exists: boolean; sizeKB?: number; records?: number }> {
  const dataDir = path.join(process.cwd(), 'data');
  const storeFiles = [
    'copilot_store.json',
    'cve_store.json',
    'ip_store.json',
    'firewall_store.json',
    'qbr_store.json',
    'vapt_store.json',
    'learning_store.json',
  ];

  const result: Record<string, { exists: boolean; sizeKB?: number; records?: number }> = {};
  for (const file of storeFiles) {
    try {
      const filePath = path.join(dataDir, file);
      const stat = fs.statSync(filePath);
      const sizeKB = Math.round(stat.size / 1024);
      // Try to read record count
      let records: number | undefined;
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        // Count array entries in the main data field
        const mainArr = parsed.cves || parsed.conversations || parsed.records || parsed.items
          || parsed.assessments || parsed.reports || parsed.articles || null;
        if (Array.isArray(mainArr)) records = mainArr.length;
      } catch { /* skip */ }
      result[file] = { exists: true, sizeKB, records };
    } catch {
      result[file] = { exists: false };
    }
  }
  return result;
}

export async function GET() {
  const [cpuUsage, diskStats, networkStats, processCount, distro, aiProviders] = await Promise.all([
    getRealCpuUsage(),
    getRealDiskStats(),
    getRealNetworkStats(),
    getProcessCount(),
    getDistroName(),
    checkAiProviders(),
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

  return NextResponse.json(
    {
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
      cpu: {
        usagePct: cpuUsage,
        count: cpus.length,
      },
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
      networkSpeed: {
        latencyMs: null,
        status: 'LIVE',
        note: 'Real per-interface Rx/Tx from /proc/net/dev',
      },
      nodeProcess: {
        pid: process.pid,
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        rssMB: Math.round(mem.rss / 1024 / 1024),
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
      },
      aiProviders,
      dataStores,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
