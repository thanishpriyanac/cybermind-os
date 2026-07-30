import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'System Health Check' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'CYBERMIND AI API Core',
      version: '2.0.0',
      uptime: process.uptime(),
    };
  }
}
