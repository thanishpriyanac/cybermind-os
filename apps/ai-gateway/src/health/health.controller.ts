import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  checkHealth() {
    return { status: 'ok' };
  }

  @Get('ready')
  checkReady() {
    return { status: 'ok' };
  }

  @Get('live')
  checkLive() {
    return { status: 'ok' };
  }
}
