import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('health')
export class HealthController {
  @Get('live')
  live() {
    return { status: 'ok', type: 'liveness', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async ready() {
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'error',
      type: 'readiness',
      timestamp: new Date().toISOString(),
      dependencies: { database: dbStatus },
    };
  }

  @Get('startup')
  startup() {
    return { status: 'ok', type: 'startup', timestamp: new Date().toISOString() };
  }
}
