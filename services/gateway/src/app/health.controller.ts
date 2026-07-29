import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('live')
  live() {
    return { status: 'ok', type: 'liveness', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  ready() {
    // Check Redis connection or downstream basic availability if needed
    // For now, assume ready if the process is up
    return { status: 'ok', type: 'readiness', timestamp: new Date().toISOString() };
  }

  @Get('startup')
  startup() {
    return { status: 'ok', type: 'startup', timestamp: new Date().toISOString() };
  }
}
