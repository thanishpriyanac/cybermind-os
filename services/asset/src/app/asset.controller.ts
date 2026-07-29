import { Controller, Get, Post, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { AssetDomainService } from '../domain/services/asset.domain.service';

@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetDomainService) {}

  @Post()
  async createAsset(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') actorId: string,
    @Body() body: any,
  ) {
    return this.assetService.createAsset(tenantId, actorId || 'SYSTEM', body);
  }

  @Get(':id')
  async getAsset(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.assetService.getAsset(tenantId, id);
  }

  @Post(':id/relationships')
  async addRelationship(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') actorId: string,
    @Param('id') id: string,
    @Body() body: { targetAssetId: string; type: string },
  ) {
    return this.assetService.addRelationship(tenantId, actorId || 'SYSTEM', id, body.targetAssetId, body.type);
  }

  @Get(':id/relationships')
  async getRelationships(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.assetService.getRelationships(tenantId, id);
  }
}
