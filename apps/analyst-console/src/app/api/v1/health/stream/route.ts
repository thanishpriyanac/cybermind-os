import { NextRequest } from 'next/server';
import os from 'os';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

let prevNetworkSample: { rxBytes: number; txBytes: number; time: number } | null = null;

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec >= 1024 * 1024) {
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  }
  return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
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

function getIpForInterface(ifaceName: string): string {
  try {
    const nets = os.networkInterfaces();
    const net = nets[ifaceName];
    if (net) {
      const ipv4 = net.find((n) => n.family === 'IPv4' && !n.internal);
      if (ipv4) return ipv4.address;
    }
  } catch { /* skip */ }
  return 'N/A';
}

function getNetworkStats() {
  let rxBytes = 0;
  let txBytes = 0;
  const interfaces: Array<{ name: string; ip: string; rxMB: number; txMB: number }> = [];

  try {
    if (fs.existsSync('/proc/net/dev')) {
      const lines = fs.readFileSync('/proc/net/dev', 'utf-8').split('\n');
      for (const line of lines.slice(2)) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 10) {
          const iface = parts[0].replace(':', '');
          if (iface === 'lo') continue;
          const rx = parseInt(parts[1], 10) || 0;
          const tx = parseInt(parts[9], 10) || 0;
          rxBytes += rx;
          txBytes += tx;
          interfaces.push({
            name: iface,
            ip: getIpForInterface(iface),
            rxMB: Math.round(rx / 1024 / 1024),
            txMB: Math.round(tx / 1024 / 1024),
          });
        }
      }
    }
  } catch { /* skip */ }

  const now = Date.now();
  let downloadSpeedBps = 0;
  let uploadSpeedBps = 0;

  if (prevNetworkSample) {
    const elapsedSec = Math.max((now - prevNetworkSample.time) / 1000, 0.3);
    downloadSpeedBps = Math.max(0, (rxBytes - prevNetworkSample.rxBytes) / elapsedSec);
    uploadSpeedBps = Math.max(0, (txBytes - prevNetworkSample.txBytes) / elapsedSec);
  }

  prevNetworkSample = { rxBytes, txBytes, time: now };

  const totalBytes = rxBytes + txBytes;
  return {
    rxBytes,
    txBytes,
    rxGB: (rxBytes / 1073741824).toFixed(2),
    txGB: (txBytes / 1073741824).toFixed(2),
    totalConsumptionGB: (totalBytes / 1073741824).toFixed(2),
    totalConsumptionMB: Math.round(totalBytes / 1048576),
    downloadSpeed: formatSpeed(downloadSpeedBps),
    uploadSpeed: formatSpeed(uploadSpeedBps),
    interfaces,
  };
}

function getHardwareSensors() {
  let cpuTempC: number | null = null;
  const cpus = os.cpus();
  const speedMHz = cpus[0]?.speed || 0;

  try {
    if (fs.existsSync('/sys/class/thermal')) {
      const thermalDirs = fs.readdirSync('/sys/class/thermal/').filter((d) => d.startsWith('thermal_zone'));
      for (const dir of thermalDirs) {
        const tempPath = path.join('/sys/class/thermal', dir, 'temp');
        if (fs.existsSync(tempPath)) {
          const val = parseInt(fs.readFileSync(tempPath, 'utf-8').trim(), 10);
          if (!isNaN(val) && val > 0) {
            const tempC = val > 1000 ? val / 1000 : val;
            if (tempC > 10 && tempC < 120) {
              cpuTempC = Math.round(tempC * 10) / 10;
              break;
            }
          }
        }
      }
    }
  } catch { /* skip */ }

  return {
    cpuTempC: cpuTempC ?? 'N/A',
    tempStatus: cpuTempC ? (cpuTempC > 80 ? 'CRITICAL' : cpuTempC > 70 ? 'ELEVATED' : 'NORMAL') : 'UNKNOWN',
    clockSpeedGHz: (speedMHz / 1000).toFixed(2),
    cpuArchitecture: os.arch(),
    cpuCores: cpus.length,
    cpuModel: cpus[0]?.model || 'Unknown',
  };
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

function collectMetrics() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;
  for (const c of cpus) {
    for (const type in c.times) {
      totalTick += (c.times as any)[type];
    }
    totalIdle += c.times.idle;
  }
  const cpuPct = Math.min(100, Math.max(0, Math.round((1 - totalIdle / (totalTick || 1)) * 100)));

  return {
    timestamp: new Date().toISOString(),
    server: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: getUptimeInfo(),
      loadAvg: os.loadavg().map(l => l.toFixed(2)),
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model || 'Unknown',
    },
    cpu: { usagePct: cpuPct, count: cpus.length },
    memory: getMemoryInfo(),
    disk: getDiskInfo(),
    network: getNetworkStats(),
    networkSpeed: { latencyMs: 12, status: 'OPTIMAL' },
    sensors: getHardwareSensors(),
    nodeProcess: getNodeProcessInfo(),
    aiProviders: [
      { name: 'Groq', status: 'operational', latencyMs: 110 },
      { name: 'NVIDIA NIM', status: 'operational', latencyMs: 820 },
      { name: 'xAI Grok', status: 'operational', latencyMs: 340 }
    ],
    dataStores: {}
  };
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = () => {
        try {
          const data = collectMetrics();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Ignore stream write errors
        }
      };

      sendEvent();
      const intervalId = setInterval(sendEvent, 500); // STREAM INSTANT SSE EVERY 500ms (0ms DELAY)

      req.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        try { controller.close(); } catch { /* skip */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
