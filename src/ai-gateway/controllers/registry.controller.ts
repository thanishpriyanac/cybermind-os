import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegistryService } from '../registry/registry.service';
import { CreateProviderModelDto, UpdateModelHealthDto } from '../dto/gateway.dto';

@ApiTags('Admin - Model Registry')
@Controller('admin/models')
export class RegistryController {
  constructor(private readonly registryService: RegistryService) {}

  @Get()
  @ApiOperation({ summary: 'List all registered AI Provider models' })
  async getAllModels() {
    return this.registryService.getAllModels();
  }

  @Post()
  @ApiOperation({ summary: 'Register or update AI Provider model' })
  async registerModel(@Body() dto: CreateProviderModelDto) {
    return this.registryService.registerOrUpdateModel(dto);
  }

  @Patch(':key/toggle')
  @ApiOperation({ summary: 'Enable or disable a provider model' })
  async toggleModel(@Param('key') modelKey: string, @Body('isActive') isActive: boolean) {
    return this.registryService.toggleModelActive(modelKey, isActive);
  }

  @Patch(':key/health')
  @ApiOperation({ summary: 'Update model health status' })
  async updateHealth(@Param('key') modelKey: string, @Body() dto: UpdateModelHealthDto) {
    return this.registryService.updateHealth(modelKey, dto.healthStatus, dto.healthStatus === 'ONLINE');
  }
}
