import { Controller, Post, Body, Param, Headers, UseGuards, Get } from '@nestjs/common';
import { ConnectorDomainService } from '../domain/services/connector.domain.service';
import { ExecutionEngine } from '../domain/services/execution-engine.service';

@Controller('connectors')
export class ConnectorController {
  constructor(
    private readonly connectorService: ConnectorDomainService,
    private readonly executionEngine: ExecutionEngine
  ) {}

  @Post()
  async createConnector(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: any,
  ) {
    return this.connectorService.createConnector(tenantId, body);
  }

  @Post(':id/validate')
  async validateConnector(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.connectorService.validateConnector(tenantId, id);
  }

  @Post(':id/run')
  async runConnector(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.executionEngine.runPipeline(tenantId, id);
  }
  
  @Get(':id/executions')
  async getExecutions(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    // Mock response for MVP
    return [];
  }
}
